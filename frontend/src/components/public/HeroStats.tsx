import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

const stats: StatItem[] = [
  { value: 1240, suffix: "+", label: "Active Students" },
  { value: 86, suffix: "", label: "Courses Available" },
  { value: 15, suffix: "K+", label: "AI Queries Answered" },
];

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function HeroStats() {
  return (
    <div className="flex gap-8 sm:gap-12 justify-center lg:justify-start">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          className="text-center lg:text-left"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 + i * 0.15 }}
        >
          <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            <CountUp target={stat.value} suffix={stat.suffix} />
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
