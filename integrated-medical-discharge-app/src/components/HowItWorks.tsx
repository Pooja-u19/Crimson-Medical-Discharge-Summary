import { UserPlus, Database, Sparkles, FileCheck } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Patient Admission",
    description: "System automatically initiates tracking when a patient is admitted, gathering initial data from EHR.",
  },
  {
    icon: Database,
    number: "02",
    title: "Data Aggregation",
    description: "AI continuously collects and organizes data from all departments throughout the hospital stay.",
  },
  {
    icon: Sparkles,
    number: "03",
    title: "AI Processing",
    description: "AWS Agentic AI analyzes comprehensive patient data and generates intelligent summaries.",
  },
  {
    icon: FileCheck,
    number: "04",
    title: "Discharge Complete",
    description: "Clinician reviews and approves AI-generated summaries, with patient-friendly versions auto-created.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            How <span className="text-gradient">It Works</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From admission to discharge, our AI-powered system streamlines the entire process with precision and efficiency.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative flex flex-col md:flex-row items-start gap-8 mb-16 last:mb-0 animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Connecting Line (hidden on last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute left-16 top-24 w-0.5 h-24 bg-gradient-to-b from-primary to-secondary opacity-30" />
              )}

              {/* Icon Circle */}
              <div className="flex-shrink-0 relative">
                <div className="w-32 h-32 gradient-primary rounded-2xl flex items-center justify-center shadow-elegant group-hover:shadow-glow transition-all">
                  <step.icon className="text-white" size={48} />
                </div>
                {/* Step Number Badge */}
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center font-bold shadow-soft">
                  {step.number}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 md:pt-8">
                <h3 className="text-2xl font-bold mb-3 text-foreground">
                  {step.title}
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-card border border-border shadow-soft">
            <Sparkles className="text-primary" size={20} />
            <span className="font-medium text-foreground">
              Average discharge time reduced from <strong className="text-primary">45 minutes</strong> to{" "}
              <strong className="text-secondary">7 minutes</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
