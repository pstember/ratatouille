import type {
  RecipeInformation,
  RecipeInformationExtendedIngredientsInner,
  RecipeInformationNutrition,
  RecipeInformationAnalyzedInstructionsInner,
  GetRecipeEquipmentByID200Response,
  GetRecipePriceBreakdownByID200Response,
  RecipeInformationWinePairing
} from 'spoonacular'

export interface TransformedRecipeData {
  // Basic information
  externalId: number
  title: string
  image: string | null
  servings: number | null
  readyInMinutes: number | null
  sourceUrl: string | null
  sourceName: string | null
  summary: string | null
  instructions: string | null
  cuisine: string | null
  
  // Complete data
  ingredients: TransformedIngredientData[]
  nutrition: TransformedNutritionData | null
  analyzedInstructions: TransformedInstructionData[]
  equipment: TransformedEquipmentData[]
  priceBreakdown: TransformedPriceBreakdownData | null
  winePairing: TransformedWinePairingData | null
  
  // Metadata
  cuisines: string[]
  diets: string[]
  dishTypes: string[]
  tags: string[]
}

export interface TransformedIngredientData {
  id: number
  name: string
  amount: number
  unit: string
  aisle: string | null
  original: string
  originalName: string
  meta: string[]
  image: string | null
  consistency: string | null
  measures: {
    us: {
      amount: number
      unitShort: string
      unitLong: string
    }
    metric: {
      amount: number
      unitShort: string
      unitLong: string
    }
  }
}

export interface TransformedNutritionData {
  nutrients: Array<{
    name: string
    amount: number
    unit: string
    percentOfDailyNeeds: number | null
  }>
  properties: Array<{
    name: string
    amount: number
    unit: string
  }>
  flavonoids: Array<{
    name: string
    amount: number
    unit: string
  }>
  ingredients: Array<{
    id: number
    name: string
    amount: number
    unit: string
    nutrients: Array<{
      name: string
      amount: number
      unit: string
    }>
  }>
  caloricBreakdown: {
    percentProtein: number
    percentFat: number
    percentCarbs: number
  }
  weightPerServing: {
    amount: number
    unit: string
  }
}

export interface TransformedInstructionData {
  name: string
  steps: Array<{
    number: number
    step: string
    ingredients: Array<{
      id: number
      name: string
      localizedName: string
      image: string
    }>
    equipment: Array<{
      id: number
      name: string
      localizedName: string
      image: string
      temperature?: {
        number: number
        unit: string
      }
    }>
    length?: {
      number: number
      unit: string
    }
  }>
}

export interface TransformedEquipmentData {
  id: number
  name: string
  localizedName: string
  image: string
  temperature?: {
    number: number
    unit: string
  }
}

export interface TransformedPriceBreakdownData {
  ingredients: Array<{
    id: number
    amount: number
    unit: string
    unitLong: string
    unitShort: string
    aisle: string
    name: string
    original: string
    originalName: string
    meta: string[]
    image: string
    cost: {
      amount: number
      unit: string
    }
  }>
  totalCost: number
  totalCostPerServing: number
}

export interface TransformedWinePairingData {
  pairedWines: string[]
  pairingText: string
  productMatches: Array<{
    id: number
    title: string
    description: string
    price: string
    imageUrl: string
    averageRating: number
    ratingCount: number
    score: number
    link: string
  }>
}

export function transformSpoonacularRecipe(
  apiRecipe: RecipeInformation,
  equipment?: GetRecipeEquipmentByID200Response,
  priceBreakdown?: GetRecipePriceBreakdownByID200Response,
  winePairing?: RecipeInformationWinePairing
): TransformedRecipeData {
  return {
    // Basic information
    externalId: apiRecipe.id,
    title: apiRecipe.title,
    image: apiRecipe.image || null,
    servings: apiRecipe.servings || null,
    readyInMinutes: apiRecipe.readyInMinutes || null,
    sourceUrl: apiRecipe.sourceUrl || null,
    sourceName: apiRecipe.sourceName || null,
    summary: apiRecipe.summary || null,
    instructions: apiRecipe.instructions || null,
    cuisine: apiRecipe.cuisines?.[0] || null,
    
    // Complete data
    ingredients: apiRecipe.extendedIngredients?.map(transformIngredient) || [],
    nutrition: apiRecipe.nutrition ? transformNutrition(apiRecipe.nutrition) : null,
    analyzedInstructions: apiRecipe.analyzedInstructions?.map(transformInstruction) || [],
    equipment: equipment?.equipment?.map(transformEquipment) || [],
    priceBreakdown: priceBreakdown ? transformPriceBreakdown(priceBreakdown) : null,
    winePairing: winePairing ? transformWinePairing(winePairing) : null,
    
    // Metadata
    cuisines: apiRecipe.cuisines || [],
    diets: apiRecipe.diets || [],
    dishTypes: apiRecipe.dishTypes || [],
    tags: apiRecipe.tags || []
  }
}

