export interface Nutrition {
  id: number
  recipeId: number
  calories?: number
  protein?: number
  fat?: number
  carbs?: number
  fiber?: number
  sugar?: number
  sodium?: number
  createdAt: string
  updatedAt: string
}

export interface NutritionDisplay {
  calories?: number
  protein?: number
  fat?: number
  carbs?: number
  fiber?: number
  sugar?: number
  sodium?: number
}

export interface NutritionBadge {
  label: string
  value: number
  unit: string
  color: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange'
  icon?: string
}

export interface DailyValue {
  calories: number
  protein: number
  fat: number
  carbs: number
  fiber: number
  sugar: number
  sodium: number
}

export const DAILY_VALUES: DailyValue = {
  calories: 2000,
  protein: 50,
  fat: 65,
  carbs: 300,
  fiber: 25,
  sugar: 50,
  sodium: 2300
}

export function calculateDailyValuePercentage(value: number, dailyValue: number): number {
  return Math.round((value / dailyValue) * 100)
}

export function formatNutritionValue(value: number, unit: string): string {
  if (value === 0) return `0 ${unit}`
  if (value < 1) return `${value.toFixed(1)} ${unit}`
  return `${Math.round(value)} ${unit}`
}

export function getNutritionColor(type: keyof NutritionDisplay): string {
  const colors = {
    calories: 'red',
    protein: 'blue',
    fat: 'yellow',
    carbs: 'green',
    fiber: 'purple',
    sugar: 'orange',
    sodium: 'gray'
  }
  return colors[type] || 'gray'
}
