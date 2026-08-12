import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Lightbulb,
  Globe,
  Users,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import PageHeroCarousel from '@/components/public/PageHeroCarousel';
import StorySection from '@/components/public/StorySection';
import type { LucideIcon } from 'lucide-react';

const HERO_SLIDES = [
  {
    image: '/carousel_2.png',
    title: 'Empowering Students with AI-Driven Guidance',
    subtitle: 'No student should navigate university alone. We built Compass to democratise academic support for every learner.',
  },
  {
    image: '/carousel_1.png',
    title: 'Built from Real Student Struggles',
    subtitle: 'From a pilot with 200 students to a platform serving 1,200+ — Compass grew from a simple idea: every student deserves a personal advisor.',
  },
  {
    image: '/carousel_3.png',
    title: 'A Team That Cares',
    subtitle: 'Academic advisors, engineers, researchers, and designers — united by one mission: making student success accessible to all.',
  },
];

/* ─── Values ─── */
const VALUES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Lightbulb,
    title: 'Innovation',
    description:
      'We push the boundaries of AI to solve real academic challenges, constantly improving our models and expanding module capabilities.',
  },
  {
    icon: Globe,
    title: 'Accessibility',
    description:
      'Every student deserves guidance. Compass is designed with accessibility at its core — intuitive interfaces, clear language, and responsive design.',
  },
  {
    icon: Users,
    title: 'Student-Centric',
    description:
      'Students are at the heart of every decision we make. Features are built from student feedback and validated with real academic use cases.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy-First',
    description:
      'Your academic data is sensitive. We never sell data, use it for training without consent, or store authentication tokens persistently.',
  },
];

/* ─── Team ─── */
const TEAM = [
  {
    name: 'Dr. Engr. Kimbi Eric Jam',
    role: 'Founder & Dean of Studies',
    bio: 'Dean of Studies and academic researcher across several of Cameroon’s leading institutions. His years advising students in person became the spark that led to Compass — turning decades of academic guidance into something every student could reach, day or night.',
    initials: 'KJ',
    image: '/dean.jpeg',
  },
  {
    name: 'Kanjo Elkamira',
    role: 'Lead Software Engineer & Systems Architect',
    bio: 'Designs and builds the systems behind Compass end to end — from the AI pipelines that power academic guidance to the infrastructure that keeps it running reliably for every student.',
    initials: 'KE',
    image: '/kanjo_elkamira.jpg',
  },
  {
    name: 'Chatioh Densley',
    role: 'Lead UI/UX Designer & Frontend Developer',
    bio: 'Shapes how Compass looks and feels — turning complex academic workflows into interfaces students actually enjoy using, from first login to graduation.',
    initials: 'CD',
    image: '/chatioh_densley.jpg',
  },
  {
    name: 'Fola Loius',
    role: 'Software / DevOps Engineer',
    bio: 'Keeps Compass shipping safely and running smoothly — from CI/CD pipelines to deployment infrastructure — so new features reach students without breaking what already works.',
    initials: 'FL',
    image: '/fola_loius.jpg',
  },
  {
    name: 'Jackai Zo’o Bill Emmanuel',
    role: 'Associate Software Engineer',
    bio: 'Contributes across the Compass codebase, helping build and refine the features students rely on every day.',
    initials: 'JE',
  },
  {
    name: 'Nkollo Okala Steve',
    role: 'Associate Software Engineer',
    bio: 'Works across the stack on Compass, turning feature requirements into reliable, well-tested code.',
    initials: 'NS',
  },
];

/* ─── Fade-up helper ─── */
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   AboutPage
   ═══════════════════════════════════════════════ */
export function AboutPage() {
  const navigate = useNavigate();

  return (
    <div>
      {/* ─── Hero Carousel ─── */}
      <PageHeroCarousel slides={HERO_SLIDES} />

      {/* ─── Our Mission ─── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Mission</h2>
              <div className="mx-auto mt-6 max-w-2xl space-y-4 text-muted-foreground text-lg leading-relaxed">
                <p>
                  Compass was built on a simple belief: every student deserves a personal
                  academic advisor — not just those who can afford one or know to ask.
                </p>
                <p>
                  Our mission is to leverage artificial intelligence to democratize academic
                  guidance, giving every university student access to instant, accurate, and
                  personalized support throughout their entire academic journey.
                </p>
                <p>
                  From choosing the right courses to identifying at-risk patterns early, from
                  streamlining research to planning your career — Compass is the
                  comprehensive toolkit students have been waiting for.
                </p>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ─── The Story ─── */}
      <StorySection />

      {/* ─── The Team ─── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">The Team</h2>
              <p className="mt-4 text-muted-foreground text-lg">
                A small, dedicated team building something big.
              </p>
            </div>
          </FadeUp>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((member, i) => (
              <FadeUp key={member.name} delay={i * 0.1}>
                <Card className="h-full overflow-hidden gap-0 py-0">
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-primary/10">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-4xl font-bold text-primary">{member.initials}</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="py-6 text-center">
                    <h3 className="text-lg font-semibold">{member.name}</h3>
                    <p className="text-sm font-medium text-secondary">{member.role}</p>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      {member.bio}
                    </p>
                  </CardContent>
                </Card>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Our Values ─── */}
      <section className="bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Values</h2>
              <p className="mt-4 text-muted-foreground text-lg">
                The principles that guide every decision we make.
              </p>
            </div>
          </FadeUp>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <FadeUp key={v.title} delay={i * 0.1}>
                <Card className="h-full">
                  <CardContent className="pt-0">
                    <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-secondary/10">
                      <v.icon className="size-6 text-secondary" />
                    </div>
                    <h3 className="text-lg font-semibold">{v.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {v.description}
                    </p>
                  </CardContent>
                </Card>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative overflow-hidden py-20 sm:py-24">
        <img
          src="/carousel_3.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Join the Compass community
            </h2>
            <p className="mt-4 text-white/70 text-lg max-w-xl mx-auto">
              Be part of the movement to make academic guidance accessible to every student.
            </p>
            <Button
              size="lg"
              className="mt-8 bg-white text-primary hover:bg-white/90 font-semibold"
              onClick={() => navigate('/register')}
              aria-label="Create your account"
            >
              Get started
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}