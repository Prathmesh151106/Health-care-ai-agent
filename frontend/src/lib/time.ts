/**
 * lib/time.ts
 * Timezone utilities and formatting helpers.
 */

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function formatDateTime(isoString: string, timezone = getUserTimezone()): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatTime(timeOfDay: string): string {
  try {
    const [hh, mm] = timeOfDay.split(':').map(Number);
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return timeOfDay;
  }
}

export function getTodayDateString(timezone = getUserTimezone()): string {
  try {
    const d = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(d);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}
