import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SlideData {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}

const slides: SlideData[] = [
  {
    title: "AI Academic Chat",
    description:
      "Ask any academic question and get instant, context-aware guidance powered by AI.",
    image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=600&fit=crop&crop=center&q=80",
    imageAlt: "African university students collaborating with technology",
  },
  {
    title: "GPA Trends",
    description:
      "Track your academic performance across semesters with visual trend analysis.",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c7f1?w=800&h=600&fit=crop&crop=center&q=80",
    imageAlt: "African students studying together in a modern university setting",
  },
  {
    title: "Career Paths",
    description:
      "Discover ranked career recommendations based on your courses, skills, and grades.",
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&h=600&fit=crop&crop=center&q=80",
    imageAlt: "African graduates celebrating their achievement",
  },
  {
    title: "Research Assistant",
    description:
      "Upload research papers and receive AI-powered summaries, key findings, and gaps.",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=600&fit=crop&crop=center&q=80",
    imageAlt: "African students researching and studying in a library",
  },
];

function CarouselCard({ slide }: { slide: SlideData }) {
  return (
    <div className="w-full h-full select-none">
      <div className="relative w-full h-full rounded-3xl border border-border/60 overflow-hidden">
        {/* Background Image */}
        <img
          src={slide.image}
          alt={slide.imageAlt}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />

        {/* Title overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent">
          <h3 className="text-white font-semibold text-lg">{slide.title}</h3>
          <p className="text-white/80 text-sm mt-1">{slide.description}</p>
        </div>
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
              <div className="w-full aspect-[4/3] sm:aspect-[3/2] lg:aspect-[4/3]">
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
