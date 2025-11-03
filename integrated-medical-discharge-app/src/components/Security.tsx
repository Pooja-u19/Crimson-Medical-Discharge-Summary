import { Shield, Lock, Eye, FileCheck, Award, Database } from "lucide-react";

const securityFeatures = [
  {
    icon: Shield,
    title: "HIPAA Compliant",
    description: "Full HIPAA compliance with BAA in place",
  },
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "AES-256 encryption at rest and in transit",
  },
  {
    icon: Eye,
    title: "GDPR Ready",
    description: "Data privacy and protection standards met",
  },
  {
    icon: FileCheck,
    title: "SOC 2 Type II",
    description: "Certified security controls and audits",
  },
  {
    icon: Award,
    title: "ISO 27001",
    description: "Information security management certified",
  },
  {
    icon: Database,
    title: "Regular Backups",
    description: "Automated daily backups with 99.9% SLA",
  },
];

const Security = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border mb-6 shadow-soft">
            <Shield className="text-primary" size={20} />
            <span className="text-sm font-medium text-foreground">Enterprise-Grade Security</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Your Data is <span className="text-gradient">Protected</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            We take security seriously. Our platform meets the highest standards for healthcare data protection and compliance.
          </p>
        </div>

        {/* Security Badges Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {securityFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-6 border border-border shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-soft">
                  <feature.icon className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Statement */}
        <div className="max-w-3xl mx-auto text-center bg-card rounded-2xl p-8 border border-border shadow-elegant">
          <p className="text-lg text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Trusted by 500+ hospitals</strong> across North America. 
            Our infrastructure is built on AWS with <strong className="text-primary">99.99% uptime</strong>, 
            ensuring your critical healthcare operations are always running smoothly and securely.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Security;
