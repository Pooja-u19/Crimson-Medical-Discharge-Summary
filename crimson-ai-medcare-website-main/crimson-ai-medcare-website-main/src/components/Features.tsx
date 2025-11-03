import { FileText, Building2, Cloud, MessageSquare, BarChart3, Link2 } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Automated Discharge Summaries",
    description: "AI-generated comprehensive summaries in seconds, eliminating hours of manual documentation.",
  },
  {
    icon: Building2,
    title: "Multi-Department Integration",
    description: "Seamlessly pull data from radiology, lab, nursing, and pharmacy systems into unified reports.",
  },
  {
    icon: Cloud,
    title: "Secure Cloud Storage",
    description: "AWS-powered infrastructure ensures HIPAA-compliant, encrypted storage with 99.99% uptime.",
  },
  {
    icon: MessageSquare,
    title: "Natural Language Summaries",
    description: "Patient-friendly discharge instructions automatically generated in clear, accessible language.",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics & Compliance",
    description: "Built-in analytics dashboard tracks metrics and ensures regulatory compliance automatically.",
  },
  {
    icon: Link2,
    title: "Seamless EHR Interoperability",
    description: "Direct integration with Epic, Cerner, and major EHR systems via HL7 and FHIR standards.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Powerful Features for{" "}
            <span className="text-gradient">Modern Healthcare</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to transform your discharge process, powered by cutting-edge AI technology.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-card rounded-2xl p-8 shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-elegant">
                <feature.icon className="text-white" size={28} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
