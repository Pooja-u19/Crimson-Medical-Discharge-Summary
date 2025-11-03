import { useState, useEffect } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/95 backdrop-blur-lg shadow-soft" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            {/* Frontier Logo */}
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-elegant">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            {/* CrimsonAI Logo */}
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center shadow-elegant">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-foreground">Crimson AI</span>
              <span className="text-xs text-muted-foreground">MedCare</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("features")}
              className="text-foreground hover:text-primary transition-smooth font-medium"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-foreground hover:text-primary transition-smooth font-medium"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("aws-integration")}
              className="text-foreground hover:text-primary transition-smooth font-medium"
            >
              Technology
            </button>
            <button
              onClick={() => scrollToSection("testimonials")}
              className="text-foreground hover:text-primary transition-smooth font-medium"
            >
              Testimonials
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-foreground hover:text-primary transition-smooth font-medium"
            >
              Contact
            </button>
          </div>

          {/* Auth & CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
                  <User size={16} className="text-primary" />
                  <span className="text-sm text-foreground">{user.email || user.username}</span>
                </div>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleSignOut}
                >
                  <LogOut size={18} className="mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            )}
            <Button
              variant="hero"
              size="lg"
              onClick={() => scrollToSection("contact")}
            >
              Request a Demo
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-6 animate-fade-in overflow-hidden">
            <div className="flex flex-col space-y-4 w-full">
              <button
                onClick={() => scrollToSection("features")}
                className="text-foreground hover:text-primary transition-smooth font-medium text-left py-2"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-foreground hover:text-primary transition-smooth font-medium text-left py-2"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("aws-integration")}
                className="text-foreground hover:text-primary transition-smooth font-medium text-left py-2"
              >
                Technology
              </button>
              <button
                onClick={() => scrollToSection("testimonials")}
                className="text-foreground hover:text-primary transition-smooth font-medium text-left py-2"
              >
                Testimonials
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-foreground hover:text-primary transition-smooth font-medium text-left py-2"
              >
                Contact
              </button>
              
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 w-full overflow-hidden">
                    <User size={16} className="text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground truncate">{user.email || user.username}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={handleSignOut}
                    className="w-full justify-start"
                  >
                    <LogOut size={18} className="mr-2 flex-shrink-0" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="w-full"
                >
                  Sign In
                </Button>
              )}
              
              <Button
                variant="hero"
                size="lg"
                onClick={() => scrollToSection("contact")}
                className="w-full"
              >
                Request a Demo
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
