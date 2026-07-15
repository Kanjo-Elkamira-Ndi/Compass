import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import autoplay from 'embla-carousel-autoplay';
import { motion } from 'framer-motion';

interface Slide {
  image: string;
  title: string;
  subtitle: string;
}

interface PageHeroCarouselProps {
  slides: Slide[];
}

export default function PageHeroCarousel({ slides }: PageHeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <section className="relative w-full h-[420px] sm:h-[480px] lg:h-[520px] overflow-hidden">
      <div className="embla h-full" ref={emblaRef}>
        <div className="embla__container flex h-full">
          {slides.map((slide, i) => (
            <div key={i} className="embla__slide relative h-full w-full flex-shrink-0">
              <img
                src={slide.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
            </div>
          ))}
        </div>
      </div>

      {/* Content overlay */}
      <div className="absolute inset-0 flex items-end">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20">
          {slides.map((slide, i) => (
            <motion.div
              key={i}
              className="absolute bottom-12 sm:bottom-16 lg:bottom-20 left-4 sm:left-6 lg:left-8 right-4 sm:right-6 lg:right-8 max-w-7xl mx-auto"
              initial={false}
              animate={{
                opacity: selectedIndex === i ? 1 : 0,
                y: selectedIndex === i ? 0 : 16,
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ pointerEvents: selectedIndex === i ? 'auto' : 'none' }}
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {slide.title}
              </h1>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-white/80 max-w-2xl leading-relaxed">
                {slide.subtitle}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              selectedIndex === i ? 'w-8 bg-white' : 'w-2 bg-white/40'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
