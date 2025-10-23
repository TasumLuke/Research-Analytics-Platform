// merge css classes without conflicts - handles tailwind properly
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function mergeCss(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// alias for compatibility
export { mergeCss as cn };
