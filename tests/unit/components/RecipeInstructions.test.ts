import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RecipeInstructions from '~/components/RecipeInstructions.vue'
import type { SpoonacularInstruction } from '~/types/recipe'

describe('RecipeInstructions', () => {
  const mockAnalyzedInstructions: SpoonacularInstruction[] = [
    {
      name: 'Main Instructions',
      steps: [
        {
          number: 1,
          step: 'Preheat the oven to 350°F',
          ingredients: [],
          equipment: []
        },
        {
          number: 2,
          step: 'Mix all ingredients in a bowl',
          ingredients: [],
          equipment: []
        }
      ]
    }
  ]

  it('renders analyzed instructions correctly', () => {
    const wrapper = mount(RecipeInstructions, {
      props: {
        analyzedInstructions: mockAnalyzedInstructions
      }
    })

    expect(wrapper.text()).toContain('Instructions')
    expect(wrapper.text()).toContain('Preheat the oven to 350°F')
    expect(wrapper.text()).toContain('Mix all ingredients in a bowl')
  })

  it('displays step numbers correctly', () => {
    const wrapper = mount(RecipeInstructions, {
      props: {
        analyzedInstructions: mockAnalyzedInstructions
      }
    })

    const stepNumbers = wrapper.findAll('.step-number')
    expect(stepNumbers).toHaveLength(2)
    expect(stepNumbers[0].text()).toBe('1')
    expect(stepNumbers[1].text()).toBe('2')
  })

  it('renders fallback instructions when no analyzed instructions', () => {
    const wrapper = mount(RecipeInstructions, {
      props: {
        instructions: 'Simple cooking instructions here'
      }
    })

    expect(wrapper.text()).toContain('Simple cooking instructions here')
    expect(wrapper.find('.instructions-fallback').exists()).toBe(true)
  })

  it('shows no instructions message when no data provided', () => {
    const wrapper = mount(RecipeInstructions, {
      props: {}
    })

    expect(wrapper.text()).toContain('No instructions available for this recipe')
    expect(wrapper.find('.no-instructions').exists()).toBe(true)
  })

  it('displays section names when multiple instruction sections', () => {
    const multipleSections: SpoonacularInstruction[] = [
      {
        name: 'For the Dough',
        steps: [{ number: 1, step: 'Mix flour and water', ingredients: [], equipment: [] }]
      },
      {
        name: 'For the Filling',
        steps: [{ number: 1, step: 'Prepare the filling', ingredients: [], equipment: [] }]
      }
    ]

    const wrapper = mount(RecipeInstructions, {
      props: {
        analyzedInstructions: multipleSections
      }
    })

    expect(wrapper.text()).toContain('For the Dough')
    expect(wrapper.text()).toContain('For the Filling')
  })

  it('prioritizes analyzed instructions over fallback instructions', () => {
    const wrapper = mount(RecipeInstructions, {
      props: {
        analyzedInstructions: mockAnalyzedInstructions,
        instructions: 'This should not be shown'
      }
    })

    expect(wrapper.text()).toContain('Preheat the oven to 350°F')
    expect(wrapper.text()).not.toContain('This should not be shown')
  })
})
