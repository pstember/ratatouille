import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AllergenBadge from '~/components/AllergenBadge.vue'
import type { AllergenInfo } from '~/types/allergen'

describe('AllergenBadge', () => {
  const mockAllergen: AllergenInfo = {
    type: 'gluten',
    severity: 'warning',
    displayName: 'Gluten',
    icon: 'mdi:wheat',
    color: 'yellow'
  }

  it('renders allergen information correctly', () => {
    const wrapper = mount(AllergenBadge, {
      props: {
        allergen: mockAllergen
      }
    })

    expect(wrapper.text()).toContain('Gluten')
    expect(wrapper.find('.allergen-badge').exists()).toBe(true)
  })

  it('applies correct CSS classes for warning severity', () => {
    const wrapper = mount(AllergenBadge, {
      props: {
        allergen: mockAllergen
      }
    })

    expect(wrapper.classes()).toContain('allergen-badge--warning')
  })

  it('applies correct CSS classes for critical severity', () => {
    const criticalAllergen: AllergenInfo = {
      ...mockAllergen,
      severity: 'critical'
    }

    const wrapper = mount(AllergenBadge, {
      props: {
        allergen: criticalAllergen
      }
    })

    expect(wrapper.classes()).toContain('allergen-badge--critical')
  })

  it('applies correct variant classes', () => {
    const wrapper = mount(AllergenBadge, {
      props: {
        allergen: mockAllergen,
        variant: 'small'
      }
    })

    expect(wrapper.classes()).toContain('allergen-badge--small')
  })

  it('uses medium variant by default', () => {
    const wrapper = mount(AllergenBadge, {
      props: {
        allergen: mockAllergen
      }
    })

    expect(wrapper.classes()).toContain('allergen-badge--medium')
  })

  it('displays the allergen icon', () => {
    const wrapper = mount(AllergenBadge, {
      props: {
        allergen: mockAllergen
      }
    })

    const icon = wrapper.findComponent({ name: 'Icon' })
    expect(icon.exists()).toBe(true)
    // Since Icon is stubbed, we can't test the props directly
    // But we can verify the component is rendered
    expect(wrapper.find('.allergen-badge').exists()).toBe(true)
  })
})
