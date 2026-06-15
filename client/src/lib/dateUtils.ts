import { format } from "date-fns";

const DEFAULT_DATE_FORMAT = "MM/dd/yyyy";
const DEFAULT_TIME_ZONE = "UTC";
const ORG_SETTINGS_STORAGE_KEY = "organization_settings";

type OrganizationDateSettings = {
  date_format?: string;
  time_zone?: string;
};

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function parseDateInput(date: string | Date): Date {
  if (date instanceof Date) {
    return date;
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(date);
}

export function setOrgDateSettings(settings: OrganizationDateSettings | null | undefined) {
  if (!isBrowser() || !settings) return;

  try {
    localStorage.setItem(
      ORG_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        date_format: settings.date_format || DEFAULT_DATE_FORMAT,
        time_zone: settings.time_zone || DEFAULT_TIME_ZONE,
      }),
    );
  } catch (error) {
    console.warn("Error saving organization settings:", error);
  }
}

export function getOrgDateFormat(): string {
  if (!isBrowser()) return DEFAULT_DATE_FORMAT;

  try {
    const settings = localStorage.getItem(ORG_SETTINGS_STORAGE_KEY);
    if (!settings) return DEFAULT_DATE_FORMAT;

    const parsed = JSON.parse(settings);
    return parsed.date_format || DEFAULT_DATE_FORMAT;
  } catch (error) {
    console.warn("Error reading organization settings:", error);
    return DEFAULT_DATE_FORMAT;
  }
}

export function formatOrgDate(date: string | Date | null | undefined, fallback = "No date"): string {
  if (!date) return fallback;

  try {
    const dateObj = parseDateInput(date);
    if (isNaN(dateObj.getTime())) return "Invalid date";

    return format(dateObj, getOrgDateFormat());
  } catch (error) {
    console.warn("Error formatting date:", error);
    return "Invalid date";
  }
}

export function formatOrgDateTime(date: string | Date | null | undefined, fallback = "No date"): string {
  if (!date) return fallback;

  try {
    const dateObj = parseDateInput(date);
    if (isNaN(dateObj.getTime())) return "Invalid date";

    return `${formatOrgDate(dateObj, fallback)} ${format(dateObj, "h:mm a")}`;
  } catch (error) {
    console.warn("Error formatting date time:", error);
    return "Invalid date";
  }
}
