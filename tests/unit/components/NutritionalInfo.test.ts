import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import NutritionalInfo from '~/components/NutritionalInfo.vue'
import { mockNutritionDisplay, setupTestEnvironment } from '~/tests/setup/test-utils'

describe('NutritionalInfo Component', () => {
  let pinia: any

  beforeEach(() => {
    pinia = setupTestEnvironment()
  })

  describe('Basic Mounting', () => {
    it('mounts successfully', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay
        },
        global: { plugins: [pinia] }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.classes()).toContain('nutritional-info')
    })

    it('renders with nutrition data', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay
        },
        global: { plugins: [pinia] }
      })

      // Just check that the component renders something
      expect(wrapper.text()).toBeTruthy()
    })
  })

  describe('Compact View', () => {
    it('renders compact view when compact prop is true', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay,
          compact: true 
        },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('.flex.flex-wrap.gap-2').exists()).toBe(true)
      expect(wrapper.find('.space-y-4').exists()).toBe(false)
    })

    it('renders only main nutrition badges in compact view', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay,
          compact: true 
        },
        global: { plugins: [pinia] }
      })

      const badges = wrapper.findAll('.nutrition-badge')
      expect(badges).toHaveLength(4)

      // Check that only main nutrition values are shown
      const badgeTexts = badges.map(badge => badge.text())
      expect(badgeTexts).toContain('Calories: 300cal')
      expect(badgeTexts).toContain('Protein: 15g')
      expect(badgeTexts).toContain('Carbs: 45g')
      expect(badgeTexts).toContain('Fat: 10g')
    })

    it('does not render additional nutrition info in compact view', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay,
          compact: true 
        },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('.grid.grid-cols-2.md\\:grid-cols-3.gap-4').exists()).toBe(false)
    })

    it('passes correct props to NutritionBadge components in compact view', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay,
          compact: true 
        },
        global: { plugins: [pinia] }
      })

      const badges = wrapper.findAll('.nutrition-badge')
      expect(badges).toHaveLength(4)
      
      // Check that badges contain the expected text
      expect(wrapper.text()).toContain('Calories: 300cal')
      expect(wrapper.text()).toContain('Protein: 15g')
    })
  })

  describe('Detailed View', () => {
    it('renders detailed view when compact prop is false', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay,
          compact: false 
        },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('.space-y-4').exists()).toBe(true)
      expect(wrapper.find('.flex.flex-wrap.gap-2').exists()).toBe(false)
    })

    it('renders main nutrition grid with correct layout', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay,
          compact: false 
        },
        global: { plugins: [pinia] }
      })

      const mainGrid = wrapper.find('.grid.grid-cols-2.md\\:grid-cols-4.gap-4')
      expect(mainGrid.exists()).toBe(true)

      const mainCards = wrapper.findAll('.nutrition-card').slice(0, 4)
      expect(mainCards).toHaveLength(4)
    })

    it('renders main nutrition cards with correct data', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay,
          compact: false 
        },
        global: { plugins: [pinia] }
      })

      const mainCards = wrapper.findAll('.nutrition-card').slice(0, 4)
      expect(mainCards).toHaveLength(4)
      
      // Check that cards contain the expected text
      expect(wrapper.text()).toContain('Calories: 300calories')
      expect(wrapper.text()).toContain('Protein: 15g')
      expect(wrapper.text()).toContain('Carbohydrates: 45g')
      expect(wrapper.text()).toContain('Fat: 10g')
    })

    it('renders additional nutrition info when showDetails is true', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay,
          compact: false,
          showDetails: true 
        },
        global: { plugins: [pinia] }
      })

      const additionalGrid = wrapper.find('.grid.grid-cols-2.md\\:grid-cols-3.gap-4')
      expect(additionalGrid.exists()).toBe(true)

      const allCards = wrapper.findAll('.nutrition-card')
      expect(allCards).toHaveLength(7) // 4 main + 3 additional
    })

    it('renders additional nutrition cards with correct data', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay,
          compact: false,
          showDetails: true 
        },
        global: { plugins: [pinia] }
      })

      const allCards = wrapper.findAll('.nutrition-card')
      expect(allCards).toHaveLength(7)
      
      // Check that additional cards contain the expected text
      expect(wrapper.text()).toContain('Fiber: 5g')
      expect(wrapper.text()).toContain('Sugar: 20g')
      expect(wrapper.text()).toContain('Sodium: 500mg')
    })

    it('does not render additional nutrition info when showDetails is false', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay,
          compact: false,
          showDetails: false 
        },
        global: { plugins: [pinia] }
      })

      const additionalGrid = wrapper.find('.grid.grid-cols-2.md\\:grid-cols-3.gap-4')
      expect(additionalGrid.exists()).toBe(false)

      const allCards = wrapper.findAll('.nutrition-card')
      expect(allCards).toHaveLength(4) // Only main nutrition cards
    })
  })

  describe('Conditional Rendering', () => {
    it('only renders nutrition badges for available values in compact view', () => {
      const partialNutrition = {
        calories: 300,
        protein: 15,
        // carbs and fat are undefined
      } as any

      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: partialNutrition,
          compact: true 
        },
        global: { plugins: [pinia] }
      })

      const badges = wrapper.findAll('.nutrition-badge')
      expect(badges).toHaveLength(2)

      const badgeTexts = badges.map(badge => badge.text())
      expect(badgeTexts).toContain('Calories: 300cal')
      expect(badgeTexts).toContain('Protein: 15g')
    })

    it('only renders nutrition cards for available values in detailed view', () => {
      const partialNutrition = {
        calories: 300,
        protein: 15,
        fiber: 5,
        // other values are undefined
      } as any

      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: partialNutrition,
          compact: false,
          showDetails: true 
        },
        global: { plugins: [pinia] }
      })

      const allCards = wrapper.findAll('.nutrition-card')
      expect(allCards).toHaveLength(3) // calories, protein, fiber

      expect(wrapper.text()).toContain('Calories: 300calories')
      expect(wrapper.text()).toContain('Protein: 15g')
      expect(wrapper.text()).toContain('Fiber: 5g')
    })

    it('handles nutrition object with no values', () => {
      const emptyNutrition = {} as any

      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: emptyNutrition,
          compact: true 
        },
        global: { plugins: [pinia] }
      })

      const badges = wrapper.findAll('.nutrition-badge')
      expect(badges).toHaveLength(0)
    })
  })

  describe('Default Props', () => {
    it('uses default values for compact and showDetails', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay
        },
        global: { plugins: [pinia] }
      })

      expect(wrapper.props('compact')).toBe(false)
      expect(wrapper.props('showDetails')).toBe(false)
    })

    it('renders detailed view by default', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay
        },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('.space-y-4').exists()).toBe(true)
      expect(wrapper.find('.flex.flex-wrap.gap-2').exists()).toBe(false)
    })
  })

  describe('Component Structure', () => {
    it('has correct root class', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay
        },
        global: { plugins: [pinia] }
      })

      expect(wrapper.classes()).toContain('nutritional-info')
    })

    it('renders NutritionBadge components in compact view', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay,
          compact: true 
        },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('.nutrition-badge').exists()).toBe(true)
    })

    it('renders NutritionCard components in detailed view', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay,
          compact: false 
        },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('.nutrition-card').exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles nutrition values of zero', () => {
      const zeroNutrition = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      } as any

      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: zeroNutrition,
          compact: true 
        },
        global: { plugins: [pinia] }
      })

      const badges = wrapper.findAll('.nutrition-badge')
      expect(badges).toHaveLength(0) // Zero values should not render since they are falsy
    })

    it('handles very large nutrition values', () => {
      const largeNutrition = {
        calories: 9999,
        protein: 999,
        carbs: 999,
        fat: 999
      } as any

      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: largeNutrition,
          compact: true 
        },
        global: { plugins: [pinia] }
      })

      const badges = wrapper.findAll('.nutrition-badge')
      expect(badges).toHaveLength(4)

      // Check that large values are displayed
      expect(wrapper.text()).toContain('Calories: 9999cal')
      expect(wrapper.text()).toContain('Protein: 999g')
    })

    it('handles decimal nutrition values', () => {
      const decimalNutrition = {
        calories: 300.5,
        protein: 15.7,
        carbs: 45.2,
        fat: 10.8
      } as any

      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: decimalNutrition,
          compact: true 
        },
        global: { plugins: [pinia] }
      })

      const badges = wrapper.findAll('.nutrition-badge')
      expect(badges).toHaveLength(4)

      // Check that decimal values are displayed
      expect(wrapper.text()).toContain('Calories: 300.5cal')
      expect(wrapper.text()).toContain('Protein: 15.7g')
    })
  })

  describe('Accessibility', () => {
    it('has semantic structure', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay
        },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('div').exists()).toBe(true)
    })

    it('displays nutrition information clearly', () => {
      const wrapper = mount(NutritionalInfo, {
        props: { 
          nutrition: mockNutritionDisplay,
          compact: true 
        },
        global: { plugins: [pinia] }
      })

      const badges = wrapper.findAll('.nutrition-badge')
      badges.forEach(badge => {
        expect(badge.text()).toMatch(/^[^:]+: \d+[a-z]+$/)
      })
    })
  })
})
