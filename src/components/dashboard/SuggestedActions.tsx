type Props = {
  actions: string[];
};

export function SuggestedActions({ actions }: Props) {
  return (
    <section className="glass rounded-xl p-5">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Suggested Actions</h2>
      {actions.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">Suggestions appear after each response.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {actions.map((action) => (
            <li key={action} className="rounded-lg border border-ink-800 bg-ink-900 p-3 text-sm text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800/50 hover:text-zinc-100 cursor-pointer">
              {action}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
