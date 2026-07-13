export default function LandingPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">
        AI-Powered Academic Advisor
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
        Compass transforms the student experience at Yaoundé International
        Business School with AI-driven guidance for course selection,
        performance tracking, and career planning.
      </p>
      <div className="flex gap-4 justify-center">
        <a
          href="/register"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Get started
        </a>
        <a
          href="/features"
          className="inline-flex items-center justify-center rounded-md border border-border px-6 py-3 text-sm font-medium hover:bg-accent"
        >
          Learn more
        </a>
      </div>
    </div>
  );
}
