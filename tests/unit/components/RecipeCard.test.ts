import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RecipeCard from '~/components/RecipeCard.vue'
import { mockRecipe, setupTestEnvironment, cleanupTestEnvironment } from '~/tests/setup/test-utils'

// Mock Nuxt composables
vi.mock('#imports', () => ({
  navigateTo: vi.fn()
}))

// Mock child components
vi.mock('~/components/NewBadge.vue', () => ({
  default: {
    name: 'NewBadge',
    template: '<div class="new-badge">NEW</div>',
    props: ['recipe']
  }
}))

vi.mock('~/components/CuisineBadge.vue', () => ({
  default: {
    name: 'CuisineBadge',
    template: '<div class="cuisine-badge">{{ cuisine }}</div>',
    props: ['cuisine']
  }
}))

vi.mock('~/components/NutritionalInfo.vue', () => ({
  default: {
    name: 'NutritionalInfo',
    template: '<div class="nutritional-info">Nutrition Info</div>',
    props: ['nutrition', 'compact']
  }
}))

describe('RecipeCard Component', () => {
  let pinia: any

  beforeEach(() => {
    pinia = setupTestEnvironment()
    cleanupTestEnvironment()
  })

  describe('Rendering', () => {
    it('renders recipe title correctly', () => {
      const wrapper = mount(RecipeCard, {
        props: { recipe: mockRecipe },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('h3').text()).toBe(mockRecipe.title)
    })

    it('renders recipe image when available', () => {
      const wrapper = mount(RecipeCard, {
        props: { recipe: mockRecipe },
        global: { plugins: [pinia] }
      })

      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe(mockRecipe.image)
      expect(img.attributes('alt')).toBe(mockRecipe.title)
    })

    it('renders placeholder when no image is available', () => {
      const recipeWithoutImage = { ...mockRecipe, image: undefined }
      const wrapper = mount(RecipeCard, {
        props: { recipe: recipeWithoutImage },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('renders cooking time badge when available', () => {
      const wrapper = mount(RecipeCard, {
        props: { recipe: mockRecipe },
        global: { plugins: [pinia] }
      })

      const timeBadge = wrapper.find('.bg-black.bg-opacity-75')
      expect(timeBadge.exists()).toBe(true)
      expect(timeBadge.text()).toContain(`${mockRecipe.readyInMinutes}m`)
    })

    it('renders servings badge when available', () => {
      const wrapper = mount(RecipeCard, {
        props: { recipe: mockRecipe },
        global: { plugins: [pinia] }
      })

      const servingsBadge = wrapper.find('.bg-black.bg-opacity-75:last-child')
      expect(servingsBadge.exists()).toBe(true)
      expect(servingsBadge.text()).toContain(`${mockRecipe.servings} servings`)
    })

    it('renders source name when available', () => {
      const recipeWithSource = { ...mockRecipe, sourceName: 'Test Source' }
      const wrapper = mount(RecipeCard, {
        props: { recipe: recipeWithSource },
        global: { plugins: [pinia] }
      })

      expect(wrapper.text()).toContain('From Test Source')
    })

    it('does not render source info when not available', () => {
      const wrapper = mount(RecipeCard, {
        props: { recipe: mockRecipe },
        global: { plugins: [pinia] }
      })

      expect(wrapper.text()).not.toContain('From')
    })

    it('renders nutritional information when available', () => {
      const wrapper = mount(RecipeCard, {
        props: { recipe: mockRecipe },
        global: { plugins: [pinia] }
      })

      // Check if NutritionalInfo component is rendered
      expect(wrapper.find('.nutritional-info').exists()).toBe(true)
    })

    it('does not render nutritional information when not available', () => {
      const recipeWithoutNutrition = { ...mockRecipe, nutrition: undefined }
      const wrapper = mount(RecipeCard, {
        props: { recipe: recipeWithoutNutrition },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('.nutritional-info').exists()).toBe(false)
    })
  })

  describe('New Badge', () => {
    it('renders new badge when recipe is marked as new', () => {
      const newRecipe = { ...mockRecipe, isNew: true }
      const wrapper = mount(RecipeCard, {
        props: { recipe: newRecipe },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('.new-badge').exists()).toBe(true)
    })

    it('does not render new badge when recipe is not new', () => {
      const wrapper = mount(RecipeCard, {
        props: { recipe: mockRecipe },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('.new-badge').exists()).toBe(false)
    })
  })

  describe('Cuisine Badge', () => {
    it('renders cuisine badge when cuisine is available', () => {
      const recipeWithCuisine = { ...mockRecipe, cuisine: 'italian' }
      const wrapper = mount(RecipeCard, {
        props: { recipe: recipeWithCuisine },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('.cuisine-badge').exists()).toBe(true)
      expect(wrapper.find('.cuisine-badge').text()).toBe('italian')
    })

    it('does not render cuisine badge when cuisine is not available', () => {
      const { cuisine, ...recipeWithoutCuisine } = mockRecipe
      
      const wrapper = mount(RecipeCard, {
        props: { recipe: recipeWithoutCuisine },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('.cuisine-badge').exists()).toBe(false)
    })

    it('does not render cuisine badge when cuisine is empty string', () => {
      const recipeWithEmptyCuisine = { ...mockRecipe, cuisine: '' }
      const wrapper = mount(RecipeCard, {
        props: { recipe: recipeWithEmptyCuisine },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('.cuisine-badge').exists()).toBe(false)
    })

    it('does not render cuisine badge when cuisine is null', () => {
      const recipeWithNullCuisine = { ...mockRecipe, cuisine: undefined }
      const wrapper = mount(RecipeCard, {
        props: { recipe: recipeWithNullCuisine },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('.cuisine-badge').exists()).toBe(false)
    })
  })

  describe('Interactive Elements', () => {
    it('renders view recipe button', () => {
      const wrapper = mount(RecipeCard, {
        props: { recipe: mockRecipe },
        global: { plugins: [pinia] }
      })

      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe('View Recipe')
    })

    it('renders arrow icon', () => {
      const wrapper = mount(RecipeCard, {
        props: { recipe: mockRecipe },
        global: { plugins: [pinia] }
      })

      const arrow = wrapper.find('svg')
      expect(arrow.exists()).toBe(true)
    })
  })

  describe('Styling and Classes', () => {
    it('applies correct base classes', () => {
      const wrapper = mount(RecipeCard, {
        props: { recipe: mockRecipe },
        global: { plugins: [pinia] }
      })

      expect(wrapper.classes()).toContain('recipe-card')
      expect(wrapper.classes()).toContain('group')
    })

    it('applies hover effects to title', () => {
      const wrapper = mount(RecipeCard, {
        props: { recipe: mockRecipe },
        global: { plugins: [pinia] }
      })

      const title = wrapper.find('h3')
      expect(title.classes()).toContain('group-hover:text-orange-600')
      expect(title.classes()).toContain('transition-colors')
    })

    it('applies hover effects to button', () => {
      const wrapper = mount(RecipeCard, {
        props: { recipe: mockRecipe },
        global: { plugins: [pinia] }
      })

      const button = wrapper.find('button')
      expect(button.classes()).toContain('hover:text-orange-700')
      expect(button.classes()).toContain('transition-colors')
    })
  })

  describe('Edge Cases', () => {
    it('handles recipe with minimal data', () => {
      const minimalRecipe = {
        id: 1,
        title: 'Minimal Recipe',
        isNew: false
      }
      
      const wrapper = mount(RecipeCard, {
        props: { recipe: minimalRecipe },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('h3').text()).toBe('Minimal Recipe')
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.find('.bg-black.bg-opacity-75').exists()).toBe(false)
    })

    it('handles recipe with very long title', () => {
      const longTitleRecipe = {
        ...mockRecipe,
        title: 'This is a very long recipe title that should be truncated to prevent layout issues and maintain consistent card heights across the grid'
      }
      
      const wrapper = mount(RecipeCard, {
        props: { recipe: longTitleRecipe },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('h3').classes()).toContain('line-clamp-2')
    })

    it('handles recipe with zero values', () => {
      const zeroRecipe = {
        ...mockRecipe,
        readyInMinutes: 0,
        servings: 0
      }
      
      const wrapper = mount(RecipeCard, {
        props: { recipe: zeroRecipe },
        global: { plugins: [pinia] }
      })

      // Should still render badges even with zero values
      expect(wrapper.find('.bg-black.bg-opacity-75').exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('has proper alt text for images', () => {
      const wrapper = mount(RecipeCard, {
        props: { recipe: mockRecipe },
        global: { plugins: [pinia] }
      })

      const img = wrapper.find('img')
      expect(img.attributes('alt')).toBe(mockRecipe.title)
    })

    it('has semantic HTML structure', () => {
      const wrapper = mount(RecipeCard, {
        props: { recipe: mockRecipe },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('h3').exists()).toBe(true)
      expect(wrapper.find('button').exists()).toBe(true)
    })
  })
})
