<template>
  <footer class="bg-white border-t border-gray-200 mt-auto">
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <!-- Logo and description -->
        <div class="flex items-center space-x-2">
          <div class="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">R</span>
          </div>
          <span class="text-lg font-bold text-gray-900">Ratatouille</span>
        </div>
        
        <p class="text-gray-600 text-sm">
          Discover and explore culinary recipes with our modern recipe discovery platform.
        </p>

        <!-- Links -->
        <div class="flex space-x-6">
          <a 
            href="https://spoonacular.com/food-api" 
            target="_blank" 
            rel="noopener noreferrer"
            class="text-gray-600 hover:text-orange-600 text-sm transition-colors duration-200"
          >
            Powered by Spoonacular
          </a>
        </div>
      </div>
      
      <div class="mt-6 pt-6 border-t border-gray-200">
        <p class="text-gray-500 text-xs text-center">
          © {{ new Date().getFullYear() }} Ratatouille. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
</template>
