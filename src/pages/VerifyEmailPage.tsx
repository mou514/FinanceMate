import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleVerify = useCallback(async (verificationCode: string) => {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "Email verified successfully!");
        // Refresh auth state to update emailVerified status
        await checkAuth();

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate("/home");
        }, 2000);
      } else {
        setStatus("error");
        setMessage(data.error || "Verification failed. Please check the code and try again.");
        setCode(""); // Clear code on error
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred. Please try again later.");
      console.error("Verification error:", error);
    }
  }, [navigate, checkAuth]);

  const handleResend = async () => {
    setResendStatus("loading");
    try {
      // Assuming headers are handled by browser/cookie or we need to pass token if available
      // But verify page might be accessed from email link without session?
      // Wait, if we are in this page, we expect the user to be logged in (redirected from signup)
      // OR they clicked a link? But we changed the email to NOT have a link, just a code.
      // So the user MUST be logged in or we need their email. 
      // Current Resend API relies on logged-in user context `c.get('userId')`.

      const token = localStorage.getItem("auth_token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: headers,
        // No body needed as it uses current user
      });

      if (response.ok) {
        setResendStatus("success");
      } else {
        setResendStatus("error");
      }
    } catch (e) {
      setResendStatus("error");
    }
  };

  // If user is already verified, redirect
  if (user && user.emailVerified) {
    navigate("/home");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
              <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            We've sent a 6-digit verification code to
            <br />
            <span className="font-medium text-foreground">{user?.email || "your email"}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(value) => {
                setCode(value);
                if (value.length === 6) {
                  handleVerify(value);
                }
              }}
              disabled={status === "loading" || status === "success"}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {status === "loading" && (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-sm text-muted-foreground">Verifying code...</p>
            </div>
          )}

          {status === "success" && (
            <Alert className="border-green-600 bg-green-50 dark:bg-green-900/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="text-center text-sm">
            <p className="text-muted-foreground mb-2">
              Didn't receive the code?
            </p>
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={handleResend}
              disabled={resendStatus === "loading" || status === "success"}
            >
              {resendStatus === "loading" ? "Sending..." : "Click to resend"}
            </Button>
            {resendStatus === "success" && (
              <p className="text-green-600 text-xs mt-1">Code sent!</p>
            )}
            {resendStatus === "error" && (
              <p className="text-red-600 text-xs mt-1">Failed to send.</p>
            )}
          </div>

          <div className="flex flex-col space-y-2 pt-4 border-t">
            <Button variant="ghost" onClick={() => navigate("/login")} className="w-full">
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
