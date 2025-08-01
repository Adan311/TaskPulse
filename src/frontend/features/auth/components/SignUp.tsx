import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { useToast } from "@/frontend/hooks/use-toast";
import { Calendar, Mail, Lock, User } from "lucide-react";
import { register } from "@/backend/api/services/auth.service";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await register(email, password, name);
      toast({
        title: "Account created!",
        description: "You have successfully created an account.",
      });
      navigate("/auth/signin");
    } catch (error) {
      console.error("Sign up error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4"
      data-testid="signup-page"
    >
      <div 
        className="w-full max-w-md space-y-8 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg"
        data-testid="signup-form-container"
      >
        <div className="text-center space-y-2">
          <Calendar className="w-12 h-12 mx-auto text-primary" data-testid="signup-logo" />
          <h1 
            className="text-3xl font-bold tracking-tight"
            data-testid="signup-heading"
          >
            Create an account
          </h1>
          <p 
            className="text-muted-foreground"
            data-testid="signup-description"
          >
            Get started with your productivity journey
          </p>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="space-y-6"
          data-testid="signup-form"
        >
          <div className="space-y-2">
            <Label htmlFor="name" data-testid="name-label">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                required
                data-testid="name-input"
                aria-label="Full Name"
                autoComplete="name"
              />
            </div>
          </div>

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
                autoComplete="new-password"
                minLength={6}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
            data-testid="signup-submit-button"
            aria-label={isLoading ? "Creating account..." : "Create account"}
          >
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <p 
            className="text-sm text-muted-foreground"
            data-testid="signin-link-text"
          >
            Already have an account?{" "}
            <Button 
              variant="link" 
              className="p-0" 
              onClick={() => navigate("/auth/signin")}
              data-testid="signin-link-button"
              aria-label="Go to sign in page"
            >
              Sign in
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
