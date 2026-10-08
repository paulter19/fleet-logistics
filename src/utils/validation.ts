export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function required(value: string, label: string): string | null {
  if (!value.trim()) return `${label} is required.`
  return null
}

export function minLength(value: string, length: number, label: string): string | null {
  if (value.trim().length < length) return `${label} must be at least ${length} characters.`
  return null
}

export function positiveNumber(value: string, label: string): string | null {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return `${label} must be a valid number.`
  return null
}

export function firstError(errors: Array<string | null>): string | null {
  return errors.find((error) => error !== null) ?? null
}
