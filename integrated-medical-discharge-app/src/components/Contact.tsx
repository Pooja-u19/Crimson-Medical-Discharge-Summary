import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    hospital: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.hospital) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Simulate form submission
    toast({
      title: "Request Received!",
      description: "Our team will contact you within 24 hours to schedule your demo.",
    });

    // Reset form
    setFormData({
      name: "",
      email: "",
      hospital: "",
      phone: "",
      message: "",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to <span className="text-gradient">Transform</span> Your Discharge Process?
          </h2>
          <p className="text-lg text-muted-foreground">
            Schedule a personalized demo and see how Crimson AI MedCare can revolutionize your hospital's workflow.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="bg-card rounded-3xl p-8 md:p-10 shadow-elegant border border-border">
            <h3 className="text-2xl font-bold mb-6 text-foreground">Request a Demo</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Full Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Dr. Jane Smith"
                  required
                  className="h-12"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Work Email *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jane.smith@hospital.com"
                  required
                  className="h-12"
                />
              </div>

              <div>
                <label htmlFor="hospital" className="block text-sm font-medium text-foreground mb-2">
                  Hospital / Organization *
                </label>
                <Input
                  id="hospital"
                  name="hospital"
                  type="text"
                  value={formData.hospital}
                  onChange={handleChange}
                  placeholder="Metro General Hospital"
                  required
                  className="h-12"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="h-12"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Additional Information
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your current discharge process and specific needs..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full group"
              >
                Request Demo
                <Send className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By submitting this form, you agree to our Privacy Policy and Terms of Service.
              </p>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            {/* Info Cards */}
            <div className="bg-card rounded-2xl p-8 border border-border shadow-soft">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-soft">
                  <Mail className="text-white" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Email Us</h4>
                  <p className="text-muted-foreground">sales@crimsonaimedcare.com</p>
                  <p className="text-muted-foreground">support@crimsonaimedcare.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 gradient-secondary rounded-xl flex items-center justify-center shadow-soft">
                  <Phone className="text-white" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Call Us</h4>
                  <p className="text-muted-foreground">+1 (800) MEDCARE</p>
                  <p className="text-sm text-muted-foreground">Mon-Fri, 8am-8pm EST</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-card border border-border rounded-xl flex items-center justify-center shadow-soft">
                  <MapPin className="text-primary" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Visit Us</h4>
                  <p className="text-muted-foreground">100 Healthcare Plaza</p>
                  <p className="text-muted-foreground">Boston, MA 02115</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-card rounded-2xl p-8 border border-border shadow-soft">
              <h4 className="font-semibold text-foreground mb-6">Why Choose Us?</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Average Response Time</span>
                  <span className="font-bold text-primary">&lt; 2 hours</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Implementation Time</span>
                  <span className="font-bold text-primary">2-4 weeks</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Customer Satisfaction</span>
                  <span className="font-bold text-primary">98%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
