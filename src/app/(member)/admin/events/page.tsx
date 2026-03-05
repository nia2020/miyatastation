import { createClient } from "@/lib/supabase/server";
import { EventsAdmin } from "@/components/admin/EventsAdmin";

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">イベント管理</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Zoomイベントの追加・編集・削除
        </p>
      </div>

      <EventsAdmin events={events ?? []} />
    </div>
  );
}
