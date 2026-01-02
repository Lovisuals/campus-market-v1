import Link from 'next/link';

export default function EMSDashboard() {
  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <h2 className="text-4xl font-bold mb-4">FreeGST Practice Hub</h2>
        <p className="text-2xl mb-6">Freely Learn & Practice Your General Studies Papers Here</p>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Real-time timed exams • Instant feedback • Infinite-patient AI teacher for every learner • Focused on NOUN GST courses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Link href="/ems/practice" className="border rounded-lg p-8 text-center hover:bg-accent transition">
          <h3 className="text-2xl font-semibold mb-2">Start Practice Exam</h3>
          <p className="text-muted-foreground">Timed GST questions • Adaptive difficulty</p>
        </Link>

        <Link href="/ems/progress" className="border rounded-lg p-8 text-center hover:bg-accent transition">
          <h3 className="text-2xl font-semibold mb-2">My Progress</h3>
          <p className="text-muted-foreground">Track scores • Review weak topics</p>
        </Link>

        <Link href="/ems/learn" className="border rounded-lg p-8 text-center hover:bg-accent transition">
          <h3 className="text-2xl font-semibold mb-2">Learn with AI Teacher</h3>
          <p className="text-muted-foreground">Step-by-step explanations • Perfect for slow learners</p>
        </Link>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-12">
        Focused on GST101–105 & GST203 • More courses coming • Powered by CAMPUS MARKET P2P
      </p>
    </div>
  );
}
