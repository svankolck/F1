import { getRaceCalendar } from '@/lib/api/jolpica';
import CalendarClient from '@/components/calendar/CalendarClient';

export const revalidate = 300;

export default async function CalendarPage() {
  const season = '2026';
  const races = await getRaceCalendar(season);

  return (
    <div className="flex flex-col gap-6 py-4">
      <section className="relative overflow-hidden rounded-2xl border border-f1-border bg-f1-surface/30 p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(225,6,0,0.2),transparent_55%)]" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-tight">{season} Race Calendar</h1>
          <p className="text-f1-text-secondary mt-2">
            Full Formula 1 season overview. Tap a race to open detailed results.
          </p>
        </div>
      </section>

      <CalendarClient races={races} season={season} />
    </div>
  );
}
