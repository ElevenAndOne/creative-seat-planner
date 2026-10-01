export const START = new Date(2026, 9, 5); // Mon 5 Oct 2026
export const WEEKS = 12;
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const parse = (s: string) => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, m! - 1, d);
};

/** "Tue 6 Oct", or "Unscheduled". */
export const fmt = (s: string) => {
  const d = parse(s);
  if (!d) return "Unscheduled";
  return `${DAYS[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

/** 1-based plan week, or null when outside the 12 weeks. */
export const weekOf = (s: string) => {
  const d = parse(s);
  if (!d) return null;
  const w = Math.floor((d.getTime() - START.getTime()) / 864e5 / 7) + 1;
  return w >= 1 && w <= WEEKS ? w : null;
};

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(d.getDate() + n);
  return x;
};

export const pad2 = (n: number) => String(n).padStart(2, "0");
export const shortFormat = (f: string) => f.split("·")[0]!.trim();
