import { motion } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  Compass,
  Sparkles,
  Star,
} from "lucide-react";

const academicIcons = [
  { Icon: GraduationCap, x: "10%", y: "20%", size: 28, delay: 0 },
  { Icon: BookOpen, x: "85%", y: "15%", size: 24, delay: 1.2 },
  { Icon: Compass, x: "75%", y: "70%", size: 32, delay: 0.6 },
  { Icon: Sparkles, x: "15%", y: "75%", size: 20, delay: 1.8 },
  { Icon: Star, x: "50%", y: "10%", size: 22, delay: 2.4 },
  { Icon: GraduationCap, x: "90%", y: "45%", size: 20, delay: 3.0 },
  { Icon: BookOpen, x: "5%", y: "50%", size: 26, delay: 0.9 },
  { Icon: Sparkles, x: "60%", y: "80%", size: 18, delay: 1.5 },
];

const floatingOrbs = [
  { x: "15%", y: "25%", size: 320, color: "bg-primary/5", delay: 0 },
  { x: "70%", y: "20%", size: 280, color: "bg-secondary/5", delay: 2 },
  { x: "50%", y: "65%", size: 240, color: "bg-success/4", delay: 4 },
  { x: "25%", y: "80%", size: 200, color: "bg-primary/3", delay: 1 },
  { x: "85%", y: "60%", size: 180, color: "bg-secondary/4", delay: 3 },
];

export default function FloatingBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, oklch(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(var(--primary) / 0.08),transparent)]" />

      {/* Floating blurred orbs */}
      {floatingOrbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${orb.color}`}
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -25, 15, 0],
            scale: [1, 1.05, 0.95, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}

      {/* Floating academic icons */}
      {academicIcons.map((item, i) => {
        const { Icon } = item;
        return (
          <motion.div
            key={i}
            className="absolute text-primary/[0.07]"
            style={{ left: item.x, top: item.y }}
            animate={{
              y: [0, -12, 8, -4, 0],
              x: [0, 6, -4, 2, 0],
              rotate: [0, 5, -3, 1, 0],
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "easeInOut",
              delay: item.delay,
            }}
          >
            <Icon size={item.size} strokeWidth={1.5} />
          </motion.div>
        );
      })}

      {/* Animated light beam */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px]"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 50%, oklch(var(--primary) / 0.04) 0deg, transparent 60deg, oklch(var(--secondary) / 0.03) 120deg, transparent 180deg, oklch(var(--primary) / 0.02) 240deg, transparent 300deg, oklch(var(--primary) / 0.04) 360deg)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
