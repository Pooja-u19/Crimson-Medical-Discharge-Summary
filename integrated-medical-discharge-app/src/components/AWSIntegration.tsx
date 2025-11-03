import { Cloud, Shield, Zap, RefreshCw, Brain, Lock } from "lucide-react";
import awsImage from "@/assets/aws-integration.jpg";

const awsFeatures = [
  {
    icon: Cloud,
    title: "Scalable Architecture",
    description: "Auto-scales to handle hospitals of any size, from community centers to major medical systems.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption with AWS security best practices, SOC 2 Type II certified.",
  },
  {
    icon: Zap,
    title: "Lightning Performance",
    description: "Sub-second response times with AWS global infrastructure and edge computing.",
  },
  {
    icon: RefreshCw,
    title: "Continuous Learning",
    description: "AI models continuously improve from aggregated, anonymized data across our network.",
  },
];

const AWSIntegration = () => {
  return (
    <section id="aws-integration" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-5">
        <img src={awsImage} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border mb-6 shadow-soft">
              <Brain className="text-primary" size={20} />
              <span className="text-sm font-medium text-foreground">AWS Agentic AI Powered</span>
            </div>

            {/* Heading */}
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Built on <span className="text-gradient">AWS Excellence</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Leverage the power of Amazon Web Services' cutting-edge AI and cloud infrastructure. Our Agentic AI agents autonomously coordinate across departments, learning and adapting to your hospital's unique workflows.
            </p>

            {/* Features List */}
            <div className="space-y-6 mb-8">
              {awsFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-card rounded-xl flex items-center justify-center shadow-soft border border-border">
                    <feature.icon className="text-primary" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* AWS Logo Badge */}
            <div className="flex items-center gap-4 p-6 bg-card rounded-2xl border border-border shadow-soft">
              <div className="flex items-center gap-3">
                <Cloud className="text-[#FF9900]" size={32} />
                <div>
                  <div className="font-bold text-foreground">AWS Partner</div>
                  <div className="text-sm text-muted-foreground">Advanced Technology Partner</div>
                </div>
              </div>
              <div className="ml-auto">
                <Lock className="text-muted-foreground" size={24} />
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-elegant border border-border bg-card p-8">
              <img
                src={awsImage}
                alt="AWS Integration Architecture"
                className="w-full h-auto rounded-2xl"
              />
              
              {/* Floating Stats */}
              <div className="absolute top-8 right-8 bg-card/95 backdrop-blur-sm rounded-2xl p-6 shadow-elegant border border-border animate-float">
                <div className="text-3xl font-bold text-gradient mb-1">99.99%</div>
                <div className="text-sm text-muted-foreground">Uptime SLA</div>
              </div>

              <div className="absolute bottom-8 left-8 bg-card/95 backdrop-blur-sm rounded-2xl p-6 shadow-elegant border border-border animate-float" style={{ animationDelay: "1s" }}>
                <div className="text-3xl font-bold text-gradient mb-1">&lt; 100ms</div>
                <div className="text-sm text-muted-foreground">Response Time</div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-8 -left-8 w-32 h-32 gradient-secondary rounded-full blur-3xl opacity-30" />
            <div className="absolute -bottom-8 -right-8 w-40 h-40 gradient-primary rounded-full blur-3xl opacity-30" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AWSIntegration;