export function transformIngredient(
  apiIngredient: RecipeInformationExtendedIngredientsInner
): TransformedIngredientData {
  return {
    id: apiIngredient.id,
    name: apiIngredient.name,
    amount: apiIngredient.amount,
    unit: apiIngredient.unit,
    aisle: apiIngredient.aisle || null,
    original: apiIngredient.original,
    originalName: apiIngredient.originalName,
    meta: apiIngredient.meta || [],
    image: apiIngredient.image || null,
    consistency: apiIngredient.consistency || null,
    measures: {
      us: {
        amount: apiIngredient.measures?.us?.amount || 0,
        unitShort: apiIngredient.measures?.us?.unitShort || '',
        unitLong: apiIngredient.measures?.us?.unitLong || ''
      },
      metric: {
        amount: apiIngredient.measures?.metric?.amount || 0,
        unitShort: apiIngredient.measures?.metric?.unitShort || '',
        unitLong: apiIngredient.measures?.metric?.unitLong || ''
      }
    }
  }
}

export function transformNutrition(
  apiNutrition: RecipeInformationNutrition
): TransformedNutritionData {
  return {
    nutrients: apiNutrition.nutrients?.map(nutrient => ({
      name: nutrient.name,
      amount: nutrient.amount,
      unit: nutrient.unit,
      percentOfDailyNeeds: nutrient.percentOfDailyNeeds || null
    })) || [],
    properties: apiNutrition.properties?.map(property => ({
      name: property.name,
      amount: property.amount,
      unit: property.unit
    })) || [],
    flavonoids: apiNutrition.flavonoids?.map(flavonoid => ({
      name: flavonoid.name,
      amount: flavonoid.amount,
      unit: flavonoid.unit
    })) || [],
    ingredients: apiNutrition.ingredients?.map(ingredient => ({
      id: ingredient.id,
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit,
      nutrients: ingredient.nutrients?.map(nutrient => ({
        name: nutrient.name,
        amount: nutrient.amount,
        unit: nutrient.unit
      })) || []
    })) || [],
    caloricBreakdown: {
      percentProtein: apiNutrition.caloricBreakdown?.percentProtein || 0,
      percentFat: apiNutrition.caloricBreakdown?.percentFat || 0,
      percentCarbs: apiNutrition.caloricBreakdown?.percentCarbs || 0
    },
    weightPerServing: {
      amount: apiNutrition.weightPerServing?.amount || 0,
      unit: apiNutrition.weightPerServing?.unit || ''
    }
  }
}

export function transformInstruction(
  apiInstruction: RecipeInformationAnalyzedInstructionsInner
): TransformedInstructionData {
  return {
    name: apiInstruction.name,
    steps: apiInstruction.steps?.map(step => ({
      number: step.number,
      step: step.step,
      ingredients: step.ingredients?.map(ingredient => ({
        id: ingredient.id,
        name: ingredient.name,
        localizedName: ingredient.localizedName,
        image: ingredient.image
      })) || [],
      equipment: step.equipment?.map(equipment => ({
        id: equipment.id,
        name: equipment.name,
        localizedName: equipment.localizedName,
        image: equipment.image,
        temperature: equipment.temperature ? {
          number: equipment.temperature.number,
          unit: equipment.temperature.unit
        } : undefined
      })) || [],
      length: step.length ? {
        number: step.length.number,
        unit: step.length.unit
      } : undefined
    })) || []
  }
}

export function transformEquipment(
  apiEquipment: GetRecipeEquipmentByID200ResponseEquipmentInner
): TransformedEquipmentData {
  return {
    id: apiEquipment.id,
    name: apiEquipment.name,
    localizedName: apiEquipment.localizedName,
    image: apiEquipment.image,
    temperature: apiEquipment.temperature ? {
      number: apiEquipment.temperature.number,
      unit: apiEquipment.temperature.unit
    } : undefined
  }
}

export function transformPriceBreakdown(
  apiPriceBreakdown: GetRecipePriceBreakdownByID200Response
): TransformedPriceBreakdownData {
  return {
    ingredients: apiPriceBreakdown.ingredients?.map(ingredient => ({
      id: ingredient.id,
      amount: ingredient.amount,
      unit: ingredient.unit,
      unitLong: ingredient.unitLong,
      unitShort: ingredient.unitShort,
      aisle: ingredient.aisle,
      name: ingredient.name,
      original: ingredient.original,
      originalName: ingredient.originalName,
      meta: ingredient.meta || [],
      image: ingredient.image,
      cost: {
        amount: ingredient.cost?.amount || 0,
        unit: ingredient.cost?.unit || ''
      }
    })) || [],
    totalCost: apiPriceBreakdown.totalCost || 0,
    totalCostPerServing: apiPriceBreakdown.totalCostPerServing || 0
  }
}

export function transformWinePairing(
  apiWinePairing: RecipeInformationWinePairing
): TransformedWinePairingData {
  return {
    pairedWines: apiWinePairing.pairedWines || [],
    pairingText: apiWinePairing.pairingText || '',
    productMatches: apiWinePairing.productMatches?.map(product => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      averageRating: product.averageRating,
      ratingCount: product.ratingCount,
      score: product.score,
      link: product.link
    })) || []
  }
}
