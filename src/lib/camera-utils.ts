/**
 * Camera utilities for mobile and desktop
 */

export interface CameraPermissionResult {
    granted: boolean;
    error?: string;
}

/**
 * Check if camera is supported on this device
 */
export function isCameraSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Check current camera permission status
 */
export async function checkCameraPermission(): Promise<CameraPermissionResult> {
    if (!isCameraSupported()) {
        return {
            granted: false,
            error: 'Camera is not supported on this device or browser',
        };
    }

    try {
        // Check if Permissions API is available
        if (navigator.permissions && navigator.permissions.query) {
            const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
            return {
                granted: result.state === 'granted',
                error: result.state === 'denied' ? 'Camera permission denied' : undefined,
            };
        }

        // Fallback: try to access camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return { granted: true };
    } catch (error: any) {
        return {
            granted: false,
            error: error.name === 'NotAllowedError'
                ? 'Camera permission denied'
                : 'Unable to access camera',
        };
    }
}

/**
 * Request camera permission
 */
export async function requestCameraPermission(): Promise<boolean> {
    if (!isCameraSupported()) {
        return false;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        console.error('Camera permission request failed:', error);
        return false;
    }
}

/**
 * Get user-friendly error message for camera issues
 */
export function getCameraErrorMessage(error: any): string {
    if (!error) return 'Unknown camera error';

    const errorName = error.name || '';
    const errorMessage = error.message || '';

    // Permission denied
    if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        return 'Camera access denied. Please enable camera permissions in your browser settings.';
    }

    // No camera found
    if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        return 'No camera found on this device.';
    }

    // Camera in use
    if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        return 'Camera is already in use by another application.';
    }

    // Security error (HTTPS required)
    if (errorName === 'SecurityError') {
        return 'Camera access requires a secure connection (HTTPS).';
    }

    // Overconstrained (requested camera mode not available)
    if (errorName === 'OverconstrainedError') {
        return 'Requested camera mode is not available on this device.';
    }

    // Generic error
    return `Camera error: ${errorMessage || errorName || 'Unknown error'}`;
}

/**
 * Check if running in PWA mode
 */
export function isPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
}

/**
 * Get browser-specific camera instructions
 */
export function getCameraInstructions(): string {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
        return 'Chrome: Click the camera icon in the address bar, then select "Allow".';
    }

    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        return 'Safari: Go to Settings > Safari > Camera, and select "Allow".';
    }

    if (userAgent.includes('firefox')) {
        return 'Firefox: Click the camera icon in the address bar, then select "Allow".';
    }

    if (userAgent.includes('edg')) {
        return 'Edge: Click the camera icon in the address bar, then select "Allow".';
    }

    return 'Please enable camera permissions in your browser settings.';
}
