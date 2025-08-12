import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import QuotaGauge from '~/components/QuotaGauge.vue'
import type { QuotaInfo } from '~/types/recipe'
import { setupTestEnvironment, cleanupTestEnvironment } from '~/tests/setup/test-utils'

describe('QuotaGauge Component', () => {
  let pinia: any

  const mockQuotaInfo: QuotaInfo = {
    quotaUsed: 75,
    quotaLeft: 25,
    quotaRequest: 1,
    quotaLimit: 100,
    percentageUsed: 75,
    resetTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    dailyUsage: 75
  }

  beforeEach(() => {
    pinia = setupTestEnvironment()
    cleanupTestEnvironment()
  })

  it('renders when quota info is provided', () => {
    const wrapper = mount(QuotaGauge, {
      props: {
        quotaInfo: mockQuotaInfo
      },
      global: { plugins: [pinia] }
    })

    expect(wrapper.find('.quota-gauge').exists()).toBe(true)
    expect(wrapper.find('.gauge-svg').exists()).toBe(true)
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

  it('displays correct percentage', () => {
    const wrapper = mount(QuotaGauge, {
      props: {
        quotaInfo: mockQuotaInfo,
        disableAnimation: true
      },
      global: { plugins: [pinia] }
    })

    const percentageText = wrapper.find('.gauge-percentage')
    expect(percentageText.text()).toBe('75%')
  })

  it('displays correct quota numbers', () => {
    const wrapper = mount(QuotaGauge, {
      props: {
        quotaInfo: mockQuotaInfo,
        disableAnimation: true
      },
      global: { plugins: [pinia] }
    })

    const numbersText = wrapper.find('.gauge-numbers')
    expect(numbersText.text()).toBe('75/100')
  })

  it('shows warning indicator when usage is >= 70%', () => {
    const wrapper = mount(QuotaGauge, {
      props: {
        quotaInfo: mockQuotaInfo,
        disableAnimation: true
      },
      global: { plugins: [pinia] }
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
      },
      global: { plugins: [pinia] }
    })

    expect(wrapper.find('.warning-indicator').exists()).toBe(false)
  })

  it('applies correct color classes based on usage percentage', () => {
    // Test warning level (70-90%)
    const warningQuota: QuotaInfo = {
      ...mockQuotaInfo,
      quotaUsed: 80,
      percentageUsed: 80
    }

    const wrapper = mount(QuotaGauge, {
      props: {
        quotaInfo: warningQuota,
        disableAnimation: true
      },
      global: { plugins: [pinia] }
    })

    const progressCircle = wrapper.find('.gauge-progress')
    expect(progressCircle.classes()).toContain('text-yellow-500')
  })

  it('applies correct size classes', () => {
    const wrapper = mount(QuotaGauge, {
      props: {
        quotaInfo: mockQuotaInfo,
        size: 'lg',
        disableAnimation: true
      },
      global: { plugins: [pinia] }
    })

    const svg = wrapper.find('.gauge-svg')
    expect(svg.classes()).toContain('gauge-svg--lg')
  })

  it('shows tooltip on hover', async () => {
    const wrapper = mount(QuotaGauge, {
      props: {
        quotaInfo: mockQuotaInfo,
        disableAnimation: true
      },
      global: { plugins: [pinia] }
    })

    // Initially tooltip should be hidden
    expect(wrapper.find('.quota-tooltip').exists()).toBe(false)

    // Trigger mouseenter
    await wrapper.find('.gauge-container').trigger('mouseenter')
    
    // Tooltip should now be visible
    expect(wrapper.find('.quota-tooltip').exists()).toBe(true)
  })

  it('hides tooltip on mouse leave', async () => {
    const wrapper = mount(QuotaGauge, {
      props: {
        quotaInfo: mockQuotaInfo,
        disableAnimation: true
      },
      global: { plugins: [pinia] }
    })

    // Show tooltip
    await wrapper.find('.gauge-container').trigger('mouseenter')
    expect(wrapper.find('.quota-tooltip').exists()).toBe(true)

    // Hide tooltip
    await wrapper.find('.gauge-container').trigger('mouseleave')
    expect(wrapper.find('.quota-tooltip').exists()).toBe(false)
  })

  it('displays correct tooltip content', async () => {
    const wrapper = mount(QuotaGauge, {
      props: {
        quotaInfo: mockQuotaInfo,
        disableAnimation: true
      },
      global: { plugins: [pinia] }
    })

    await wrapper.find('.gauge-container').trigger('mouseenter')

    expect(wrapper.find('.tooltip-title').text()).toBe('API Quota Usage')
    expect(wrapper.find('.tooltip-status').text()).toBe('Warning')
    expect(wrapper.find('.tooltip-warning').exists()).toBe(true)
  })

  it('has correct ARIA label', () => {
    const wrapper = mount(QuotaGauge, {
      props: {
        quotaInfo: mockQuotaInfo,
        disableAnimation: true
      },
      global: { plugins: [pinia] }
    })

    const svg = wrapper.find('.gauge-svg')
    expect(svg.attributes('aria-label')).toBe('API quota usage: 75.0%')
  })
})
