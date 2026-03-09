export default function DashboardLoading() {
  return (
    <div className="space-y-6 min-w-0 overflow-hidden animate-pulse">
      <div className="h-8 w-40 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-4">
        <div className="h-24 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="h-24 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="h-24 rounded-xl bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}
