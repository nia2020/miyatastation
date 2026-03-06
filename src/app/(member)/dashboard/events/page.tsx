import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/types/database";
import { EventCard } from "@/components/events/EventCard";

export const dynamic = "force-dynamic";

export default async function DashboardEventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [upcoming, past] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true }),
    supabase
      .from("events")
      .select("*")
      .lt("event_date", new Date().toISOString())
      .order("event_date", { ascending: false })
      .limit(5),
  ]);
  const upcomingEvents = upcoming.data as Event[] | null;
  const pastEvents = past.data as Event[] | null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
        イベント情報
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
      {pastEvents && pastEvents.length > 0 && (
        <>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-8">
            過去のイベント
          </h2>
          <div className="space-y-4">
            {pastEvents.map((event) => (
              <EventCard key={event.id} event={event} isPast />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
