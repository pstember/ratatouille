import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import NewBadge from '~/components/NewBadge.vue'
import { setupTestEnvironment } from '~/tests/setup/test-utils'

describe('NewBadge Component', () => {
  let pinia: any

  beforeEach(() => {
    pinia = setupTestEnvironment()
  })

  describe('Rendering', () => {
    it('renders NEW text correctly', () => {
      const wrapper = mount(NewBadge, {
        global: { plugins: [pinia] }
      })

      expect(wrapper.text()).toBe('NEW')
    })

    it('renders as a div element', () => {
      const wrapper = mount(NewBadge, {
        global: { plugins: [pinia] }
      })

      expect(wrapper.element.tagName).toBe('DIV')
    })
  })

  describe('Styling and Classes', () => {
    it('applies correct positioning classes', () => {
      const wrapper = mount(NewBadge, {
        global: { plugins: [pinia] }
      })

      expect(wrapper.classes()).toContain('absolute')
      expect(wrapper.classes()).toContain('top-2')
      expect(wrapper.classes()).toContain('left-2')
    })

    it('applies correct background and text classes', () => {
      const wrapper = mount(NewBadge, {
        global: { plugins: [pinia] }
      })

      expect(wrapper.classes()).toContain('bg-green-500')
      expect(wrapper.classes()).toContain('text-white')
      expect(wrapper.classes()).toContain('text-xs')
      expect(wrapper.classes()).toContain('font-semibold')
    })

    it('applies correct spacing and shape classes', () => {
      const wrapper = mount(NewBadge, {
        global: { plugins: [pinia] }
      })

      expect(wrapper.classes()).toContain('px-2')
      expect(wrapper.classes()).toContain('py-1')
      expect(wrapper.classes()).toContain('rounded-full')
      expect(wrapper.classes()).toContain('shadow-lg')
    })

    it('applies animation class', () => {
      const wrapper = mount(NewBadge, {
        global: { plugins: [pinia] }
      })

      expect(wrapper.classes()).toContain('animate-pulse')
    })
  })

  describe('Component Structure', () => {
    it('has no props', () => {
      const wrapper = mount(NewBadge, {
        global: { plugins: [pinia] }
      })

      expect(wrapper.props()).toEqual({})
    })

    it('is a simple component with no slots', () => {
      const wrapper = mount(NewBadge, {
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('slot').exists()).toBe(false)
    })
  })

  describe('Accessibility', () => {
    it('has semantic meaning through text content', () => {
      const wrapper = mount(NewBadge, {
        global: { plugins: [pinia] }
      })

      expect(wrapper.text()).toBe('NEW')
      expect(wrapper.text().length).toBeGreaterThan(0)
    })

    it('has sufficient color contrast with white text on green background', () => {
      const wrapper = mount(NewBadge, {
        global: { plugins: [pinia] }
      })

      expect(wrapper.classes()).toContain('text-white')
      expect(wrapper.classes()).toContain('bg-green-500')
    })
  })

  describe('Animation', () => {
    it('has pulse animation applied', () => {
      const wrapper = mount(NewBadge, {
        global: { plugins: [pinia] }
      })

      expect(wrapper.classes()).toContain('animate-pulse')
    })

    it('renders with animation styles', () => {
      const wrapper = mount(NewBadge, {
        global: { plugins: [pinia] }
      })

      // The component should have the animate-pulse class which applies CSS animation
      expect(wrapper.classes()).toContain('animate-pulse')
    })
  })

  describe('Edge Cases', () => {
    it('renders consistently without props', () => {
      const wrapper1 = mount(NewBadge, {
        global: { plugins: [pinia] }
      })
      
      const wrapper2 = mount(NewBadge, {
        global: { plugins: [pinia] }
      })

      expect(wrapper1.text()).toBe(wrapper2.text())
      expect(wrapper1.classes()).toEqual(wrapper2.classes())
    })

    it('handles multiple instances correctly', () => {
      const wrapper1 = mount(NewBadge, {
        global: { plugins: [pinia] }
      })
      
      const wrapper2 = mount(NewBadge, {
        global: { plugins: [pinia] }
      })

      expect(wrapper1.text()).toBe('NEW')
      expect(wrapper2.text()).toBe('NEW')
      expect(wrapper1.element).not.toBe(wrapper2.element)
    })
  })
})
