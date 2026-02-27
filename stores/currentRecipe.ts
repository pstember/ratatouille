import { defineStore } from 'pinia'
import { useQuotaStore } from './quota'
import type { Recipe, RecipeDetailResponse } from '~/types/recipe'

export const useCurrentRecipeStore = defineStore('currentRecipe', () => {
  // State
  const recipe = ref<Recipe | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const cached = ref(false)
  
  const quotaStore = useQuotaStore()

  // Computed
  const hasRecipe = computed(() => {
    return recipe.value !== null
  })

  const recipeId = computed(() => {
    return recipe.value?.id
  })

  // Actions
  async function fetchRecipe(id: number) {
    loading.value = true
    error.value = null

    try {
      const response = await quotaStore.executeWithQuotaCheck(async () => {
        return await $fetch<RecipeDetailResponse>(`/api/recipe/${id}`)
      })
      
      recipe.value = response.recipe
      cached.value = response.cached
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch recipe'
    } finally {
      loading.value = false
    }
  }

  function clearRecipe() {
    recipe.value = null
    error.value = null
    cached.value = false
  }

  function setRecipe(newRecipe: Recipe) {
    recipe.value = newRecipe
    error.value = null
  }

  return {
    // State
    recipe: readonly(recipe),
    loading: readonly(loading),
    error: readonly(error),
    cached: readonly(cached),

    // Computed
    hasRecipe,
    recipeId,

    // Actions
    fetchRecipe,
    clearRecipe,
    setRecipe
  }
})
