import { getRaceCalendar } from '@/lib/api/jolpica';
import CalendarClient from '@/components/calendar/CalendarClient';

export const revalidate = 300;

export default async function CalendarPage() {
  const season = String(new Date().getFullYear());
  const races = await getRaceCalendar(season);

  return (
    <div className="flex flex-col gap-5 w-full py-2">
      <div>
        <h2 className="text-xs font-mono text-f1-red mb-1 uppercase tracking-widest">Season Overview</h2>
        <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-tight">{season} Calendar</h1>
        <p className="text-sm text-f1-text-secondary mt-1">
          Full Formula 1 season overview. Tap a race to open detailed results.
        </p>
      </div>
      <CalendarClient races={races} season={season} />
    </div>
  );
}
