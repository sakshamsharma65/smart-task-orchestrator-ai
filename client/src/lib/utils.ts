import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export { formatOrgDate, formatOrgDateTime, getOrgDateFormat, setOrgDateSettings } from "./dateUtils";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
