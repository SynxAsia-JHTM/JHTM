export function formatEventDateLong(isoDate: string, locale = 'en-US') {
  const parsed = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsed);
}

export function formatEventDateShort(isoDate: string, locale = 'en-US') {
  const parsed = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(parsed);
}

export function formatEventTime(hhmm: string, locale = 'en-US') {
  const [h, m] = hhmm.split(':');
  const d = new Date();
  d.setHours(Number(h), Number(m || 0), 0, 0);
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(d);
}

export function formatDashboardDateTime(isoDate: string, hhmm: string, locale = 'en-US') {
  return `${formatEventDateShort(isoDate, locale)} \u2022 ${formatEventTime(hhmm, locale)}`;
}
