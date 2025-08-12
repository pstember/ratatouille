import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ApiErrorMessage from '~/components/ApiErrorMessage.vue'

// Mock Icon component
vi.mock('#components', () => ({
  Icon: {
    name: 'Icon',
    template: '<div class="icon" :data-icon="$attrs.name"></div>'
  }
}))

describe('ApiErrorMessage', () => {
  describe('rendering', () => {
    it('should render rate limit error correctly', () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'RATE_LIMIT_EXCEEDED',
          message: 'API rate limit reached',
          retryAfter: 60
        }
      })

      expect(wrapper.find('.error-title').text()).toBe('Rate Limit Reached')
      expect(wrapper.find('.error-message').text()).toBe('API rate limit reached')
      expect(wrapper.find('.retry-text').text()).toContain('You can try again in 1 minute')
      expect(wrapper.find('.retry-button').exists()).toBe(true)
    })

    it('should render quota exceeded error correctly', () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'QUOTA_EXCEEDED',
          message: 'Daily quota exceeded',
          fallbackData: [{ id: 1, title: 'Cached Recipe' }]
        }
      })

      expect(wrapper.find('.error-title').text()).toBe('Daily Quota Exceeded')
      expect(wrapper.find('.error-message').text()).toBe('Daily quota exceeded')
      expect(wrapper.find('.fallback-text').text()).toContain('Showing 1 cached recipes')
    })

    it('should render generic error correctly', () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'GENERIC_ERROR',
          message: 'Something went wrong'
        }
      })

      expect(wrapper.find('.error-title').text()).toBe('Something Went Wrong')
      expect(wrapper.find('.error-message').text()).toBe('Something went wrong')
    })
  })

  describe('error type styling', () => {
    it('should apply correct CSS class for rate limit error', () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'RATE_LIMIT_EXCEEDED',
          message: 'Test message'
        }
      })

      expect(wrapper.find('.api-error-message').classes()).toContain('api-error-message--rate_limit_exceeded')
    })

    it('should apply correct CSS class for quota exceeded error', () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'QUOTA_EXCEEDED',
          message: 'Test message'
        }
      })

      expect(wrapper.find('.api-error-message').classes()).toContain('api-error-message--quota_exceeded')
    })

    it('should apply correct CSS class for generic error', () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'GENERIC_ERROR',
          message: 'Test message'
        }
      })

      expect(wrapper.find('.api-error-message').classes()).toContain('api-error-message--generic_error')
    })
  })

  describe('icon display', () => {
    it('should show error icon for rate limit error', () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'RATE_LIMIT_EXCEEDED',
          message: 'Test message'
        }
      })

      expect(wrapper.find('.error-icon').exists()).toBe(true)
    })

    it('should show error icon for quota exceeded error', () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'QUOTA_EXCEEDED',
          message: 'Test message'
        }
      })

      expect(wrapper.find('.error-icon').exists()).toBe(true)
    })

    it('should show error icon for generic error', () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'GENERIC_ERROR',
          message: 'Test message'
        }
      })

      expect(wrapper.find('.error-icon').exists()).toBe(true)
    })
  })

  describe('retry functionality', () => {
    it('should show retry button when retryAfter is provided and <= 300 seconds', () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'RATE_LIMIT_EXCEEDED',
          message: 'Test message',
          retryAfter: 60
        }
      })

      expect(wrapper.find('.retry-button').exists()).toBe(true)
      expect(wrapper.find('.retry-button').text()).toContain('Try Again')
    })

    it('should not show retry button when retryAfter > 300 seconds', () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'RATE_LIMIT_EXCEEDED',
          message: 'Test message',
          retryAfter: 400
        }
      })

      expect(wrapper.find('.retry-button').exists()).toBe(false)
    })

    it('should not show retry button when retryAfter is not provided', () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'QUOTA_EXCEEDED',
          message: 'Test message'
        }
      })

      expect(wrapper.find('.retry-button').exists()).toBe(false)
    })

    it('should emit retry event when retry button is clicked', async () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'RATE_LIMIT_EXCEEDED',
          message: 'Test message',
          retryAfter: 60
        }
      })

      await wrapper.find('.retry-button').trigger('click')

      expect(wrapper.emitted('retry')).toBeTruthy()
      expect(wrapper.emitted('retry')).toHaveLength(1)
    })

    it('should disable retry button and show loading state when retrying', async () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'RATE_LIMIT_EXCEEDED',
          message: 'Test message',
          retryAfter: 60
        }
      })

      await wrapper.find('.retry-button').trigger('click')

      // The button should be disabled and show "Retrying..." text
      const button = wrapper.find('.retry-button')
      expect(button.attributes('disabled')).toBeDefined()
      expect(button.text()).toContain('Retrying...')
    })
  })

  describe('fallback data display', () => {
    it('should show fallback info when fallback data is provided', () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'QUOTA_EXCEEDED',
          message: 'Test message',
          fallbackData: [
            { id: 1, title: 'Recipe 1' },
            { id: 2, title: 'Recipe 2' }
          ]
        }
      })

      expect(wrapper.find('.fallback-info').exists()).toBe(true)
      expect(wrapper.find('.fallback-text').text()).toContain('Showing 2 cached recipes')
    })

    it('should not show fallback info when no fallback data', () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'QUOTA_EXCEEDED',
          message: 'Test message'
        }
      })

      expect(wrapper.find('.fallback-info').exists()).toBe(false)
    })
  })

  describe('retry progress', () => {
    it('should show progress bar when retryAfter is provided', () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'RATE_LIMIT_EXCEEDED',
          message: 'Test message',
          retryAfter: 60
        }
      })

      expect(wrapper.find('.retry-progress').exists()).toBe(true)
      expect(wrapper.find('.retry-progress-bar').exists()).toBe(true)
    })

    it('should calculate progress correctly', () => {
      const mockDate = new Date('2024-01-15T10:30:00Z')
      vi.setSystemTime(mockDate)

      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'RATE_LIMIT_EXCEEDED',
          message: 'Test message',
          retryAfter: 60
        }
      })

      const progressBar = wrapper.find('.retry-progress-bar')
      expect(progressBar.attributes('style')).toContain('width: 0%')

      vi.useRealTimers()
    })
  })

  describe('user interactions', () => {
    it('should emit goHome event when home button is clicked', async () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'GENERIC_ERROR',
          message: 'Test message'
        }
      })

      await wrapper.find('.home-button').trigger('click')

      expect(wrapper.emitted('goHome')).toBeTruthy()
      expect(wrapper.emitted('goHome')).toHaveLength(1)
    })

    it('should show home button for all error types', () => {
      const errorTypes = ['RATE_LIMIT_EXCEEDED', 'QUOTA_EXCEEDED', 'GENERIC_ERROR']

      errorTypes.forEach(errorType => {
        const wrapper = mount(ApiErrorMessage, {
          props: {
            errorType: errorType as any,
            message: 'Test message'
          }
        })

        expect(wrapper.find('.home-button').exists()).toBe(true)
        expect(wrapper.find('.home-button').text()).toContain('Go Home')
      })
    })
  })

  describe('time formatting', () => {
    it('should format seconds correctly', () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'RATE_LIMIT_EXCEEDED',
          message: 'Test message',
          retryAfter: 30
        }
      })

      expect(wrapper.find('.retry-text').text()).toContain('30 seconds')
    })

    it('should format minutes correctly', () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'RATE_LIMIT_EXCEEDED',
          message: 'Test message',
          retryAfter: 120
        }
      })

      expect(wrapper.find('.retry-text').text()).toContain('2 minutes')
    })

    it('should format single minute correctly', () => {
      const wrapper = mount(ApiErrorMessage, {
        props: {
          errorType: 'RATE_LIMIT_EXCEEDED',
          message: 'Test message',
          retryAfter: 60
        }
      })

      expect(wrapper.find('.retry-text').text()).toContain('1 minute')
    })
  })
})
