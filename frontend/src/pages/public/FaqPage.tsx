import { HelpCircle, ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useNavigate } from 'react-router-dom';

const FAQ_ITEMS = [
  {
    question: 'What is Compass?',
    answer: 'Compass is an AI-powered academic advisory platform designed for university students. It provides personalized guidance on course selection, career planning, risk assessment, and research analysis — all powered by advanced artificial intelligence.',
  },
  {
    question: 'How does the AI academic advisor work?',
    answer: 'Our AI advisor is trained on your university\'s curriculum, academic policies, and historical student data. When you ask a question, it retrieves relevant information from indexed documents and provides accurate, contextual answers with source citations so you can verify the information.',
  },
  {
    question: 'Is my data private and secure?',
    answer: 'Absolutely. Your academic data is encrypted and never shared with third parties. Access tokens are stored only in your browser\'s active memory (never in localStorage or cookies) and are cleared when you log out. We comply with university data protection policies and GDPR standards.',
  },
  {
    question: 'Who can use Compass?',
    answer: 'Compass is available to all members of the university community — students, lecturers, and administrators. Each role has access to different features tailored to their needs. Students get the full AI suite, lecturers can generate exams and track student progress, and administrators manage users and content.',
  },
  {
    question: 'What AI modules are available?',
    answer: 'Compass includes five AI-powered modules:\n\n• **AI Academic Chat** — Ask questions and get instant, sourced answers\n• **Risk Assessment** — Early warning system for academic performance\n• **Research Assistant** — Upload papers for structured AI analysis\n• **Exam Generator** — Create tailored exam papers (lecturers)\n• **Career Advisor** — Get personalized career recommendations',
  },
  {
    question: 'How accurate is the risk assessment?',
    answer: 'Our risk assessment model analyzes multiple factors including GPA trends, attendance, assignment submission patterns, and engagement scores. It has been validated against historical data with approximately 87% accuracy in identifying at-risk students at least 4 weeks before academic issues become critical.',
  },
  {
    question: 'Can I use Compass on my phone?',
    answer: 'Yes! Compass is fully responsive and works seamlessly on mobile devices, tablets, and desktop computers. The interface adapts to your screen size, and all features are accessible on any device.',
  },
  {
    question: 'Is Compass free for students?',
    answer: 'Yes, Compass is provided free of charge to all enrolled students. It\'s a university-supported service designed to improve academic outcomes and student success. There are no hidden fees or premium tiers.',
  },
  {
    question: 'How do I get started?',
    answer: 'Simply create an account with your university email address, select your role (Student, Lecturer, or Administrator), and you\'re ready to go. The AI chat is available immediately, and your dashboard populates as you engage with the platform.',
  },
  {
    question: 'Can lecturers generate custom exams?',
    answer: 'Yes! The Exam Generator module allows lecturers to specify a topic, difficulty level, question types (MCQ, short answer, essay, true/false), and question count. The AI generates a complete exam that can be edited, reordered via drag-and-drop, and exported for use.',
  },
];

export function FAQPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh]">
      {/* Hero */}
      <section className="py-16 md:py-24 text-center px-4">
        <div className="mx-auto max-w-3xl">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10">
            <HelpCircle className="h-7 w-7 text-secondary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Find answers to common questions about Compass and how it can help
            you succeed academically.
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={index} value={`faq-${index}`}>
              <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 py-16 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <MessageCircle className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h2 className="text-2xl font-bold">Still have questions?</h2>
          <p className="mt-2 text-muted-foreground">
            We&apos;d love to hear from you. Reach out and we&apos;ll get back
            to you within 24 hours.
          </p>
          <Button
            className="mt-6"
            onClick={() => navigate('/contact')}
            aria-label="Go to contact page"
          >
            Contact Us
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}