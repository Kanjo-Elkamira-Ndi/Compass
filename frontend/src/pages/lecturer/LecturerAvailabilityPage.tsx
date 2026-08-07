import { useState, useEffect } from 'react';
import { CalendarClock, Save, Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingState, ErrorState } from '@/components/shared/states';
import { getMyAvailability, saveMyAvailability } from '@/api/client';
import type { AvailabilitySlot } from '@/types';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00-09:00',
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00',
];

export function LecturerAvailability() {
  const [state, setState] = useState<'loading' | 'error' | 'data'>('loading');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const slotKey = (day: string, slot: string) => `${day}|${slot}`;

  useEffect(() => {
    let cancelled = false;
    getMyAvailability()
      .then(res => {
        if (!cancelled) {
          const keys = new Set(res.data.map(s => slotKey(s.day, s.slot)));
          setSelected(keys);
          setState('data');
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load availability.');
          setState('error');
        }
      });
    return () => { cancelled = true; };
  }, []);

  const toggle = (day: string, slot: string) => {
    const key = slotKey(day, slot);
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const slots: AvailabilitySlot[] = [];
      for (const day of DAYS) {
        for (const slot of TIME_SLOTS) {
          if (selected.has(slotKey(day, slot))) {
            slots.push({ day, slot });
          }
        }
      }
      const res = await saveMyAvailability(slots);
      toast.success(res.message || `Availability saved (${res.data.length} slots).`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save availability.');
    } finally {
      setIsSaving(false);
    }
  };

  if (state === 'loading') return <LoadingState />;
  if (state === 'error') {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <CalendarClock className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">My Teaching Availability</h2>
        <span className="text-sm text-muted-foreground">— used to build the semester timetable</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="size-4 text-muted-foreground" />
            Select the days and hours you can teach
          </CardTitle>
          <CardDescription>
            The administrator generates the timetable using the courses assigned to you and these availability slots.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[140px_repeat(5,1fr)] border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-3 py-2 text-xs font-medium border-b border-r" />
                {DAYS.map(day => (
                  <div
                    key={day}
                    className="bg-muted/50 px-3 py-2 text-xs font-medium text-center border-b border-r last:border-r-0"
                  >
                    {day}
                  </div>
                ))}

                {TIME_SLOTS.map(slot => (
                  <div key={slot} className="contents">
                    <div className="px-3 py-2 text-xs text-muted-foreground font-mono border-b border-r flex items-center">
                      {slot}
                    </div>
                    {DAYS.map(day => {
                      const checked = selected.has(slotKey(day, slot));
                      return (
                        <label
                          key={`${day}-${slot}`}
                          className={`px-3 py-2 border-b border-r last:border-r-0 flex items-center justify-center cursor-pointer transition-colors ${
                            checked ? 'bg-primary/10' : 'hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggle(day, slot)}
                            aria-label={`${day} ${slot}`}
                          />
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-4">
            <p className="text-xs text-muted-foreground">
              {selected.size} slot{selected.size === 1 ? '' : 's'} selected
            </p>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save Availability
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
