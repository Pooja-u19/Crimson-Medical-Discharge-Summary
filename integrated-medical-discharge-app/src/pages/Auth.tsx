import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowLeft, CheckCircle, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, login, register, confirmEmail, resendCode } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [department, setDepartment] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [loading, setLoading] = useState(false);

  const departments = [
    "Medical/Surgical Wards",
    "Emergency Department",
    "ICU",
    "Outpatient Clinics",
    "Nursing/Case Management",
    "Pharmacy",
    "Billing/Insurance",
    "Medical Records/Admin",
  ];

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (needsConfirmation) {
        // Handle email confirmation
        const result = await confirmEmail(email, confirmationCode);
        if (result.success) {
          toast({
            title: "Email Confirmed!",
            description: "You can now sign in with your credentials.",
          });
          setNeedsConfirmation(false);
          setIsSignUp(false);
          setConfirmationCode("");
        } else {
          toast({
            title: "Confirmation Failed",
            description: result.error,
            variant: "destructive",
          });
        }
      } else if (isSignUp) {
        // Validate sign up fields
        if (!firstName.trim() || !lastName.trim()) {
          toast({
            title: "Missing Information",
            description: "Please enter your first and last name.",
            variant: "destructive",
          });
          return;
        }

        if (!department) {
          toast({
            title: "Missing Information",
            description: "Please select your department.",
            variant: "destructive",
          });
          return;
        }

        if (password !== confirmPassword) {
          toast({
            title: "Passwords Don't Match",
            description: "Please make sure your passwords match.",
            variant: "destructive",
          });
          return;
        }

        // Handle sign up
        const result = await register(email, password, firstName, lastName, department);
        if (result.success) {
          if (result.needsConfirmation) {
            setNeedsConfirmation(true);
            toast({
              title: "Check Your Email",
              description: "We've sent you a verification code.",
            });
          } else {
            toast({
              title: "Account Created!",
              description: "You can now sign in.",
            });
            setIsSignUp(false);
          }
        } else {
          toast({
            title: "Sign Up Failed",
            description: result.error,
            variant: "destructive",
          });
        }
      } else {
        // Handle sign in
        const result = await login(email, password);
        if (result.success) {
          toast({
            title: "Welcome Back!",
            description: "You've successfully signed in.",
          });
          navigate("/");
        } else {
          toast({
            title: "Sign In Failed",
            description: result.error,
            variant: "destructive",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const result = await resendCode(email);
      if (result.success) {
        toast({
          title: "Code Sent",
          description: "A new verification code has been sent to your email.",
        });
      } else {
        toast({
          title: "Failed to Resend",
          description: result.error,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />

      {/* Back Button */}
      <Button
        variant="ghost"
        size="lg"
        onClick={() => navigate("/")}
        className="absolute top-8 left-8"
      >
        <ArrowLeft className="mr-2" size={20} />
        Back to Home
      </Button>

      {/* Auth Card */}
      <div className="w-full max-w-md mx-4 relative z-10">
        <div className="bg-card rounded-3xl p-8 md:p-10 shadow-elegant border border-border">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center shadow-elegant">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-foreground">Crimson AI</span>
              <span className="text-xs text-muted-foreground">MedCare</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {needsConfirmation ? "Verify Your Email" : isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-muted-foreground">
              {needsConfirmation 
                ? "Enter the verification code sent to your email"
                : isSignUp 
                ? "Sign up to access Crimson AI MedCare" 
                : "Sign in to your account"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {needsConfirmation ? (
              <>
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-foreground mb-2">
                    Verification Code
                  </label>
                  <div className="relative">
                    <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input
                      id="code"
                      type="text"
                      value={confirmationCode}
                      onChange={(e) => setConfirmationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      required
                      className="h-12 pl-11"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="link"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="w-full"
                >
                  Resend Code
                </Button>
              </>
            ) : (
              <>
                {isSignUp && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                          First Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                          <Input
                            id="firstName"
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="John"
                            required
                            className="h-12 pl-11"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                          Last Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                          <Input
                            id="lastName"
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Smith"
                            required
                            className="h-12 pl-11"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="department" className="block text-sm font-medium text-foreground mb-2">
                        Department
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" size={20} />
                        <Select value={department} onValueChange={setDepartment} required>
                          <SelectTrigger className="h-12 pl-11">
                            <SelectValue placeholder="Select your department" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border shadow-elegant z-50">
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept} className="cursor-pointer hover:bg-muted">
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@hospital.com"
                      required
                      className="h-12 pl-11"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-12 pl-11"
                    />
                  </div>
                  {isSignUp && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Must be 8+ characters with uppercase, lowercase, numbers and special characters
                    </p>
                  )}
                </div>

                {isSignUp && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="h-12 pl-11"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <Button
              type="submit"
              variant="hero"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading 
                ? "Processing..." 
                : needsConfirmation 
                ? "Verify Email" 
                : isSignUp 
                ? "Create Account" 
                : "Sign In"}
            </Button>
          </form>

          {/* Toggle Sign Up/Sign In */}
          {!needsConfirmation && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-primary transition-smooth"
              >
                {isSignUp ? (
                  <>
                    Already have an account?{" "}
                    <span className="font-semibold text-primary">Sign In</span>
                  </>
                ) : (
                  <>
                    Don't have an account?{" "}
                    <span className="font-semibold text-primary">Sign Up</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Security Badge */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock size={14} />
              <span>Secured by AWS Cognito</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
