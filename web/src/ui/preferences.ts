export interface Preferences {
  lowQuality: boolean;
  reducedMotion: boolean;
}
const key = 'beacon.preferences.v1';
export const readPreferences = (): Preferences => {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '{}') as Partial<Preferences>;
    return { lowQuality: value.lowQuality === true, reducedMotion: value.reducedMotion === true };
  } catch {
    return { lowQuality: false, reducedMotion: false };
  }
};
export const savePreferences = (value: Preferences) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Settings still work for this session. */
  }
};
export const readBest = (levelId: string): number | null => {
  try {
    const value = Number(localStorage.getItem(`beacon.best.v1.${levelId}`));
    return value > 0 && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
};
export const saveBest = (levelId: string, time: number): number => {
  const best = Math.min(readBest(levelId) ?? Infinity, time);
  try {
    localStorage.setItem(`beacon.best.v1.${levelId}`, String(best));
  } catch {
    /* Score remains visible in this session. */
  }
  return best;
};
export const formatTime = (time: number): string => {
  const seconds = Math.floor(time);
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
};
