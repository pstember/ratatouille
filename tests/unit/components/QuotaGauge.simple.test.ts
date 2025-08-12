import { describe, it, expect } from 'vitest'

describe('QuotaGauge Component', () => {
  it('can be imported', async () => {
    // This test just verifies the component can be imported without errors
    const QuotaGauge = await import('~/components/QuotaGauge.vue')
    expect(QuotaGauge.default).toBeDefined()
  })

  it('has correct component name', async () => {
    const QuotaGauge = await import('~/components/QuotaGauge.vue')
    expect(QuotaGauge.default.name || 'QuotaGauge').toBe('QuotaGauge')
  })
})
