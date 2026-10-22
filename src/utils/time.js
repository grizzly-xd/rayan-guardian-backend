export const nowIso = () => new Date().toISOString();

export function minutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function isExpired(isoString) {
  return new Date(isoString).getTime() < Date.now();
}

export function secondsAgo(seconds) {
  return new Date(Date.now() - seconds * 1000).toISOString();
}
