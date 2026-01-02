import { ReactNode } from 'react';

export default function EMSLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Exam Management System (EMS)</h1>
        <p className="text-muted-foreground">Real-time practice • Adaptive teaching • Infinite patience</p>
      </header>
      <main className="container mx-auto p-6">
        {children}
      </main>
    </div>
  );
}