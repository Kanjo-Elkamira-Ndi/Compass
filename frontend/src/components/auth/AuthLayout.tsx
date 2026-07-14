import { Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

const floatingCards = [
  {
    quote: '"AI Chat helped me choose my major"',
    author: '— Final-year Student',
    x: '6%',
    y: '15%',
    delay: 0,
    duration: 6,
  },
  {
    quote: '"My GPA improved by 15% using the trend analysis"',
    author: '— 2nd-year Student',
    x: '52%',
    y: '8%',
    delay: 1.5,
    duration: 7,
  },
  {
    quote: '"The research assistant saved me 10+ hours"',
    author: '— Postgraduate Student',
    x: '10%',
    y: '68%',
    delay: 0.8,
    duration: 5.5,
  },
  {
    quote: 'TRENDING: AI Chat · Research Assistant · Career Advisor',
    author: '',
    x: '55%',
    y: '74%',
    delay: 2.2,
    duration: 6.5,
  },
];

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left — image + branding (hidden on mobile) */}
      <div className="relative hidden lg:flex lg:w-1/2 items-center justify-center overflow-hidden">
        <img
          src="/auth_cover_img.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

        {/* Floating cards */}
        {floatingCards.map((card, i) => (
          <motion.div
            key={i}
            className="absolute max-w-[240px] rounded-xl bg-white/10 backdrop-blur-md px-4 py-3 text-white text-sm shadow-xl border border-white/15"
            style={{ left: card.x, top: card.y }}
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: card.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: card.delay,
            }}
          >
            <p className="font-medium leading-snug">{card.quote}</p>
            {card.author && (
              <p className="mt-1 text-xs text-white/60">{card.author}</p>
            )}
          </motion.div>
        ))}

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col items-start text-left text-white px-14 max-w-lg">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/25">
              <Navigation className="size-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Compass</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Your AI-Powered Academic Journey
          </h2>
          <div className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2">
            <span className="size-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-white/90">1,200+ Students Already Onboard</span>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
}
