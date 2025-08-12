import { describe, it, expect } from 'vitest'
import { processImageUrl } from '~/server/utils/image-url-processor'

describe('Image URL Processor', () => {
  it('should convert relative Spoonacular URLs to full URLs', () => {
    const input = '/Kobe-Beef-Sliders-With-Tarragon-Aioli-and-Caramelized-Onions-648993.jpg'
    const expected = 'https://img.spoonacular.com/recipes/Kobe-Beef-Sliders-With-Tarragon-Aioli-and-Caramelized-Onions-648993.jpg'
    
    expect(processImageUrl(input, 123)).toBe(expected)
  })

  it('should handle relative URLs without leading slash', () => {
    const input = 'Kobe-Beef-Sliders-With-Tarragon-Aioli-and-Caramelized-Onions-648993.jpg'
    const expected = 'https://img.spoonacular.com/recipes/Kobe-Beef-Sliders-With-Tarragon-Aioli-and-Caramelized-Onions-648993.jpg'
    
    expect(processImageUrl(input, 123)).toBe(expected)
  })

  it('should return full URLs as-is', () => {
    const input = 'https://img.spoonacular.com/recipes/some-recipe.jpg'
    const expected = 'https://img.spoonacular.com/recipes/some-recipe.jpg'
    
    expect(processImageUrl(input, 123)).toBe(expected)
  })

  it('should return local placeholder images as-is', () => {
    const input = '/images/placeholder.jpg'
    const expected = '/images/placeholder.jpg'
    
    expect(processImageUrl(input, 123)).toBe(expected)
  })

  it('should handle null input', () => {
    expect(processImageUrl(null, 123)).toBeUndefined()
  })

  it('should handle undefined input', () => {
    expect(processImageUrl(undefined, 123)).toBeUndefined()
  })

  it('should handle empty string', () => {
    expect(processImageUrl('', 123)).toBeUndefined()
  })

  it('should handle PNG files', () => {
    const input = '/some-recipe.png'
    const expected = 'https://img.spoonacular.com/recipes/some-recipe.png'
    
    expect(processImageUrl(input, 123)).toBe(expected)
  })

  it('should handle JPEG files', () => {
    const input = '/some-recipe.jpeg'
    const expected = 'https://img.spoonacular.com/recipes/some-recipe.jpeg'
    
    expect(processImageUrl(input, 123)).toBe(expected)
  })
})
