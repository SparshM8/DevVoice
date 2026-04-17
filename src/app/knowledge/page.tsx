"use client";

import { FormEvent, useState } from "react";
import { TopNav } from "@/components/layout/TopNav";

export default function KnowledgePage() {
  const [status, setStatus] = useState("Upload docs, code, or logs to seed your context engine.");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");
    if (!(file instanceof File)) {
      setStatus("Select a file first.");
      return;
    }

    setLoading(true);
    setStatus("Uploading and indexing...");
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Upload failed.");
      }
      setStatus(`Indexed ${data.chunksStored} chunks from ${data.fileName}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold text-white">Knowledge Base Upload</h1>
        <p className="mt-2 text-slate-300">
          Supported: txt, md, pdf, json, js/ts/tsx/py/java/go and terminal logs.
        </p>

        <form onSubmit={onSubmit} className="glass mt-6 rounded-2xl p-6">
          <label className="text-sm text-slate-300" htmlFor="file">
            Pick file
          </label>
          <input
            id="file"
            name="file"
            type="file"
            className="mt-3 block w-full rounded-xl border border-ink-700 bg-ink-900/80 p-3 text-sm text-slate-200"
            accept=".txt,.md,.pdf,.json,.js,.jsx,.ts,.tsx,.py,.java,.go,.log"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-4 rounded-xl bg-neon-mint px-4 py-2 font-medium text-ink-950 transition hover:bg-emerald-300 disabled:opacity-50"
          >
            {loading ? "Indexing..." : "Upload and Index"}
          </button>
          <p className="mt-4 text-sm text-slate-300">{status}</p>
        </form>
      </main>
    </div>
  );
}
