"use client";

import { motion } from "framer-motion";
import TestimonialCarousel, {
  type Testimonial,
} from "@/app/components/ui/testimonial-carousel";

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Mrs. Bello-Adeyemi",
    role: "Parent · Year 7 Student",
    quote:
      "My daughter came home one evening reciting Achebe. Not because she was told to — because she wanted to. That is the Wajina effect.",
    imageUrl: "/images/testimonials/parent-01.svg",
  },
  {
    name: "Chiamaka Nwachukwu",
    role: "Class of 2019 · Oxford University",
    quote:
      "I attended Oxford on a scholarship. My interviewers were surprised by my writing. They asked where I had studied. Wajina, I said. They wrote it down.",
    imageUrl: "/images/testimonials/alumna-01.svg",
  },
  {
    name: "Adaeze Okafor",
    role: "Year 11 · Senior Secondary",
    quote:
      "Wajina didn't just teach me chemistry. It taught me how to think, how to fail, and how to rise. I graduated with a distinction and a character I'm proud of.",
    imageUrl: "/images/testimonials/student-01.svg",
  },
  {
    name: "Yusuf Saleh Kila",
    role: "Class of 2017 · Founder, TerraLogic Africa",
    quote:
      "Every board meeting I walk into, I remember the leadership modules from Year 10. Wajina planted discipline in me before the world demanded it.",
    imageUrl: "/images/testimonials/alumnus-01.svg",
  },
  {
    name: "Mr. Terna Agber",
    role: "Parent · Year 10 Student",
    quote:
      "The portal gives us real-time visibility into grades, attendance, and fees. We feel like partners in our son's education, not bystanders.",
    imageUrl: "/images/testimonials/parent-02.svg",
  },
];

export default function TestimonialsCarousel() {
  return (
    <section
      className="py-32 px-6 overflow-hidden"
      style={{ background: "var(--color-cinematic-ink)" }}
    >
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <span
            className="text-token-micro font-black uppercase tracking-[0.45em]"
            style={{ color: "var(--color-cinematic-moss)", fontFamily: "var(--font-sans)" }}
          >
            Plate V · Voices
          </span>
          <h2
            className="leading-[0.9] tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)",
              fontWeight: 300,
              fontStyle: "italic",
              color: "var(--color-cinematic-bone)",
            }}
          >
            In their
            <br />
            <span style={{ color: "var(--color-cinematic-moss)" }}>own words.</span>
          </h2>
        </motion.div>

        {/* Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
        >
          <TestimonialCarousel testimonials={TESTIMONIALS} />
        </motion.div>
      </div>
    </section>
  );
}
