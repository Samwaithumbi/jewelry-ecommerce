/**
 * Dashboard utility functions for data formatting and calculations
 */

/**
 * Converts cents to formatted currency string
 * @param cents - Amount in cents
 * @returns Formatted currency string (e.g., "KSh 8,420", "KSh 0.03")
 */
export function formatCurrency(cents: number): string {
  const amount = cents / 100
  return `KSh ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Formats a date to short month name
 * @param date - Date object
 * @returns Short month name (e.g., "Jan", "Feb")
 */
export function formatMonth(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' })
}

/**
 * Calculates percentage change between two numbers
 * @param current - Current value
 * @param previous - Previous value
 * @returns Percentage change (e.g., 47 for 47% increase)
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

/**
 * Capitalizes first letter of string
 * @param str - Input string
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Maps database category to display name
 * @param category - Database category (e.g., "ring", "necklace")
 * @returns Display name (e.g., "Rings", "Necklaces")
 */
export function mapCategoryToDisplay(category: string): string {
  const mapping: Record<string, string> = {
    ring: 'Rings',
    necklace: 'Necklaces',
    bracelet: 'Bracelets',
    earring: 'Earrings',
    pendant: 'Pendants',
    bangle: 'Bangles',
    set: 'Sets',
  }
  return mapping[category.toLowerCase()] || capitalize(category)
}

/**
 * Gets color for category in charts
 * @param index - Category index
 * @returns Hex color code
 */
export function getCategoryColor(index: number): string {
  const colors = ['#B8860B', '#1A1A2E', '#C9A96E', '#8C8C8C', '#A0826D', '#D4AF37', '#6B5B3F']
  return colors[index % colors.length]
}
