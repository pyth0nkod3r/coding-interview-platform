// src/routes/video.routes.ts
// WebSocket signaling server for WebRTC video streaming

import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import { SessionService } from '../services/session.service.js';
import { AuthService } from '../services/auth.service.js';

interface SignalMessage {
    type: 'offer' | 'answer' | 'ice-candidate' | 'video-request' | 'video-accept' | 'video-reject' | 'video-stop';
    payload?: unknown;
    sessionId: string;
}

interface VideoParams {
    sessionId: string;
}

interface VideoQuery {
    token: string;
}

// Store active WebSocket connections per session
// Key: sessionId, Value: { interviewer?: WebSocket, candidate?: WebSocket }
const sessionConnections = new Map<string, {
    interviewer?: WebSocket;
    candidate?: WebSocket;
}>();

export async function videoRoutes(fastify: FastifyInstance): Promise<void> {
    // WebSocket route for video signaling
    fastify.get<{ Params: VideoParams; Querystring: VideoQuery }>(
        '/signal/:sessionId',
        { websocket: true },
        async (socket: WebSocket, request: FastifyRequest<{ Params: VideoParams; Querystring: VideoQuery }>) => {
            const { sessionId } = request.params;
            const { token } = request.query;

            // Authenticate user from token
            let userId: string;
            try {
                const decoded = fastify.jwt.verify<{ id: string }>(token);
                userId = decoded.id;
            } catch {
                socket.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
                socket.close(1008, 'Invalid token');
                return;
            }

            // Verify user exists
            const user = await AuthService.getUserById(userId);
            if (!user) {
                socket.send(JSON.stringify({ type: 'error', message: 'User not found' }));
                socket.close(1008, 'User not found');
                return;
            }

            // Verify session exists and user is part of it
            const session = await SessionService.getSession(sessionId);
            if (!session) {
                socket.send(JSON.stringify({ type: 'error', message: 'Session not found' }));
                socket.close(1008, 'Session not found');
                return;
            }

            const isInterviewer = session.interviewerId === userId;
            const isCandidate = session.candidateId === userId;

            if (!isInterviewer && !isCandidate) {
                socket.send(JSON.stringify({ type: 'error', message: 'Not authorized for this session' }));
                socket.close(1008, 'Not authorized');
                return;
            }

            // Initialize session connections map if needed
            if (!sessionConnections.has(sessionId)) {
                sessionConnections.set(sessionId, {});
            }
            const connections = sessionConnections.get(sessionId)!;

            // Store this connection
            if (isInterviewer) {
                // Close any existing interviewer connection
                if (connections.interviewer) {
                    connections.interviewer.close(1000, 'Replaced by new connection');
                }
                connections.interviewer = socket;
            } else {
                // Close any existing candidate connection
                if (connections.candidate) {
                    connections.candidate.close(1000, 'Replaced by new connection');
                }
                connections.candidate = socket;
            }

            // Send connected confirmation
            socket.send(JSON.stringify({
                type: 'connected',
                role: isInterviewer ? 'interviewer' : 'candidate',
                sessionId
            }));

            // Notify other party of connection
            const otherSocket = isInterviewer ? connections.candidate : connections.interviewer;
            if (otherSocket && otherSocket.readyState === 1) {
                otherSocket.send(JSON.stringify({
                    type: 'peer-connected',
                    role: isInterviewer ? 'interviewer' : 'candidate'
                }));
            }

            // Handle incoming messages
            socket.on('message', async (data: Buffer | string) => {
                try {
                    const message: SignalMessage = JSON.parse(data.toString());

                    // Validate session ID matches
                    if (message.sessionId !== sessionId) {
                        socket.send(JSON.stringify({ type: 'error', message: 'Session ID mismatch' }));
                        return;
                    }

                    // Get the target socket (relay to the other party)
                    const targetSocket = isInterviewer ? connections.candidate : connections.interviewer;

                    switch (message.type) {
                        case 'video-request':
                            // Only interviewer can request video
                            if (!isInterviewer) {
                                socket.send(JSON.stringify({ type: 'error', message: 'Only interviewer can request video' }));
                                return;
                            }
                            if (targetSocket && targetSocket.readyState === 1) {
                                targetSocket.send(JSON.stringify({ type: 'video-request' }));
                            }
                            break;

                        case 'video-accept':
                        case 'video-reject':
                        case 'video-stop':
                            // Relay consent/stop messages
                            if (targetSocket && targetSocket.readyState === 1) {
                                targetSocket.send(JSON.stringify({ type: message.type }));
                            }
                            break;

                        case 'offer':
                        case 'answer':
                        case 'ice-candidate':
                            // Relay WebRTC signaling messages
                            if (targetSocket && targetSocket.readyState === 1) {
                                targetSocket.send(JSON.stringify({
                                    type: message.type,
                                    payload: message.payload
                                }));
                            }
                            break;

                        default:
                            socket.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
                    }
                } catch {
                    socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
                }
            });

            // Handle disconnection
            socket.on('close', () => {
                const conns = sessionConnections.get(sessionId);
                if (conns) {
                    if (isInterviewer && conns.interviewer === socket) {
                        delete conns.interviewer;
                    } else if (!isInterviewer && conns.candidate === socket) {
                        delete conns.candidate;
                    }

                    // Notify other party of disconnection
                    const remaining = isInterviewer ? conns.candidate : conns.interviewer;
                    if (remaining && remaining.readyState === 1) {
                        remaining.send(JSON.stringify({
                            type: 'peer-disconnected',
                            role: isInterviewer ? 'interviewer' : 'candidate'
                        }));
                    }

                    // Clean up empty session entries
                    if (!conns.interviewer && !conns.candidate) {
                        sessionConnections.delete(sessionId);
                    }
                }
            });

            socket.on('error', (err: Error) => {
                fastify.log.error({ err, sessionId }, 'WebSocket error');
            });
        }
    );
}

// Export for cleanup (useful for tests or graceful shutdown)
export function cleanupSessionConnections(sessionId: string): void {
    const conns = sessionConnections.get(sessionId);
    if (conns) {
        if (conns.interviewer) {
            conns.interviewer.close(1000, 'Session ended');
        }
        if (conns.candidate) {
            conns.candidate.close(1000, 'Session ended');
        }
        sessionConnections.delete(sessionId);
    }
}
