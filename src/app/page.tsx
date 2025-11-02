import { CaseComposer } from '@/components/case-composer';

export default function Home() {
  const handleSend = (message: string) => {
    console.log('Sending message:', message);
  };

  return (
    <main className="container mx-auto max-w-4xl p-8">
      <h1 className="mb-8 text-3xl font-bold">ReOps AI - Test Harness</h1>
      <CaseComposer caseId="case_001" onSend={handleSend} />
    </main>
  );
}