import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowDown, Play } from "lucide-react";
import FloatingBackground from "./FloatingBackground";
import HeroCarousel from "./HeroCarousel";
import HeroStats from "./HeroStats";
import { ROUTES } from "@/routes";

const features = [

];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-56px)] flex items-center overflow-hidden">
      <FloatingBackground />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Right — Carousel (first on mobile, second on desktop) */}
          <motion.div
            className="relative lg:pt-14 order-1 lg:order-2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          >
            <HeroCarousel />
          </motion.div>

          {/* Left — Text (second on mobile, first on desktop) */}
          <motion.div
            className="space-y-8 order-2 lg:order-1"
            variants={container}
            initial="hidden"
            animate="show"
          >

            <motion.h1
              variants={item}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.08] font-bold tracking-tight text-foreground"
            >
              Navigate Your Academic Journey{" "}
              <span className="text-primary">With AI</span>
            </motion.h1>

            <motion.p
              variants={item}
              className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl"
            >
              Compass is your intelligent student advisor that helps you track
              performance, identify academic risks, discover career
              opportunities, and get personalised guidance throughout your
              university journey.
            </motion.p>

            <motion.div
              variants={item}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link to={ROUTES.REGISTER}>
                <Button size="lg" className="w-full sm:w-auto px-8 h-11 font-medium">
                  Get Started
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-8 h-11 font-medium gap-2"
              >
                <Play size={15} className="fill-current" />
                Watch Demo
              </Button>
            </motion.div>

            <motion.ul variants={item} className="space-y-2.5">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle size={16} className="text-success shrink-0" />
                  {f}
                </li>
              ))}
            </motion.ul>

            <motion.div variants={item}>
              <HeroStats />
            </motion.div>
          </motion.div>


        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown size={18} className="text-muted-foreground/50" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
