import { Calendar, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/states';
import type { LecturerTimetable, TimetableSlot } from '@/types';

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

function getTypeStyle(type: string) {
  switch (type) {
    case 'lecture':
      return 'bg-primary/10 border-primary/30 text-primary';
    case 'lab':
      return 'bg-secondary/10 border-secondary/30 text-secondary';
    case 'tutorial':
      return 'bg-warning/10 border-warning/30 text-warning';
    default:
      return 'bg-muted border-border text-muted-foreground';
  }
}

function getTypeBadgeVariant(type: string): 'default' | 'secondary' | 'outline' {
  switch (type) {
    case 'lecture': return 'default';
    case 'lab': return 'secondary';
    case 'tutorial': return 'outline';
    default: return 'outline';
  }
}

export function WeeklyTimetable({
  timetable,
  title = 'Weekly Timetable',
  description = 'Your schedule for the current semester',
}: {
  timetable: LecturerTimetable[];
  title?: string;
  description?: string;
}) {
  const totalSlots = timetable.reduce((acc, day) => acc + day.slots.length, 0);

  const timetableMap = new Map<string, Map<string, TimetableSlot>>();
  for (const day of timetable) {
    const slotMap = new Map<string, TimetableSlot>();
    for (const slot of day.slots) {
      slotMap.set(slot.time, slot);
    }
    timetableMap.set(day.day, slotMap);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-5 text-primary" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {totalSlots === 0 ? (
          <EmptyState
            icon={<Calendar className="size-12 text-muted-foreground" />}
            title="No Timetable Yet"
            description="The timetable has not been generated for this semester yet."
          />
        ) : (
          <>
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-sm bg-primary/20 border border-primary/30" />
                <span>Lecture</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-sm bg-secondary/20 border border-secondary/30" />
                <span>Lab</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-sm bg-warning/20 border border-warning/30" />
                <span>Tutorial</span>
              </div>
            </div>

            {/* Desktop Grid */}
            <div className="hidden lg:block overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-[100px_repeat(5,1fr)] border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-3 py-2 text-xs font-medium border-b border-r" />
                  {DAYS.map(day => (
                    <div
                      key={day}
                      className="bg-muted/50 px-3 py-2 text-xs font-medium text-center border-b border-r last:border-r-0"
                    >
                      {day}
                    </div>
                  ))}

                  {TIME_SLOTS.map(time => (
                    <div key={time} className="contents">
                      <div className="px-3 py-2 text-xs text-muted-foreground font-mono border-b border-r flex items-center">
                        {time}
                      </div>
                      {DAYS.map(day => {
                        const slot = timetableMap.get(day)?.get(time);
                        return (
                          <div
                            key={`${day}-${time}`}
                            className="px-2 py-2 border-b border-r last:border-r-0 min-h-[56px]"
                          >
                            {slot && (
                              <div className={`rounded-md border p-2 ${getTypeStyle(slot.type)}`}>
                                <p className="font-semibold text-xs">{slot.courseCode}</p>
                                <p className="text-[10px] opacity-80 leading-tight">{slot.courseName}</p>
                                {slot.lecturerName && (
                                  <p className="text-[10px] opacity-70 leading-tight truncate">{slot.lecturerName}</p>
                                )}
                                {slot.room && (
                                  <div className="flex items-center gap-1 mt-1 text-[10px] opacity-70">
                                    <MapPin className="size-2.5" />
                                    {slot.room}
                                  </div>
                                )}
                                <Badge
                                  variant={getTypeBadgeVariant(slot.type)}
                                  className="mt-1 text-[9px] px-1.5 py-0"
                                >
                                  {slot.type}
                                </Badge>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile: Day-by-day cards */}
            <div className="space-y-4 lg:hidden">
              {DAYS.map(day => {
                const dayData = timetable.find(t => t.day === day);
                if (!dayData || dayData.slots.length === 0) return null;
                return (
                  <div key={day} className="rounded-lg border">
                    <div className="px-4 py-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-primary" />
                        <p className="font-semibold text-sm">{day}</p>
                      </div>
                      <div className="space-y-2">
                        {dayData.slots.map((slot, i) => (
                          <div key={i} className={`rounded-md border p-3 ${getTypeStyle(slot.type)}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-xs">{slot.courseCode}</p>
                                  <Badge variant={getTypeBadgeVariant(slot.type)} className="text-[9px] px-1.5 py-0">
                                    {slot.type}
                                  </Badge>
                                </div>
                                <p className="text-xs opacity-80">{slot.courseName}</p>
                                {slot.lecturerName && (
                                  <p className="text-[10px] opacity-70">{slot.lecturerName}</p>
                                )}
                              </div>
                              <span className="text-[10px] font-mono opacity-70 shrink-0">{slot.time}</span>
                            </div>
                            {slot.room && (
                              <div className="flex items-center gap-1 mt-1.5 text-[10px] opacity-70">
                                <MapPin className="size-2.5" />
                                {slot.room}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
