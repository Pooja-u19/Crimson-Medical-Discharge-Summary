import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import AWSIntegration from "@/components/AWSIntegration";
import Testimonials from "@/components/Testimonials";
import Security from "@/components/Security";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <AWSIntegration />
      <Testimonials />
      <Security />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
