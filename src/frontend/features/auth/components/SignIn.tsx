import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { useToast } from "@/frontend/hooks/use-toast";
import { Calendar, Mail, Lock } from "lucide-react";
import { login } from "@/backend/api/services/auth.service";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(email, password);
      toast({
        title: "Success!",
        description: "You have successfully signed in.",
      });
      navigate("/");
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid credentials. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4"
      data-testid="signin-page"
    >
      <div 
        className="w-full max-w-md space-y-8 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg"
        data-testid="signin-form-container"
      >
        <div className="text-center space-y-2">
          <Calendar className="w-12 h-12 mx-auto text-primary" data-testid="signin-logo" />
          <h1 
            className="text-3xl font-bold tracking-tight"
            data-testid="signin-heading"
          >
            Welcome back
          </h1>
          <p 
            className="text-muted-foreground"
            data-testid="signin-description"
          >
            Sign in to your account to continue
          </p>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="space-y-6"
          data-testid="signin-form"
        >
          <div className="space-y-2">
            <Label htmlFor="email" data-testid="email-label">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                data-testid="email-input"
                aria-label="Email Address"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" data-testid="password-label">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                data-testid="password-input"
                aria-label="Password"
                autoComplete="current-password"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
            data-testid="signin-submit-button"
            aria-label={isLoading ? "Signing in..." : "Sign in"}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <p 
            className="text-sm text-muted-foreground"
            data-testid="signup-link-text"
          >
            Don't have an account?{" "}
            <Button 
              variant="link" 
              className="p-0" 
              onClick={() => navigate("/auth/signup")}
              data-testid="signup-link-button"
              aria-label="Go to sign up page"
            >
              Sign up
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
