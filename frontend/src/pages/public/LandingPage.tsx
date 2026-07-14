import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { MessageSquare, ShieldAlert, FileSearch, FileText, Briefcase, ArrowRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import HeroSection from '@/components/public/HeroSection';

/* ─── Feature data ─── */
const FEATURES = [
  {
    icon: MessageSquare,
    title: 'AI Academic Chat',
    description:
      'Get instant answers about courses, policies, and academic requirements.',
  },
  {
    icon: ShieldAlert,
    title: 'Risk Assessment',
    description:
      'Early warning system that identifies at-risk students before they fall behind.',
  },
  {
    icon: FileSearch,
    title: 'Research Assistant',
    description:
      'Upload research papers and get structured AI-powered analysis.',
  },
  {
    icon: FileText,
    title: 'Exam Generator',
    description:
      'AI-generated exam papers tailored to your course content.',
  },
  {
    icon: Briefcase,
    title: 'Career Advisor',
    description:
      'Personalized career recommendations based on your academic profile.',
  },
];

/* ─── Stats data ─── */
const STATS = [
  { target: 1200, suffix: '+', label: 'Active Students' },
  { target: 85, suffix: '', label: 'Courses' },
  { target: 40000, suffix: '+', label: 'AI Queries Answered' },
];

/* ─── Counter hook ─── */
function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    let rafId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration, start]);

  return count;
}

/* ─── StatItem ─── */
function StatItem({ target, suffix, label, inView }: { target: number; suffix: string; label: string; inView: boolean }) {
  const count = useCounter(target, 2200, inView);
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
        {count.toLocaleString()}
        {suffix}
      </p>
      <p className="mt-2 text-sm text-white/70 sm:text-base">{label}</p>
    </div>
  );
}

/* ─── Testimonials ─── */
const TESTIMONIALS = [
  {
    quote:
      'Compass helped me realize I was on the wrong track for my degree requirements. The risk assessment flagged me early, and I was able to adjust my course load before it was too late.',
    name: 'Amira Hassan',
    role: 'Computer Science, Year 3',
  },
  {
    quote:
      "The AI chat is like having a 24/7 academic advisor. I got clear answers about credit transfers and prerequisite rules in seconds — no more waiting days for an email reply.",
    name: 'James Okonkwo',
    role: 'Data Science, Year 2',
  },
  {
    quote:
      'The research assistant saved me hours of work. I uploaded my literature review draft and got a structured analysis with gaps I hadn\'t even noticed. Truly game-changing.',
    name: 'Sofia Martinez',
    role: 'Psychology, Year 4',
  },
];

/* ─── Fade-up wrapper ─── */
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   LandingPage
   ═══════════════════════════════════════════════ */
export function LandingPage() {
  const navigate = useNavigate();
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-80px' });

  return (
    <div>
      {/* ─── Hero ─── */}
      <HeroSection />

      {/* ─── Feature Grid ─── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Five powerful AI modules
              </h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
                Everything you need to succeed academically — powered by cutting-edge
                artificial intelligence.
              </p>
            </div>
          </FadeUp>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.1}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="pt-0">
                    <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-secondary/10">
                      <f.icon className="size-6 text-secondary" />
                    </div>
                    <h3 className="text-lg font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {f.description}
                    </p>
                  </CardContent>
                </Card>
              </FadeUp>
            ))}

            {/* Extra centered card for visual balance on 5 items */}
            <FadeUp delay={0.5}>
              <Card className="h-full border-dashed border-2 bg-muted/30 flex items-center justify-center">
                <CardContent className="pt-0 text-center">
                  <p className="text-sm text-muted-foreground">
                    And more modules
                    <br />
                    coming soon&hellip;
                  </p>
                </CardContent>
              </Card>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ─── Stats Strip ─── */}
      <section className="bg-primary py-16 sm:py-20" ref={statsRef}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 gap-10 sm:grid-cols-3"
          >
            {STATS.map((s) => (
              <StatItem key={s.label} {...s} inView={statsInView} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Loved by students
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">
                Hear what students have to say about their Compass experience.
              </p>
            </div>
          </FadeUp>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <FadeUp key={t.name} delay={i * 0.12}>
                <Card className="h-full">
                  <CardContent className="pt-0 flex flex-col h-full">
                    <Quote className="size-8 text-secondary/40 mb-4 shrink-0" />
                    <p className="text-sm text-foreground/80 leading-relaxed flex-1">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {t.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="hero-gradient py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to transform your academic journey?
            </h2>
            <p className="mt-4 text-white/70 text-lg">
              Join thousands of students already using Compass to stay on track and achieve
              their goals.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 font-semibold"
                onClick={() => navigate('/register')}
                aria-label="Get started for free"
              >
                Get started for free
                <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10"
                onClick={() => navigate('/features')}
                aria-label="Learn more about features"
              >
                Learn more
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}