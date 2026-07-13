"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  TrendingUp,
  Briefcase,
  FileText,
} from "lucide-react";

interface SlideData {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  gradient: string;
  accent: string;
}

const slides: SlideData[] = [
  {
    title: "AI Academic Chat",
    description:
      "Ask any academic question and get instant, context-aware guidance powered by AI.",
    icon: MessageSquare,
    gradient: "from-primary/10 via-primary/5 to-transparent",
    accent: "bg-primary",
  },
  {
    title: "GPA Trends",
    description:
      "Track your academic performance across semesters with visual trend analysis.",
    icon: TrendingUp,
    gradient: "from-success/10 via-success/5 to-transparent",
    accent: "bg-success",
  },
  {
    title: "Career Paths",
    description:
      "Discover ranked career recommendations based on your courses, skills, and grades.",
    icon: Briefcase,
    gradient: "from-secondary/10 via-secondary/5 to-transparent",
    accent: "bg-secondary",
  },
  {
    title: "Research Assistant",
    description:
      "Upload research papers and receive AI-powered summaries, key findings, and gaps.",
    icon: FileText,
    gradient: "from-warning/10 via-warning/5 to-transparent",
    accent: "bg-warning",
  },
];

function CarouselCard({ slide }: { slide: SlideData }) {
  const Icon = slide.icon;

  return (
    <div className="w-full h-full select-none">
      <div
        className={`relative w-full h-full rounded-3xl bg-gradient-to-br ${slide.gradient} border border-border/60 overflow-hidden`}
      >
        {/* Top bar mockup */}
        <div className="flex items-center gap-2 px-5 pt-5 pb-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-warning/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-success/40" />
          </div>
          <div className="flex-1 mx-8">
            <div className="h-5 rounded-full bg-muted/60 max-w-[180px] mx-auto" />
          </div>
        </div>

        {/* Content area */}
        <div className="px-5 pb-5 flex flex-col h-[calc(100%-44px)]">
          {/* Mock sidebar + content */}
          <div className="flex gap-3 flex-1">
            {/* Sidebar mock */}
            <div className="hidden sm:flex flex-col gap-2 w-12 pt-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-lg ${
                    i === 0 ? `${slide.accent}/20` : "bg-muted/40"
                  }`}
                />
              ))}
            </div>

            {/* Main content mock */}
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${slide.accent}/15`}>
                  <Icon size={16} className={`${slide.accent.replace("bg-", "text-")}`} />
                </div>
                <div className="h-4 bg-foreground/10 rounded-full w-32" />
              </div>

              {/* Cards */}
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-card/80 border border-border/40 p-3 space-y-2"
                  >
                    <div className="h-2 bg-muted/60 rounded-full w-16" />
                    <div className="h-3 bg-foreground/8 rounded-full w-full" />
                    <div className="h-3 bg-foreground/5 rounded-full w-3/4" />
                  </div>
                ))}
              </div>

              {/* Bottom bar */}
              <div className="flex gap-2 pt-1">
                <div className="h-8 rounded-lg bg-muted/40 flex-1" />
                <div className={`h-8 rounded-lg ${slide.accent}/20 w-20`} />
              </div>
            </div>
          </div>
        </div>

        {/* Decorative corner glow */}
        <div
          className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full ${slide.accent}/10 blur-3xl`}
        />
      </div>
    </div>
  );
}

export default function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(() => 0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("init", onSelect);
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("init", onSelect);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="relative">
      {/* Carousel container */}
      <div className="overflow-hidden rounded-3xl border border-border/60 shadow-lg shadow-primary/5" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, i) => (
            <div
              key={i}
              className="flex-none w-full min-w-0"
              style={{ flex: "0 0 100%" }}
            >
              <div className="aspect-[4/3] sm:aspect-[3/2] lg:aspect-[4/3]">
                <CarouselCard slide={slide} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Animated indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className="group relative h-1.5 rounded-full overflow-hidden transition-all duration-300"
            style={{ width: selectedIndex === i ? 32 : 12 }}
            aria-label={`Go to slide ${i + 1}`}
          >
            <div className="absolute inset-0 bg-border" />
            <AnimatePresence>
              {selectedIndex === i && (
                <motion.div
                  className="absolute inset-0 bg-primary rounded-full"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  exit={{ scaleX: 0, originX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </AnimatePresence>
          </button>
        ))}
      </div>
    </div>
  );
}
