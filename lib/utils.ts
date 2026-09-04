import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Flattens a stack name for comparison: "Front-End", "front end" and "frontend"
 * all collapse to "frontend".
 *
 * `stack` is a free-form string on the backend with no enum behind it, so the
 * stored values drift. Every stack filter in the app compares through this.
 */
export function normalizeStack(stack: string) {
  return stack.toLowerCase().replace(/[-\s]/g, "")
}
