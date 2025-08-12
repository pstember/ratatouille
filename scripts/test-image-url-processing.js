// Test script for image URL processing
import { processImageUrl } from '../server/utils/image-url-processor.js'

console.log('🧪 Testing image URL processing...\n')

// Test cases
const testCases = [
  {
    input: '/Kobe-Beef-Sliders-With-Tarragon-Aioli-and-Caramelized-Onions-648993.jpg',
    expected: 'https://img.spoonacular.com/recipes/Kobe-Beef-Sliders-With-Tarragon-Aioli-and-Caramelized-Onions-648993.jpg',
    description: 'Relative Spoonacular URL'
  },
  {
    input: 'Kobe-Beef-Sliders-With-Tarragon-Aioli-and-Caramelized-Onions-648993.jpg',
    expected: 'https://img.spoonacular.com/recipes/Kobe-Beef-Sliders-With-Tarragon-Aioli-and-Caramelized-Onions-648993.jpg',
    description: 'Relative Spoonacular URL without leading slash'
  },
  {
    input: 'https://img.spoonacular.com/recipes/some-recipe.jpg',
    expected: 'https://img.spoonacular.com/recipes/some-recipe.jpg',
    description: 'Already full URL'
  },
  {
    input: '/images/placeholder.jpg',
    expected: '/images/placeholder.jpg',
    description: 'Local placeholder image'
  },
  {
    input: null,
    expected: undefined,
    description: 'Null input'
  },
  {
    input: undefined,
    expected: undefined,
    description: 'Undefined input'
  },
  {
    input: '',
    expected: undefined,
    description: 'Empty string'
  }
]

let passedTests = 0
let totalTests = testCases.length

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.description}`)
  console.log(`  Input: ${testCase.input}`)
  
  const result = processImageUrl(testCase.input, 123)
  console.log(`  Output: ${result}`)
  console.log(`  Expected: ${testCase.expected}`)
  
  if (result === testCase.expected) {
    console.log('  ✅ PASSED\n')
    passedTests++
  } else {
    console.log('  ❌ FAILED\n')
  }
})

console.log(`\n📊 Results: ${passedTests}/${totalTests} tests passed`)

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! Image URL processing is working correctly.')
} else {
  console.log('⚠️ Some tests failed. Please check the implementation.')
}
