// src/services/webrtc.service.ts
// WebRTC service for one-way video streaming (candidate -> interviewer)

export type SignalMessageType = 
    | 'connected'
    | 'peer-connected'
    | 'peer-disconnected'
    | 'video-request'
    | 'video-accept'
    | 'video-reject'
    | 'video-stop'
    | 'offer'
    | 'answer'
    | 'ice-candidate'
    | 'error';

export interface SignalMessage {
    type: SignalMessageType;
    payload?: unknown;
    role?: 'interviewer' | 'candidate';
    sessionId?: string;
    message?: string;
}

type MessageHandler = (message: SignalMessage) => void;

// ICE servers configuration (STUN only for free tier)
const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
];

export class WebRTCService {
    private ws: WebSocket | null = null;
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private messageHandlers: Set<MessageHandler> = new Set();
    private sessionId: string = '';
    private role: 'interviewer' | 'candidate' | null = null;

    // ============================================
    // WebSocket Signaling
    // ============================================

    async connect(sessionId: string, token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.sessionId = sessionId;
            
            // Construct WebSocket URL - connect directly to backend
            // In development, backend runs on port 3001
            // In production, use the same host as the page
            let wsUrl: string;
            
            if (import.meta.env.DEV) {
                // Development: connect directly to backend on port 3001
                wsUrl = `ws://localhost:3001/api/v1/video/signal/${sessionId}?token=${encodeURIComponent(token)}`;
            } else {
                // Production: use same host with appropriate protocol
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                wsUrl = `${protocol}//${window.location.host}/api/v1/video/signal/${sessionId}?token=${encodeURIComponent(token)}`;
            }
            
            console.log('[WebRTC] Connecting to:', wsUrl);
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('[WebRTC] WebSocket connected');
                resolve();
            };

            this.ws.onerror = (error) => {
                console.error('[WebRTC] WebSocket error:', error);
                reject(new Error('Failed to connect to signaling server'));
            };

            this.ws.onclose = (event) => {
                console.log('[WebRTC] WebSocket closed:', event.code, event.reason);
                this.cleanup();
            };

            this.ws.onmessage = (event) => {
                try {
                    const message: SignalMessage = JSON.parse(event.data);
                    this.handleSignalMessage(message);
                } catch (err) {
                    console.error('[WebRTC] Failed to parse message:', err);
                }
            };
        });
    }

    private handleSignalMessage(message: SignalMessage): void {
        console.log('[WebRTC] Received:', message.type);

        // Notify all handlers
        this.messageHandlers.forEach(handler => handler(message));

        // Handle WebRTC-specific messages
        switch (message.type) {
            case 'connected':
                this.role = message.role as 'interviewer' | 'candidate';
                break;


            case 'offer':
                this.handleOffer(message.payload as RTCSessionDescriptionInit);
                break;

            case 'answer':
                this.handleAnswer(message.payload as RTCSessionDescriptionInit);
                break;

            case 'ice-candidate':
                this.handleIceCandidate(message.payload as RTCIceCandidateInit);
                break;
        }
    }

    onMessage(handler: MessageHandler): () => void {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    private send(message: Partial<SignalMessage>): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ ...message, sessionId: this.sessionId }));
        }
    }

    // ============================================
    // Video Request Flow
    // ============================================

    requestVideo(): void {
        this.send({ type: 'video-request' });
    }

    acceptVideo(): void {
        this.send({ type: 'video-accept' });
    }

    rejectVideo(): void {
        this.send({ type: 'video-reject' });
    }

    stopVideo(): void {
        this.send({ type: 'video-stop' });
        this.stopLocalStream();
    }

    // ============================================
    // Camera/Media Stream
    // ============================================

    async startCamera(): Promise<MediaStream> {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false // Proctoring style - video only
            });
            return this.localStream;
        } catch (err) {
            console.error('[WebRTC] Failed to get camera:', err);
            throw new Error('Camera access denied');
        }
    }

    stopLocalStream(): void {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
    }

    getLocalStream(): MediaStream | null {
        return this.localStream;
    }

    getRemoteStream(): MediaStream | null {
        return this.remoteStream;
    }

    // ============================================
    // WebRTC Peer Connection
    // ============================================

    async createPeerConnection(): Promise<RTCPeerConnection> {
        this.peerConnection = new RTCPeerConnection({
            iceServers: ICE_SERVERS
        });

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.send({
                    type: 'ice-candidate',
                    payload: event.candidate.toJSON()
                });
            }
        };

        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            console.log('[WebRTC] Connection state:', this.peerConnection?.connectionState);
        };

        // Handle incoming tracks (for interviewer receiving video)
        this.peerConnection.ontrack = (event) => {
            console.log('[WebRTC] Received remote track');
            this.remoteStream = event.streams[0];
            this.messageHandlers.forEach(handler => 
                handler({ type: 'peer-connected', payload: this.remoteStream })
            );
        };

        return this.peerConnection;
    }

    // Candidate creates offer and sends to interviewer
    async createOffer(): Promise<void> {
        if (!this.peerConnection) {
            await this.createPeerConnection();
        }

        // Add local stream tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.peerConnection!.addTrack(track, this.localStream!);
            });
        }

        const offer = await this.peerConnection!.createOffer();
        await this.peerConnection!.setLocalDescription(offer);

        this.send({
            type: 'offer',
            payload: offer
        });
    }

    // Interviewer receives offer and sends answer
    private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peerConnection) {
            await this.createPeerConnection();
        }

        await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
        
        const answer = await this.peerConnection!.createAnswer();
        await this.peerConnection!.setLocalDescription(answer);

        this.send({
            type: 'answer',
            payload: answer
        });
    }

    // Candidate receives answer
    private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        if (this.peerConnection) {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        }
    }

    // Both sides handle ICE candidates
    private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        if (this.peerConnection && candidate) {
            try {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error('[WebRTC] Failed to add ICE candidate:', err);
            }
        }
    }

    // ============================================
    // Cleanup
    // ============================================

    cleanup(): void {
        this.stopLocalStream();
        
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        if (this.ws) {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.close();
            }
            this.ws = null;
        }

        this.remoteStream = null;
        this.messageHandlers.clear();
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    getRole(): 'interviewer' | 'candidate' | null {
        return this.role;
    }
}

// Singleton instance
export const webRTCService = new WebRTCService();
