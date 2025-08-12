<template>
  <div class="recipe-card animate-pulse">
    <!-- Recipe Image Skeleton -->
    <div class="relative aspect-[4/3] overflow-hidden bg-gray-200">
      <div class="w-full h-full bg-gray-300"></div>
    </div>

    <!-- Recipe Content Skeleton -->
    <div class="p-4">
      <!-- Title Skeleton -->
      <div class="space-y-2 mb-2">
        <div class="h-5 bg-gray-300 rounded w-3/4"></div>
        <div class="h-5 bg-gray-300 rounded w-1/2"></div>
      </div>

      <!-- Source info Skeleton -->
      <div class="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>

      <!-- Nutritional highlights Skeleton -->
      <div class="mb-3">
        <div class="flex flex-wrap gap-2">
          <div class="h-6 bg-gray-200 rounded-full w-16"></div>
          <div class="h-6 bg-gray-200 rounded-full w-20"></div>
          <div class="h-6 bg-gray-200 rounded-full w-14"></div>
          <div class="h-6 bg-gray-200 rounded-full w-12"></div>
        </div>
      </div>

      <!-- Action button Skeleton -->
      <div class="flex justify-between items-center">
        <div class="h-4 bg-gray-200 rounded w-20"></div>
        <div class="h-4 bg-gray-200 rounded w-4"></div>
      </div>
    </div>
  </div>
</template>
