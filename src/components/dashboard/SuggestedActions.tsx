type Props = {
  actions: string[];
};

export function SuggestedActions({ actions }: Props) {
  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="text-lg font-semibold text-white">Suggested Actions</h2>
      {actions.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">Suggestions appear after each response.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {actions.map((action) => (
            <li key={action} className="rounded-xl border border-ink-700 bg-ink-900/80 p-3 text-sm text-slate-200">
              {action}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
