// A bag's name is stored as one string: "שם בעברית | English Name".
// The English part is optional. Every read and write of that convention goes
// through these helpers so the separator lives in exactly one place.
const SEPARATOR = " | ";

export function getHebrewName(name: string): string {
  return name.split(SEPARATOR)[0]?.trim() || name;
}

export function getEnglishName(name: string): string | undefined {
  return name.split(SEPARATOR)[1]?.trim() || undefined;
}

export function composeName(hebrew: string, english?: string): string {
  const he = hebrew.trim();
  const en = english?.trim();
  return en ? `${he}${SEPARATOR}${en}` : he;
}
