import { createClient } from "@/lib/supabase/server";
import { EventCard } from "@/components/events/EventCard";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("*")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true });

  const { data: pastEvents } = await supabase
    .from("events")
    .select("*")
    .lt("event_date", new Date().toISOString())
    .order("event_date", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">イベント一覧</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Zoomイベントのスケジュールと入室情報
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
          今後のイベント
        </h2>
        {upcomingEvents && upcomingEvents.length > 0 ? (
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 text-center text-slate-600 dark:text-slate-400">
            現在予定されているイベントはありません
          </div>
        )}
      </section>

      {pastEvents && pastEvents.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
            過去のイベント
          </h2>
          <div className="space-y-4">
            {pastEvents.map((event) => (
              <EventCard key={event.id} event={event} isPast />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
