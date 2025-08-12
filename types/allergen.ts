export type AllergenType = 
  | 'gluten'
  | 'dairy'
  | 'eggs'
  | 'nuts'
  | 'peanuts'
  | 'shellfish'
  | 'fish'
  | 'soy'
  | 'wheat'
  | 'sulfites'
  | 'sesame'
  | 'celery'
  | 'mustard'
  | 'lupin'
  | 'molluscs'

export interface AllergenInfo {
  type: AllergenType
  severity: 'warning' | 'critical'
  displayName: string
  icon: string
  color: string
}

// Allergen configuration for UI display
export const ALLERGEN_CONFIG: Record<AllergenType, Omit<AllergenInfo, 'type'>> = {
  gluten: {
    severity: 'warning',
    displayName: 'Gluten',
    icon: 'mdi:wheat',
    color: 'yellow'
  },
  dairy: {
    severity: 'warning',
    displayName: 'Dairy',
    icon: 'mdi:cow',
    color: 'blue'
  },
  eggs: {
    severity: 'critical',
    displayName: 'Eggs',
    icon: 'mdi:egg',
    color: 'orange'
  },
  nuts: {
    severity: 'critical',
    displayName: 'Tree Nuts',
    icon: 'mdi:nut',
    color: 'brown'
  },
  peanuts: {
    severity: 'critical',
    displayName: 'Peanuts',
    icon: 'mdi:peanut',
    color: 'brown'
  },
  shellfish: {
    severity: 'critical',
    displayName: 'Shellfish',
    icon: 'mdi:shrimp',
    color: 'pink'
  },
  fish: {
    severity: 'critical',
    displayName: 'Fish',
    icon: 'mdi:fish',
    color: 'blue'
  },
  soy: {
    severity: 'warning',
    displayName: 'Soy',
    icon: 'mdi:soy',
    color: 'green'
  },
  wheat: {
    severity: 'warning',
    displayName: 'Wheat',
    icon: 'mdi:wheat',
    color: 'yellow'
  },
  sulfites: {
    severity: 'warning',
    displayName: 'Sulfites',
    icon: 'mdi:chemical-weapon',
    color: 'purple'
  },
  sesame: {
    severity: 'critical',
    displayName: 'Sesame',
    icon: 'mdi:seed',
    color: 'brown'
  },
  celery: {
    severity: 'warning',
    displayName: 'Celery',
    icon: 'mdi:food-variant',
    color: 'green'
  },
  mustard: {
    severity: 'warning',
    displayName: 'Mustard',
    icon: 'mdi:food-variant',
    color: 'yellow'
  },
  lupin: {
    severity: 'warning',
    displayName: 'Lupin',
    icon: 'mdi:flower',
    color: 'purple'
  },
  molluscs: {
    severity: 'critical',
    displayName: 'Molluscs',
    icon: 'mdi:snail',
    color: 'brown'
  }
}

// Helper function to get allergen info
export function getAllergenInfo(type: AllergenType): AllergenInfo {
  return {
    type,
    ...ALLERGEN_CONFIG[type]
  }
}

// Helper function to get all available allergens
export function getAvailableAllergens(): AllergenInfo[] {
  return Object.keys(ALLERGEN_CONFIG).map(key => getAllergenInfo(key as AllergenType))
}
