import React, { useState, useEffect } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { X } from "lucide-react";
import { recordCookieConsent, hasUserGivenConsent } from "@/backend/api/services/gdpr/gdprService";

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkConsentStatus = async () => {
      // Check localStorage first for immediate response
      const localConsent = localStorage.getItem("cookieConsent");
      
      if (localConsent) {
        setIsVisible(false);
        return;
      }

      // Check database for authenticated users
      try {
        const hasConsent = await hasUserGivenConsent('cookie');
        if (!hasConsent) {
          setIsVisible(true);
        }
      } catch (error) {
        // If user is not authenticated, still show the banner
        setIsVisible(true);
      }
    };

    checkConsentStatus();
  }, []);

  const handleAcceptAll = async () => {
    // Store in localStorage for immediate effect
    localStorage.setItem("cookieConsent", "accepted");
    localStorage.setItem("cookieConsentDate", new Date().toISOString());
    
    // Record in database for authenticated users
    try {
      await recordCookieConsent(true);
    } catch (error) {
      console.error("Failed to record consent in database:", error);
      // Still proceed with hiding banner since localStorage is set
    }
    
    setIsVisible(false);
  };

  const handleDismiss = async () => {
    // Store dismissal in localStorage
    localStorage.setItem("cookieConsent", "dismissed");
    localStorage.setItem("cookieConsentDate", new Date().toISOString());
    
    // Record in database for authenticated users
    try {
      await recordCookieConsent(false);
    } catch (error) {
      console.error("Failed to record consent dismissal in database:", error);
      // Still proceed with hiding banner
    }
    
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="mx-auto max-w-4xl shadow-lg border-2">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Cookie Consent</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We use cookies to enhance your experience, provide personalized content, and analyze our traffic. 
                By clicking "Accept All", you consent to our use of cookies.{" "}
                <a 
                  href="/privacy-policy" 
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more
                </a>
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleAcceptAll} size="sm">
                  Accept All
                </Button>
                <Button onClick={handleDismiss} variant="outline" size="sm">
                  Dismiss
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 