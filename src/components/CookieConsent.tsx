import { useState, useEffect } from 'react';
import { X, Cookie, Shield, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    getCookieConsent,
    setCookieConsent,
    clearNonEssentialCookies,
    type CookieConsent,
} from '@/lib/cookies';

export function CookieConsentBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [showCustomize, setShowCustomize] = useState(false);
    const [preferences, setPreferences] = useState({
        essential: true, // Always true, can't be disabled
        functional: true,
        analytics: false,
    });

    useEffect(() => {
        // Check if user has already given consent
        const consent = getCookieConsent();
        if (!consent) {
            setShowBanner(true);
        }
    }, []);

    const handleAcceptAll = () => {
        setCookieConsent({
            essential: true,
            functional: true,
            analytics: true,
        });
        setShowBanner(false);
    };

    const handleRejectAll = () => {
        setCookieConsent({
            essential: true,
            functional: false,
            analytics: false,
        });
        clearNonEssentialCookies();
        setShowBanner(false);
    };

    const handleSavePreferences = () => {
        setCookieConsent(preferences);
        if (!preferences.functional || !preferences.analytics) {
            clearNonEssentialCookies();
        }
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
            <div className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-4">
                {!showCustomize ? (
                    // Main Banner
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                                <Cookie className="h-6 w-6 text-primary" />
                            </div>

                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    We value your privacy
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    We use cookies to enhance your experience, remember your preferences, and analyze our traffic.
                                    By clicking "Accept All", you consent to our use of cookies.
                                </p>

                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        onClick={handleAcceptAll}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        Accept All
                                    </Button>
                                    <Button
                                        onClick={handleRejectAll}
                                        variant="outline"
                                    >
                                        Reject All
                                    </Button>
                                    <Button
                                        onClick={() => setShowCustomize(true)}
                                        variant="ghost"
                                    >
                                        Customize
                                    </Button>
                                </div>
                            </div>

                            <button
                                onClick={handleRejectAll}
                                className="flex-shrink-0 p-1 hover:bg-accent rounded-md transition-colors"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>
                    </div>
                ) : (
                    // Customize View
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-foreground">
                                Cookie Preferences
                            </h3>
                            <button
                                onClick={() => setShowCustomize(false)}
                                className="p-1 hover:bg-accent rounded-md transition-colors"
                                aria-label="Back"
                            >
                                <X className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Essential Cookies */}
                            <div className="flex items-start gap-3 p-4 bg-accent/50 rounded-lg">
                                <Shield className="h-5 w-5 text-primary mt-0.5" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-medium text-foreground">Essential Cookies</h4>
                                        <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">
                                            Always Active
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Required for authentication, security, and basic site functionality.
                                    </p>
                                </div>
                            </div>

                            {/* Functional Cookies */}
                            <div className="flex items-start gap-3 p-4 border border-border rounded-lg">
                                <Settings className="h-5 w-5 text-blue-500 mt-0.5" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-medium text-foreground">Functional Cookies</h4>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={preferences.functional}
                                                onChange={(e) =>
                                                    setPreferences({ ...preferences, functional: e.target.checked })
                                                }
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Remember your preferences, theme, and settings for a personalized experience.
                                    </p>
                                </div>
                            </div>

                            {/* Analytics Cookies */}
                            <div className="flex items-start gap-3 p-4 border border-border rounded-lg">
                                <BarChart3 className="h-5 w-5 text-green-500 mt-0.5" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-medium text-foreground">Analytics Cookies</h4>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={preferences.analytics}
                                                onChange={(e) =>
                                                    setPreferences({ ...preferences, analytics: e.target.checked })
                                                }
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Help us understand how you use FinanceMate to improve our service. All data is anonymized.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                onClick={handleSavePreferences}
                                className="flex-1 bg-primary hover:bg-primary/90"
                            >
                                Save Preferences
                            </Button>
                            <Button
                                onClick={() => setShowCustomize(false)}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
