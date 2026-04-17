import Link from "next/link";
import { Mic, BrainCircuit, Bug, Database } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";

const highlights = [
  {
    title: "Voice-native flow",
    text: "Speak naturally, get live transcript and spoken technical guidance.",
    icon: Mic,
  },
  {
    title: "Debug copiloting",
    text: "Analyze stack traces, terminal logs, and broken code with fix paths.",
    icon: Bug,
  },
  {
    title: "Context memory",
    text: "Persist and retrieve project notes, docs, and snippets with semantic recall.",
    icon: Database,
  },
  {
    title: "Developer reasoning",
    text: "Generate pragmatic explanations, commands, and implementation suggestions.",
    icon: BrainCircuit,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6">
        <section className="glass overflow-hidden rounded-3xl shadow-glow">
          <div className="grid gap-10 p-8 lg:grid-cols-[1.1fr,0.9fr] lg:p-12">
            <div>
              <p className="mb-4 inline-block rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neon-cyan">
                Voice-Native Developer Experience Agent
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                DevVoice turns debugging and code learning into a live conversation.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300">
                Talk through errors, API confusion, and workflow friction. DevVoice transcribes your query,
                retrieves technical context from Qdrant, then responds with spoken and visual guidance.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-neon-cyan px-5 py-3 font-medium text-ink-950 transition hover:bg-cyan-300"
                >
                  Launch Dashboard
                </Link>
                <Link
                  href="/demo"
                  className="rounded-xl border border-ink-700 bg-ink-900/70 px-5 py-3 font-medium text-slate-200 transition hover:border-neon-mint/50 hover:text-white"
                >
                  View Demo Flow
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="glass animate-float rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wider text-neon-mint">Sample voice prompt</p>
                <p className="mt-2 text-lg text-white">
                  Why is my React useEffect causing repeated renders when fetching data?
                </p>
                <div className="mt-5 rounded-xl bg-ink-950/70 p-4 text-sm text-slate-300">
                  <p className="text-neon-cyan">DevVoice response preview</p>
                  <p className="mt-2">
                    Your effect depends on state that it mutates. Split data fetching from derivation and
                    memoize callback dependencies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="glass rounded-2xl p-5">
                <Icon className="h-5 w-5 text-neon-cyan" />
                <h2 className="mt-4 text-lg font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-sm text-slate-300">{item.text}</p>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
