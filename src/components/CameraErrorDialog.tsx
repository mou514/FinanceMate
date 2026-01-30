import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Camera, ExternalLink } from 'lucide-react';
import { getCameraInstructions, isPWA } from '@/lib/camera-utils';

interface CameraErrorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    error: string;
}

export const CameraErrorDialog: React.FC<CameraErrorDialogProps> = ({
    open,
    onOpenChange,
    error,
}) => {
    const instructions = getCameraInstructions();
    const isInPWA = isPWA();

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-destructive" />
                        <AlertDialogTitle>Camera Access Issue</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="space-y-3 pt-2">
                        <p className="font-medium text-foreground">{error}</p>

                        <div className="space-y-2 text-sm">
                            <p className="font-medium">How to fix:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>{instructions}</li>
                                {!isInPWA && (
                                    <li>Make sure you're using HTTPS (secure connection)</li>
                                )}
                                <li>Check that no other app is using the camera</li>
                                <li>Try refreshing the page and allowing access again</li>
                            </ul>
                        </div>

                        {!isInPWA && (
                            <div className="p-3 bg-muted rounded-md text-sm">
                                <p className="font-medium mb-1">💡 Tip:</p>
                                <p className="text-muted-foreground">
                                    Install this app to your home screen for a better camera experience!
                                </p>
                            </div>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => onOpenChange(false)}>
                        Got it
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
