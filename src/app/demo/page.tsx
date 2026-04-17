"use client";

import { ChevronRight } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";

type DemoPrompt = {
  category: string;
  text: string;
  context: string;
};

const DEMO_PROMPTS: DemoPrompt[] = [
  {
    category: "React Debugging",
    text: "Why is my React useEffect causing repeated renders when I fetch data?",
    context: "Common when effect updates state in its dependency list",
  },
  {
    category: "Stack Trace Analysis",
    text: "Analyze this error and suggest the fastest fix: TypeError: Cannot read property 'email' of null at login.js:42",
    context: "Likely null check missing before property access",
  },
  {
    category: "API Error Handling",
    text: "My API returns 429 Too Many Requests. How should I handle retries?",
    context: "Use exponential backoff with jitter",
  },
  {
    category: "TypeScript Issues",
    text: "Type error: Type 'string | null' is not assignable to type 'string'. How do I fix this?",
    context: "Need to add null guard or type narrowing",
  },
  {
    category: "Terminal Errors",
    text: "What does EADDRINUSE mean and how do I fix 'Address already in use' error?",
    context: "Port is bound, need to find and kill existing process",
  },
  {
    category: "Performance",
    text: "My React component is re-rendering too often. How do I optimize it?",
    context: "Use React.memo, useMemo, useCallback patterns",
  },
  {
    category: "Async Patterns",
    text: "Explain the difference between async/await and promises. When should I use each?",
    context: "Async/await is syntactic sugar, both work with promises",
  },
  {
    category: "Database",
    text: "I'm getting ECONNREFUSED connecting to my database. What's wrong?",
    context: "Service not running on expected host/port, check connection string",
  },
];

export default function DemoPage() {
  const grouped = DEMO_PROMPTS.reduce(
    (acc, p) => {
      const cat = p.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    },
    {} as Record<string, DemoPrompt[]>
  );

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-white">DevVoice Demo Guide</h1>
          <p className="mt-3 text-slate-300">
            Voice-first debugging workflow for developers. Ask questions naturally, get intelligent context-aware responses.
          </p>
        </div>

        <section className="glass mb-8 rounded-2xl p-6 lg:p-8">
          <h2 className="text-xl font-semibold text-white">Quick Start Demo</h2>
          <ol className="mt-5 space-y-3 pl-0">
            {[
              {
                num: 1,
                title: "Seed Demo Data",
                desc: "Click 'Seed Data' button below or run: curl -X POST http://localhost:3000/api/seed",
              },
              {
                num: 2,
                title: "Open Dashboard",
                desc: "Navigate to /dashboard and press 'Push to talk' or type your question",
              },
              {
                num: 3,
                title: "Ask a Question",
                desc: "Use one of the prompts below, or ask your own debugging question",
              },
              {
                num: 4,
                title: "Review Results",
                desc: "See live transcript, retrieved context cards, suggestions, and hear the spoken response",
              },
              {
                num: 5,
                title: "Check History",
                desc: "Visit /history to show session continuity and persistent memory",
              },
            ].map((step) => (
              <li key={step.num} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neon-cyan text-ink-950 font-bold">
                  {step.num}
                </span>
                <div>
                  <p className="font-medium text-white">{step.title}</p>
                  <p className="text-sm text-slate-300">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <button
            onClick={() => {
              fetch("/api/seed", { method: "POST" })
                .then((r) => r.json())
                .then((data) => alert(`Seeded ${data.chunksStored} chunks!`))
                .catch(() => alert("Seed failed"));
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-neon-mint px-4 py-2 font-medium text-ink-950 hover:bg-emerald-300"
          >
            Seed Demo Data
            <ChevronRight className="h-4 w-4" />
          </button>
        </section>

        <section>
          <h2 className="mb-6 text-xl font-semibold text-white">Example Prompts by Category</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(grouped).map(([category, prompts]) => (
              <div key={category} className="glass rounded-2xl p-5">
                <h3 className="font-semibold text-neon-cyan">{category}</h3>
                <div className="mt-4 space-y-3">
                  {prompts.map((p, idx) => (
                    <div key={idx} className="rounded-lg border border-ink-700 bg-ink-900/50 p-3 text-sm">
                      <p className="text-slate-100">{p.text}</p>
                      <p className="mt-2 text-xs text-slate-400 italic">{p.context}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass mt-12 rounded-2xl p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-white">What happens behind the scenes?</h2>
          <ul className="mt-4 space-y-3 text-slate-300">
            <li className="flex gap-3">
              <span className="shrink-0 text-neon-cyan">•</span>
              <span>Your voice is transcribed using browser Web Speech API or Vapi</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-neon-cyan">•</span>
              <span>Query is embedded and searched against Qdrant for relevant documentation</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-neon-cyan">•</span>
              <span>Context is sent to LLM (OpenAI or mock) along with conversation history</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-neon-cyan">•</span>
              <span>Response is generated, spoken aloud, and shown with source citations</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-neon-cyan">•</span>
              <span>Session is saved for continuity—refresh or revisit history page anytime</span>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
