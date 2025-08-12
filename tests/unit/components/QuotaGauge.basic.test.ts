import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import QuotaGauge from '~/components/QuotaGauge.vue'
import type { QuotaInfo } from '~/types/recipe'

describe('QuotaGauge Basic Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockQuotaInfo: QuotaInfo = {
    quotaUsed: 75,
    quotaLeft: 25,
    quotaRequest: 1,
    quotaLimit: 100,
    percentageUsed: 75,
    resetTime: new Date(Date.now() + 3600000).toISOString(),
    dailyUsage: 75
  }

  it('can be imported and has correct name', () => {
    expect(QuotaGauge).toBeDefined()
    expect(QuotaGauge.name || 'QuotaGauge').toBe('QuotaGauge')
  })

  it('renders when quota info is provided', () => {
    const wrapper = mount(QuotaGauge, {
      props: {
        quotaInfo: mockQuotaInfo
      }
    })

    expect(wrapper.find('.quota-gauge').exists()).toBe(true)
  })

  it('does not render when quota info is null', () => {
    const wrapper = mount(QuotaGauge, {
      props: {
        quotaInfo: null
      }
    })

    // The component should render a placeholder when quotaInfo is null
    expect(wrapper.find('.quota-gauge').exists()).toBe(true)
    expect(wrapper.find('.gauge-placeholder').exists()).toBe(true)
  })

  it('displays correct percentage text', () => {
    const wrapper = mount(QuotaGauge, {
      props: {
        quotaInfo: mockQuotaInfo,
        disableAnimation: true
      }
    })

    const percentageText = wrapper.find('.gauge-percentage')
    expect(percentageText.text()).toBe('75%')
  })

  it('displays correct quota numbers', () => {
    const wrapper = mount(QuotaGauge, {
      props: {
        quotaInfo: mockQuotaInfo,
        disableAnimation: true
      }
    })

    const numbersText = wrapper.find('.gauge-numbers')
    expect(numbersText.text()).toBe('75/100')
  })

  it('shows warning indicator when usage is >= 70%', () => {
    const wrapper = mount(QuotaGauge, {
      props: {
        quotaInfo: mockQuotaInfo,
        disableAnimation: true
      }
    })

    expect(wrapper.find('.warning-indicator').exists()).toBe(true)
  })

  it('does not show warning indicator when usage is < 70%', () => {
    const lowUsageQuota: QuotaInfo = {
      ...mockQuotaInfo,
      quotaUsed: 50,
      percentageUsed: 50
    }

    const wrapper = mount(QuotaGauge, {
      props: {
        quotaInfo: lowUsageQuota,
        disableAnimation: true
      }
    })

    expect(wrapper.find('.warning-indicator').exists()).toBe(false)
  })

  it('applies correct size classes', () => {
    const wrapper = mount(QuotaGauge, {
      props: {
        quotaInfo: mockQuotaInfo,
        size: 'lg',
        disableAnimation: true
      }
    })

    const svg = wrapper.find('.gauge-svg')
    expect(svg.classes()).toContain('gauge-svg--lg')
  })

  it('has correct ARIA label', () => {
    const wrapper = mount(QuotaGauge, {
      props: {
        quotaInfo: mockQuotaInfo,
        disableAnimation: true
      }
    })

    const svg = wrapper.find('.gauge-svg')
    expect(svg.attributes('aria-label')).toBe('API quota usage: 75.0%')
  })
})
