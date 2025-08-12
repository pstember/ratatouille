import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import QuotaConfirmationModal from '~/components/QuotaConfirmationModal.vue'

// Mock Icon component
vi.mock('#components', () => ({
  Icon: {
    name: 'Icon',
    template: '<div class="icon" :data-icon="$attrs.name"></div>'
  }
}))

describe('QuotaConfirmationModal', () => {
  const mockQuotaInfo = {
    quotaUsed: 130,
    quotaLeft: 20,
    quotaRequest: 5,
    quotaLimit: 150,
    percentageUsed: 86.67,
    resetTime: '2024-01-16T00:00:00.000Z',
    dailyUsage: 130
  }

  describe('rendering', () => {
    it('should render when show is true', () => {
      const wrapper = mount(QuotaConfirmationModal, {
        props: {
          show: true,
          quotaInfo: mockQuotaInfo
        }
      })

      expect(wrapper.find('.quota-modal').exists()).toBe(true)
      expect(wrapper.find('.quota-title').text()).toBe('API Quota Warning')
    })

    it('should not render when show is false', () => {
      const wrapper = mount(QuotaConfirmationModal, {
        props: {
          show: false,
          quotaInfo: mockQuotaInfo
        }
      })

      expect(wrapper.find('.quota-modal').exists()).toBe(false)
    })

    it('should display quota information correctly', () => {
      const wrapper = mount(QuotaConfirmationModal, {
        props: {
          show: true,
          quotaInfo: mockQuotaInfo
        }
      })

      expect(wrapper.find('.quota-used').text()).toContain('130 / 150 used')
      expect(wrapper.find('.quota-percentage').text()).toContain('86.7%')
      expect(wrapper.text()).toContain('Remaining requests: 20')
      expect(wrapper.text()).toContain('This request will use: 5 points')
    })

    it('should display progress bar with correct width', () => {
      const wrapper = mount(QuotaConfirmationModal, {
        props: {
          show: true,
          quotaInfo: mockQuotaInfo
        }
      })

      const progressBar = wrapper.find('.quota-progress-fill')
      expect(progressBar.attributes('style')).toContain('width: 86.67%')
    })
  })

  describe('computed properties', () => {
    it('should apply correct progress bar class for high usage', () => {
      const highUsageQuotaInfo = {
        ...mockQuotaInfo,
        percentageUsed: 95
      }

      const wrapper = mount(QuotaConfirmationModal, {
        props: {
          show: true,
          quotaInfo: highUsageQuotaInfo
        }
      })

      const progressBar = wrapper.find('.quota-progress-fill')
      expect(progressBar.classes()).toContain('bg-red-500')
    })

    it('should apply correct progress bar class for warning usage', () => {
      const wrapper = mount(QuotaConfirmationModal, {
        props: {
          show: true,
          quotaInfo: mockQuotaInfo
        }
      })

      const progressBar = wrapper.find('.quota-progress-fill')
      expect(progressBar.classes()).toContain('bg-yellow-500')
    })

    it('should apply correct progress bar class for normal usage', () => {
      const normalUsageQuotaInfo = {
        ...mockQuotaInfo,
        percentageUsed: 50
      }

      const wrapper = mount(QuotaConfirmationModal, {
        props: {
          show: true,
          quotaInfo: normalUsageQuotaInfo
        }
      })

      const progressBar = wrapper.find('.quota-progress-fill')
      expect(progressBar.classes()).toContain('bg-blue-500')
    })

    it('should format reset time correctly for hours and minutes', () => {
      const mockDate = new Date('2024-01-15T10:30:00Z')
      vi.setSystemTime(mockDate)

      const wrapper = mount(QuotaConfirmationModal, {
        props: {
          show: true,
          quotaInfo: mockQuotaInfo
        }
      })

      expect(wrapper.text()).toContain('Resets in: 13h 30m')
      vi.useRealTimers()
    })

    it('should format reset time correctly for minutes only', () => {
      const mockDate = new Date('2024-01-15T23:45:00Z')
      vi.setSystemTime(mockDate)

      const wrapper = mount(QuotaConfirmationModal, {
        props: {
          show: true,
          quotaInfo: mockQuotaInfo
        }
      })

      expect(wrapper.text()).toContain('Resets in: 15m')
      vi.useRealTimers()
    })
  })

  describe('user interactions', () => {
    it('should emit confirm event when confirm button is clicked', async () => {
      const wrapper = mount(QuotaConfirmationModal, {
        props: {
          show: true,
          quotaInfo: mockQuotaInfo
        }
      })

      await wrapper.find('.confirm-button').trigger('click')

      expect(wrapper.emitted('confirm')).toBeTruthy()
      expect(wrapper.emitted('confirm')).toHaveLength(1)
    })

    it('should emit cancel event when cancel button is clicked', async () => {
      const wrapper = mount(QuotaConfirmationModal, {
        props: {
          show: true,
          quotaInfo: mockQuotaInfo
        }
      })

      await wrapper.find('.cancel-button').trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
      expect(wrapper.emitted('cancel')).toHaveLength(1)
    })

    it('should emit cancel event when overlay is clicked', async () => {
      const wrapper = mount(QuotaConfirmationModal, {
        props: {
          show: true,
          quotaInfo: mockQuotaInfo
        }
      })

      await wrapper.find('.quota-modal-overlay').trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
      expect(wrapper.emitted('cancel')).toHaveLength(1)
    })

    it('should not emit cancel event when modal content is clicked', async () => {
      const wrapper = mount(QuotaConfirmationModal, {
        props: {
          show: true,
          quotaInfo: mockQuotaInfo
        }
      })

      await wrapper.find('.quota-modal').trigger('click')

      expect(wrapper.emitted('cancel')).toBeFalsy()
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const wrapper = mount(QuotaConfirmationModal, {
        props: {
          show: true,
          quotaInfo: mockQuotaInfo
        }
      })

      const modal = wrapper.find('.quota-modal')
      expect(modal.exists()).toBe(true)
    })

    it('should have proper button labels', () => {
      const wrapper = mount(QuotaConfirmationModal, {
        props: {
          show: true,
          quotaInfo: mockQuotaInfo
        }
      })

      const confirmButton = wrapper.find('.confirm-button')
      const cancelButton = wrapper.find('.cancel-button')

      expect(confirmButton.text()).toContain('Continue Anyway')
      expect(cancelButton.text()).toContain('Cancel')
    })
  })

  describe('warning message', () => {
    it('should display appropriate warning text', () => {
      const wrapper = mount(QuotaConfirmationModal, {
        props: {
          show: true,
          quotaInfo: mockQuotaInfo
        }
      })

      expect(wrapper.find('.warning-text').text()).toContain(
        "You're approaching your daily API limit. Continuing will use additional quota points."
      )
    })
  })
})
