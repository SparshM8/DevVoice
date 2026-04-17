export function SuspenseFallback() {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-3/4 rounded-lg bg-slate-700" />
        <div className="h-4 w-2/3 rounded-lg bg-slate-700" />
        <div className="h-4 w-1/2 rounded-lg bg-slate-700" />
      </div>
    </div>
  );
}
