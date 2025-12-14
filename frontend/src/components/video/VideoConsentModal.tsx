// src/components/video/VideoConsentModal.tsx
// Modal for candidate to accept/reject video sharing request

import { Video, VideoOff, Shield } from 'lucide-react';
import { Button } from '../ui/Button';

interface VideoConsentModalProps {
    isOpen: boolean;
    onAccept: () => void;
    onReject: () => void;
    isLoading?: boolean;
}

export const VideoConsentModal = ({
    isOpen,
    onAccept,
    onReject,
    isLoading = false
}: VideoConsentModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-slide-up">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Video className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">
                            Video Request
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            The interviewer wants to see your camera
                        </p>
                    </div>
                </div>

                {/* Description */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                Your Privacy
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Video is only shared during this session and is not recorded. 
                                You can stop sharing at any time.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Security note */}
                <p className="text-xs text-muted-foreground text-center">
                    Your video is end-to-end encrypted and goes directly to the interviewer.
                </p>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-2">
                    <Button
                        variant="ghost"
                        onClick={onReject}
                        disabled={isLoading}
                    >
                        <VideoOff className="w-4 h-4 mr-2" />
                        Decline
                    </Button>
                    <Button
                        onClick={onAccept}
                        isLoading={isLoading}
                    >
                        <Video className="w-4 h-4 mr-2" />
                        Allow Camera
                    </Button>
                </div>
            </div>
        </div>
    );
};
