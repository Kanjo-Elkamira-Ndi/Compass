import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  MessageSquare,
  ShieldAlert,
  FileSearch,
  FileText,
  Briefcase,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import PageHeroCarousel from '@/components/public/PageHeroCarousel';
import type { LucideIcon } from 'lucide-react';

const HERO_SLIDES = [
  {
    image: '/carousel_1.png',
    title: 'Powered by AI, Designed for Students',
    subtitle: 'Five specialized modules that work together to give you a complete academic toolkit — from day-to-day questions to long-term career planning.',
  },
  {
    image: '/carousel_2.png',
    title: 'Smart Analytics, Real Results',
    subtitle: 'Risk assessment with 87% accuracy, trend analysis that catches issues early, and personalised insights that actually move the needle.',
  },
  {
    image: '/carousel_3.png',
    title: 'Your Academic Journey, Reimagined',
    subtitle: 'From AI chat to career guidance — every tool a student needs, powered by the latest in retrieval-augmented generation.',
  },
];

/* ─── Feature detail data ─── */
interface FeatureDetail {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
  reversed: boolean;
}

const FEATURES: FeatureDetail[] = [
  {
    icon: MessageSquare,
    title: 'AI Academic Chat',
    description:
      'Your always-on academic advisor. Ask questions about courses, degree requirements, university policies, or academic planning — and get accurate, sourced answers in seconds.',
    bullets: [
      'Natural language conversations about any academic topic',
      'Answers sourced from official university documents and handbooks',
      'Conversation history saved for future reference',
      'Context-aware responses based on your enrolled programme',
    ],
    reversed: false,
  },
  {
    icon: ShieldAlert,
    title: 'Risk Assessment',
    description:
      'An early warning system that continuously monitors your academic performance and flags potential issues before they become critical — so you can take action early.',
    bullets: [
      'Multi-factor analysis: GPA trends, attendance, course load',
      'Four-level risk classification: Excellent, Passing, At-Risk, Critical',
      'Personalized recommended actions for each risk factor',
      'Automatic alerts when risk level changes',
    ],
    reversed: true,
  },
  {
    icon: FileSearch,
    title: 'Research Assistant',
    description:
      'Upload research papers, articles, or your own drafts and receive a structured AI analysis including summaries, key findings, methodology breakdowns, and identified research gaps.',
    bullets: [
      'Automatic extraction of key findings and contributions',
      'Research gap identification for literature reviews',
      'Methodology analysis and comparison',
      'Exportable structured reports in multiple formats',
    ],
    reversed: false,
  },
  {
    icon: FileText,
    title: 'Exam Generator',
    description:
      'Create customized exam papers from your course content. Choose question types, difficulty levels, and topics — and let AI generate a complete, balanced assessment in minutes.',
    bullets: [
      'Multiple question types: MCQ, short answer, essay, true/false',
      'Adjustable difficulty levels per question or entire exam',
      'Automatic answer keys with detailed explanations',
      'Balanced coverage across selected topics',
    ],
    reversed: true,
  },
  {
    icon: Briefcase,
    title: 'Career Advisor',
    description:
      'Get personalized career recommendations based on your academic profile, skills, and interests. Explore pathways, required certifications, and market demand — all tailored to you.',
    bullets: [
      'Career match scoring based on your academic strengths',
      'Skills gap analysis for your target roles',
      'Certification and professional development recommendations',
      'Salary and market growth rate insights',
    ],
    reversed: false,
  },
];

/* ─── Scroll-reveal section ─── */
function FeatureSection({ feature, index }: { feature: FeatureDetail; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: 0.1, ease: 'easeOut' }}
    >
      <Card className="overflow-hidden">
        <CardContent className="py-0">
          <div
            className={`flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:gap-12 ${
              feature.reversed ? 'lg:flex-row-reverse' : ''
            }`}
          >
            {/* Icon block */}
            <div className="flex shrink-0 items-center justify-center">
              <div className="flex size-20 items-center justify-center rounded-2xl bg-secondary/10 sm:size-24">
                <feature.icon className="size-10 text-secondary sm:size-12" />
              </div>
            </div>

            {/* Text block */}
            <div className="flex-1 space-y-4">
              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
              <ul className="space-y-2.5 pt-1">
                {feature.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-foreground/80">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   FeaturesPage
   ═══════════════════════════════════════════════ */
export function FeaturesPage() {
  const navigate = useNavigate();

  return (
    <div>
      {/* ─── Hero Carousel ─── */}
      <PageHeroCarousel slides={HERO_SLIDES} />

      {/* ─── Feature Sections ─── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
          {FEATURES.map((f, i) => (
            <FeatureSection key={f.title} feature={f} index={i} />
          ))}
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="bg-muted/30 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Start using all modules today
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
              Free for students. Create your account and explore every feature within minutes.
            </p>
            <Button
              size="lg"
              className="mt-8"
              onClick={() => navigate('/register')}
              aria-label="Create your account to get started"
            >
              Create your account
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}