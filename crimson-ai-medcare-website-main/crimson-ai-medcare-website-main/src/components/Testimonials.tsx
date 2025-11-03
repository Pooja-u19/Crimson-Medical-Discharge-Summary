import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "Dr. Sarah Chen",
    role: "Chief Medical Officer",
    hospital: "Metro General Hospital",
    content: "Crimson AI MedCare has transformed our discharge workflow. What used to take 45 minutes now takes under 10, and the accuracy is remarkable. Our clinicians can finally focus on patient care instead of paperwork.",
    rating: 5,
  },
  {
    name: "James Martinez",
    role: "IT Director",
    hospital: "Valley Health System",
    content: "Integration was seamless. The AWS infrastructure scales perfectly with our needs, and the security features give us complete peace of mind. Best healthcare IT investment we've made in years.",
    rating: 5,
  },
  {
    name: "Dr. Emily Roberts",
    role: "Director of Clinical Operations",
    hospital: "Riverside Medical Center",
    content: "The natural language processing is incredible. Discharge summaries are not only faster but also more comprehensive and patient-friendly. Our patient satisfaction scores have increased by 23%.",
    rating: 5,
  },
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const previous = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentIndex];

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Trusted by <span className="text-gradient">Healthcare Leaders</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Hear from hospitals and health systems that have transformed their discharge process with Crimson AI MedCare.
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-3xl p-8 md:p-12 shadow-elegant border border-border relative animate-fade-in">
            {/* Quote Icon */}
            <div className="absolute -top-6 left-12 w-12 h-12 gradient-primary rounded-full flex items-center justify-center shadow-elegant">
              <Quote className="text-white" size={24} />
            </div>

            {/* Rating Stars */}
            <div className="flex gap-1 mb-6">
              {[...Array(current.rating)].map((_, i) => (
                <svg
                  key={i}
                  className="w-6 h-6 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* Content */}
            <p className="text-xl md:text-2xl text-foreground mb-8 leading-relaxed font-medium">
              "{current.content}"
            </p>

            {/* Author Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center shadow-elegant">
                <span className="text-white text-xl font-bold">
                  {current.name.split(" ").map(n => n[0]).join("")}
                </span>
              </div>
              <div>
                <div className="font-semibold text-foreground text-lg">{current.name}</div>
                <div className="text-muted-foreground">{current.role}</div>
                <div className="text-sm text-primary">{current.hospital}</div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-8 border-t border-border">
              <Button
                variant="ghost"
                size="icon"
                onClick={previous}
                className="rounded-full"
              >
                <ChevronLeft size={24} />
              </Button>

              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? "bg-primary w-8"
                        : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={next}
                className="rounded-full"
              >
                <ChevronRight size={24} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
