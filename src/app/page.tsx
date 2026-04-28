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
        <section className="relative overflow-hidden rounded-3xl border border-ink-800 bg-ink-950/40 p-1 shadow-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          <div className="relative grid gap-10 rounded-[1.4rem] border border-ink-800/60 bg-ink-950 p-8 lg:grid-cols-[1.1fr,0.9fr] lg:p-12">
            <div>
              <p className="mb-4 inline-block rounded-full border border-neon-cyan/20 bg-neon-cyan/10 px-3 py-1 text-xs font-semibold tracking-widest text-neon-cyan">
                VOICE-NATIVE AI AGENT
              </p>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tighter text-zinc-100 sm:text-5xl lg:text-6xl">
                Code and debug at the speed of thought.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400">
                Talk through errors, API confusion, and workflow friction. DevVoice transcribes your query,
                retrieves technical context from Qdrant, and responds with spoken and visual guidance in real-time.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-zinc-100 px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-white"
                >
                  Launch Dashboard
                </Link>
                <Link
                  href="/demo"
                  className="rounded-lg border border-ink-800 bg-transparent px-6 py-3 text-sm font-medium text-zinc-300 transition hover:bg-ink-900 hover:text-white"
                >
                  View Demo Flow
                </Link>
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="w-full max-w-sm rounded-xl border border-ink-800 bg-ink-900/50 p-6 shadow-2xl backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neon-mint">Voice Prompt</p>
                <p className="mt-3 text-sm text-zinc-200">
                  &quot;Why is my React useEffect causing repeated renders when fetching data?&quot;
                </p>
                <div className="mt-5 rounded-lg border border-ink-800 bg-black p-4 text-sm text-zinc-400">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-neon-cyan"></div>
                    <p className="text-xs font-medium text-neon-cyan">Analyzing...</p>
                  </div>
                  <p className="leading-relaxed">
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
              <article key={item.title} className="rounded-xl border border-ink-800 bg-ink-900/30 p-6 transition hover:bg-ink-900/60 hover:border-ink-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-800/50">
                  <Icon className="h-5 w-5 text-neon-cyan" />
                </div>
                <h2 className="mt-5 text-base font-semibold text-zinc-100">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.text}</p>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
