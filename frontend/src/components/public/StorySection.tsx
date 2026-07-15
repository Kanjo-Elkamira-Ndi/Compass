import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface StoryBlockProps {
  index: number;
  image: string;
  imageAlt: string;
  title: string;
  content: React.ReactNode;
  reversed?: boolean;
}

function StoryBlock({ index, image, imageAlt, title, content, reversed = false }: StoryBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.section
      ref={ref}
      className={`py-20 sm:py-28 ${index % 2 === 1 ? 'bg-muted/30' : 'bg-background'}`}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${reversed ? 'lg:flex-row-reverse' : ''}`}>
          {/* Text column */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: reversed ? 30 : -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                {title}
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {content}
              </h2>
            </div>
          </motion.div>

          {/* Image column */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: reversed ? -30 : 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          >
            <div className="overflow-hidden rounded-2xl border border-border/60 shadow-xl">
              <img
                src={image}
                alt={imageAlt}
                className="h-[400px] sm:h-[450px] w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            {/* Floating badge on alternating sides */}
            {index === 0 && (
              <div className="absolute -bottom-6 -right-6 hidden rounded-xl border bg-background p-4 shadow-lg sm:block">
                <p className="text-2xl font-bold text-primary">1,200+</p>
                <p className="text-xs text-muted-foreground">active students</p>
              </div>
            )}
            {index === 2 && (
              <div className="absolute -bottom-6 -left-6 hidden rounded-xl border bg-background p-4 shadow-lg sm:block">
                <p className="text-2xl font-bold text-primary">5</p>
                <p className="text-xs text-muted-foreground">AI modules</p>
              </div>
            )}
            {index === 4 && (
              <div className="absolute -bottom-6 -right-6 hidden rounded-xl border bg-background p-4 shadow-lg sm:block">
                <p className="text-2xl font-bold text-primary">Cameroon</p>
                <p className="text-xs text-muted-foreground">and beyond</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

export default function StorySection() {
  const storyBlocks = [
    {
      index: 0,
      image: '/carousel_2.png',
      imageAlt: 'Students and faculty in a Cameroonian university setting',
      title: 'The Problem',
      content: (
        <div className="space-y-4 text-muted-foreground text-base sm:text-lg leading-relaxed">
          <p>
            In 2023, Dr. Engr. Kimbi Eric Jam had spent years moving through some of
            Cameroon&apos;s higher institutes of learning — as Head of Department, Dean of
            Studies, and academic researcher at institutions including CITEC HITM, Siantou
            University Institute, Yaoundé International Business School (YIBS), and Anglia
            University, among others. Across every campus, the same pattern followed him.
          </p>
          <p>
            Students would show up at his office in the final weeks before a semester closed,
            only to discover they&apos;d missed a prerequisite, misjudged a credit
            requirement, or drifted quietly into academic risk without anyone catching it
            in time. The information they needed had always existed — in the handbook, the
            course catalog, the departmental circulars — but getting it to the right
            student at the right moment was the part that kept failing.
          </p>
        </div>
      ),
      reversed: false,
    },
    {
      index: 1,
      image: '/carousel_1.png',
      imageAlt: 'Academic advisor consulting with students',
      title: 'The Insight',
      content: (
        <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground text-base sm:text-lg leading-relaxed">
          &ldquo;I could sit with maybe forty or fifty students a week, across advising
          sessions and office hours. But a single institution could carry a few thousand
          enrolled students at a time. Most of what they needed to know, I already had
          answers for. The bottleneck was never the knowledge — it was reach.&rdquo;
        </blockquote>
      ),
      reversed: true,
    },
    {
      index: 2,
      image: '/carousel_3.png',
      imageAlt: 'Software engineers building AI platform',
      title: 'The Solution',
      content: (
        <div className="space-y-4 text-muted-foreground text-base sm:text-lg leading-relaxed">
          <p>
            That observation became the seed of Compass. Working alongside a small team
            of software engineers familiar with Cameroon&apos;s higher-education landscape,
            he helped shape the first version: a chatbot grounded in a
            university&apos;s own documents — its handbook, its course catalog, its
            academic regulations — so students could get a reliable answer at any hour,
            not just during scheduled advising windows.
          </p>
        </div>
      ),
      reversed: false,
    },
    {
      index: 3,
      image: '/auth_cover_img.png',
      imageAlt: 'Students using mobile app for academic guidance',
      title: 'The Proof',
      content: (
        <div className="space-y-4 text-muted-foreground text-base sm:text-lg leading-relaxed">
          <p>
            The early pilot, run with a few hundred students at a partner institution,
            made the case on its own. Students messaged the chatbot at odd hours — late at
            night before an exam, in the anxious days before registration closed — and got
            grounded answers instead of guesswork. When the risk-assessment module was
            added in the platform&apos;s second phase, it flagged over a dozen students
            showing early signs of academic difficulty well before midterms — students
            who, in years past, might not have been noticed until it was too late to
            change course.
          </p>
        </div>
      ),
      reversed: true,
    },
    {
      index: 4,
      image: '/carousel_1.png',
      imageAlt: 'University campus in Cameroon',
      title: 'Today & Tomorrow',
      content: (
        <div className="space-y-4 text-muted-foreground text-base sm:text-lg leading-relaxed">
          <p>
            Today, Compass has grown into a five-module platform — chatbot, risk
            prediction, research assistant, exam generation, and career guidance —
            serving over 1,200 active students across multiple faculties.
          </p>
          <p>
            With plans to expand to additional institutions across Cameroon and,
            eventually, the wider region, the journey is just beginning. The same
            principle that started it all still guides every decision: every student
            deserves a personal academic advisor, and technology can finally make that
            reach possible.
          </p>
        </div>
      ),
      reversed: false,
    },
  ];

  return (
    <>
      {storyBlocks.map((block) => (
        <StoryBlock
          key={block.index}
          {...block}
        />
      ))}
    </>
  );
}