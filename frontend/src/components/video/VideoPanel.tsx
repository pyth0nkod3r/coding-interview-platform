// src/components/video/VideoPanel.tsx
// Video panel component for interviewer to view candidate's webcam feed

import { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import type { SignalMessage } from '../../services/webrtc.service';

interface VideoPanelProps {
    isInterviewer: boolean;
    remoteStream: MediaStream | null;
    localStream: MediaStream | null;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'waiting' | 'denied';
    onRequestVideo: () => void;
    onStopVideo: () => void;
    lastMessage?: SignalMessage | null;
}

export const VideoPanel = ({
    isInterviewer,
    remoteStream,
    localStream,
    connectionStatus,
    onRequestVideo,
    onStopVideo,
}: VideoPanelProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Attach stream to video element
    useEffect(() => {
        const stream = isInterviewer ? remoteStream : localStream;
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [remoteStream, localStream, isInterviewer]);

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const renderInterviewerView = () => {
        switch (connectionStatus) {
            case 'disconnected':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                            <VideoOff className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                No video feed active
                            </p>
                            <Button size="sm" onClick={onRequestVideo}>
                                <Video className="w-4 h-4 mr-2" />
                                Request Video
                            </Button>
                        </div>
                    </div>
                );

            case 'waiting':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
                            <Video className="w-8 h-8 text-amber-400" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Waiting for candidate to accept...
                            </p>
                            <Button size="sm" variant="ghost" onClick={onStopVideo}>
                                Cancel Request
                            </Button>
                        </div>
                    </div>
                );

            case 'connecting':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Establishing connection...
                        </p>
                    </div>
                );

            case 'denied':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                            <VideoOff className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-red-400">
                                Candidate denied video access
                            </p>
                            <Button size="sm" variant="ghost" onClick={onRequestVideo}>
                                Request Again
                            </Button>
                        </div>
                    </div>
                );

            case 'connected':
                return (
                    <div className={cn(
                        "relative h-full bg-black",
                        isFullscreen && "fixed inset-0 z-50"
                    )}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted={false}
                            className="w-full h-full object-contain"
                        />
                        {/* Controls overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs text-white/80">Live</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleFullscreen}
                                    className="p-1.5 rounded hover:bg-white/20 transition-colors"
                                >
                                    {isFullscreen ? (
                                        <Minimize2 className="w-4 h-4 text-white" />
                                    ) : (
                                        <Maximize2 className="w-4 h-4 text-white" />
                                    )}
                                </button>
                                <button
                                    onClick={onStopVideo}
                                    className="p-1.5 rounded bg-red-500/80 hover:bg-red-500 transition-colors"
                                >
                                    <VideoOff className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const renderCandidateView = () => {
        if (connectionStatus === 'connected' && localStream) {
            return (
                <div className="relative h-full bg-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted // Mute self-view to avoid feedback
                        className="w-full h-full object-contain transform scale-x-[-1]" // Mirror for natural self-view
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-white/80">Sharing with interviewer</span>
                        </div>
                        <button
                            onClick={onStopVideo}
                            className="p-1.5 rounded bg-red-500/80 hover:bg-red-500 transition-colors flex items-center gap-1"
                        >
                            <VideoOff className="w-4 h-4 text-white" />
                            <span className="text-xs text-white">Stop</span>
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                    <Video className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                    {connectionStatus === 'waiting' 
                        ? 'Interviewer has requested video access' 
                        : 'Camera not active'}
                </p>
            </div>
        );
    };

    return (
        <div className="h-full min-h-[200px]">
            {isInterviewer ? renderInterviewerView() : renderCandidateView()}
        </div>
    );
};
