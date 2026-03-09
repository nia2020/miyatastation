export default function MemberLoading() {
  return (
    <div className="space-y-8 min-w-0 overflow-hidden animate-pulse">
      <div className="flex items-center gap-6">
        <div className="shrink-0 w-24 h-24 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-2">
          <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-32 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
          />
        ))}
      </div>
    </div>
  );
}
