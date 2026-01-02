import Link from 'next/link';

export default function EMSDashboard() {
  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <h2 className="text-4xl font-bold mb-4">Welcome to Quantica EMS</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Practice real exams with timer • Get instant feedback • Learn at your own pace with an infinite-patient AI teacher
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Link href="/ems/practice" className="border rounded-lg p-8 text-center hover:bg-accent transition">
          <h3 className="text-2xl font-semibold mb-2">Start Practice Exam</h3>
          <p className="text-muted-foreground">Timed questions • Adaptive difficulty</p>
        </Link>

        <Link href="/ems/progress" className="border rounded-lg p-8 text-center hover:bg-accent transition">
          <h3 className="text-2xl font-semibold mb-2">My Progress</h3>
          <p className="text-muted-foreground">Track performance • Review mistakes</p>
        </Link>

        <Link href="/ems/topics" className="border rounded-lg p-8 text-center hover:bg-accent transition">
          <h3 className="text-2xl font-semibold mb-2">Study Topics</h3>
          <p className="text-muted-foreground">AI-guided lessons • Slow-learner friendly</p>
        </Link>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-12">
        EMS is in active development • Powered by sovereign augmented intelligence
      </p>
    </div>
  );
}