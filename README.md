# Ratatouille - Recipe Discovery Platform

A modern, fast, and responsive web application for discovering and exploring culinary recipes. Built with Nuxt 3, Vue 3, and Tailwind CSS.

## Features

- 🔍 **Recipe Search**: Search for recipes by name or ingredients with real-time results
- 🌍 **Cuisine Filtering**: Filter recipes by cuisine type (Italian, French, Mexican, Indian, Chinese, Japanese, Mediterranean, American, and more)
- 🥗 **Dietary Filters**: Filter by dietary restrictions (Vegetarian, Vegan, Gluten-Free)
- ⏱️ **Quick Meals**: Find recipes ready in 20 minutes or less
- 📱 **Responsive Design**: Beautiful UI that works on all device sizes
- 🍽️ **Recipe Details**: Complete recipe information with ingredients, instructions, and nutritional data
- 🌍 **Cuisine Badges**: Visual cuisine type indicators with cuisine-specific colors
- ⚡ **Fast Performance**: Server-side rendering with database caching for optimal speed
- 🎨 **Modern UI**: Clean, intuitive interface with smooth animations
- 📊 **Nutritional Info**: Comprehensive nutritional breakdown with daily value percentages
- 🆕 **New Recipes**: Discover recently added recipes with special highlighting
- 🛡️ **API Quota Protection**: Smart quota monitoring with user confirmation when approaching daily limits
- 🔄 **Graceful Fallbacks**: Cached data display when API limits are reached
- 📅 **Daily Reset**: Automatic quota tracking reset at midnight UTC
- 🔍 **Browse Recipes**: Comprehensive recipe browsing with advanced filtering options
- 🌟 **Discover Feature**: Random recipe discovery with nutritional information
- 📱 **Offline Support**: Offline indicator and cached data access
- 🚨 **Allergen Information**: Recipe allergen badges and warnings
- 📋 **Recipe Instructions**: Step-by-step cooking instructions
- 🎯 **Search Source Indicator**: Shows whether results are from API or cached data
- 💾 **Database-First Search**: Prioritizes cached data for faster responses

## Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: Prisma
- **API**: Spoonacular Recipe API
- **Build Tool**: Vite

## Prerequisites

- Node.js 20.19.0 or higher
- npm or yarn
- Spoonacular API key (free at [spoonacular.com](https://spoonacular.com/food-api))

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ratatouille
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="file:./dev.db"

# API Configuration
SPOONACULAR_API_KEY=your_actual_api_key_here
```

**⚠️ Important**: Replace `your_actual_api_key_here` with your actual Spoonacular API key.

**Optional Environment Variables** (with defaults):
- `NUXT_PUBLIC_API_BASE`: Spoonacular API base URL (default: `https://api.spoonacular.com/recipes`)
- `CACHE_TTL`: Cache time-to-live in seconds (default: `604800` - 7 days)

### 4. Database Setup

```bash
# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
ratatouille/
├── components/           # Vue components
│   ├── TheHeader.vue     # Site navigation with cuisine filters
│   ├── TheFooter.vue     # Site footer
│   ├── SearchBar.vue     # Search input component
│   ├── RecipeCard.vue    # Recipe card component with cuisine badges
│   ├── RecipeSkeleton.vue # Loading placeholder
│   ├── CuisineBadge.vue  # Cuisine type indicator
│   ├── NutritionalInfo.vue # Nutrition display
│   ├── NutritionBadge.vue  # Nutrition badge
│   ├── NutritionCard.vue   # Nutrition card
│   ├── NewBadge.vue        # New recipe indicator
│   ├── AllergenBadge.vue   # Allergen warning badges
│   ├── RecipeInstructions.vue # Step-by-step instructions
│   ├── QuotaGauge.vue     # API quota monitoring display
│   ├── QuotaConfirmationModal.vue # Quota confirmation dialog
│   ├── ApiErrorMessage.vue # API error display component
│   ├── SearchSourceIndicator.vue # Shows data source (API/cache)
│   └── OfflineIndicator.vue # Offline status indicator
├── pages/               # Application pages
│   ├── index.vue        # Recipe search page with filters
│   ├── browse.vue       # Comprehensive recipe browsing
│   ├── discover.vue     # Random recipe discovery
│   ├── offline.vue      # Offline page
│   └── recipe/[id].vue  # Recipe detail page
├── stores/              # Pinia stores
│   ├── recipes.ts       # Recipe search state and filtering
│   ├── currentRecipe.ts # Individual recipe state
│   └── quota.ts         # API quota management
├── server/              # Server-side code
│   ├── api/             # API routes with category filtering
│   │   ├── recipes/     # Recipe-specific endpoints
│   │   ├── quota.ts     # Quota management endpoint
│   │   └── health.ts    # Health check endpoint
│   ├── database/        # Database configuration
│   ├── utils/           # Server utilities and caching
│   └── services/        # Business logic services
├── types/               # TypeScript type definitions
├── prisma/              # Database schema and migrations
├── tests/               # Test suite
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/            # End-to-end tests
├── specs/              # Feature specifications
├── scripts/            # Utility scripts
└── assets/             # Static assets
```

## Recipe Categories & Filters

The application provides comprehensive filtering options:

### Cuisine Types
- **Italian** - Authentic Italian cuisine and flavors
- **French** - Classic French culinary traditions
- **Mexican** - Spicy and flavorful Mexican dishes
- **Indian** - Rich and aromatic Indian cuisine
- **Chinese** - Traditional Chinese cooking techniques
- **Japanese** - Elegant and refined Japanese dishes
- **Mediterranean** - Fresh and healthy Mediterranean fare
- **American** - Classic American comfort food
- **And more** - African, British, Cajun, Caribbean, German, Greek, Korean, Thai, Vietnamese, and others

### Dietary Restrictions
- **Vegetarian** - No meat or meat by-products
- **Vegan** - 100% plant-based cuisine
- **Gluten-Free** - No wheat, barley, rye, or gluten-containing grains

### Special Categories
- **Quick Meals** - Recipes ready in 20 minutes or less
- **Desserts** - Sweet treats and delightful desserts
- **All Recipes** - Browse the complete collection

## API Endpoints

- `GET /api/recipes` - Search for recipes with category filtering
- `GET /api/recipes/browse` - Browse recipes with advanced filtering
- `GET /api/recipes/random` - Get random recipe with nutrition data
- `GET /api/recipes/new` - Get recently added recipes
- `GET /api/recipe/[id]` - Get recipe details
- `GET /api/quota` - Get current API quota status
- `GET /api/health` - Health check endpoint

## Database Schema

The application uses the following main tables:

- **recipes**: Basic recipe information with cuisine and dietary data
- **recipe_ingredients**: Recipe ingredients with measurements
- **nutrition**: Nutritional data for recipes
- **cache**: API response caching with TTL
- **search**: Search query caching
- **quota_usage**: Daily API quota tracking and management

## Development

### Development Workflow

**IMPORTANT**: All new features must follow the development workflow defined in `.cursor/rules/development-workflow.md`. This ensures:

- Proper requirements gathering before implementation
- Clear specifications and success criteria
- Better code quality and maintainability
- Reduced rework and improved user satisfaction

**Always start by asking**: "Should I create a Spec for this task first?"

### Available Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Testing
npm test              # Run all tests
npm run test:unit     # Run unit tests
npm run test:integration # Run integration tests
npm run test:coverage # Run tests with coverage
npm run test:ui       # Run tests with UI
npm run test:watch    # Run tests in watch mode

# Database
npx prisma studio    # Open database GUI
npx prisma migrate dev  # Run migrations
npx prisma generate     # Generate client
```

### Code Style

The project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Tailwind CSS for styling

## Recent Improvements

### Enhanced Filtering System
- **Fixed Category Selection**: Resolved header filtering issues for proper recipe categorization
- **Comprehensive Cuisine Support**: Added support for 25+ cuisine types from Spoonacular API
- **Improved State Management**: Enhanced Pinia store for better category handling
- **Better Cache Management**: Fixed cache keys to prevent category result mixing

### Cuisine Badge System
- **Visual Cuisine Indicators**: Added cuisine badges to recipe cards with cuisine-specific colors
- **Data Quality Assurance**: Ensured all recipes have valid cuisine associations
- **Consistent Design**: Badge styling matches existing UI components (NutritionBadge, NewBadge)
- **Enhanced User Experience**: Users can quickly identify cuisine types at a glance

### API Integration
- **Spoonacular Compliance**: Updated to use official cuisine types and dietary restrictions
- **Parameter Mapping**: Proper translation of filters to Spoonacular API parameters
- **Error Handling**: Improved error handling and user feedback

### Nutrition Data Enhancement
- **Fixed Random Recipe Nutrition**: Resolved missing nutrition information in random recipe endpoint
- **Complete Nutrition Data**: Random recipes now include full nutrition information (calories, protein, carbs, fat, fiber, sugar, sodium)
- **Enhanced API Integration**: Added individual recipe API calls to fetch complete nutrition data for random recipes
- **Fallback Handling**: Graceful fallback to basic recipe data if nutrition fetch fails
- **Performance Optimization**: Maintained caching while ensuring complete data integrity

### Quota Management System
- **Database-Backed Storage**: Implemented persistent quota tracking with automatic daily reset
- **Real-Time Monitoring**: Live quota gauge with smooth animations and user confirmation
- **Smart Thresholds**: Automatic confirmation prompts at 85% quota usage
- **Graceful Degradation**: Fallback to cached data when quota is exceeded
- **User-Friendly Interface**: Clear quota status display with progress indicators

### Browse and Discover Features
- **Comprehensive Browsing**: Advanced recipe browsing with multiple filter options
- **Random Discovery**: Enhanced discover feature with complete nutrition data
- **Offline Support**: Offline indicator and cached data access
- **Search Source Tracking**: Visual indicators showing data source (API vs cache)

### Allergen and Instruction Support
- **Allergen Badges**: Visual allergen warnings for recipe safety
- **Step-by-Step Instructions**: Detailed cooking instructions with proper formatting
- **Enhanced Recipe Details**: Complete recipe information display

## Deployment

### Production Environment Variables

For production deployment, set the following environment variables:

```env
# Required
DATABASE_URL="postgresql://..."  # PostgreSQL connection string
SPOONACULAR_API_KEY="your_api_key"

# Optional (with defaults)
NUXT_PUBLIC_API_BASE="https://api.spoonacular.com/recipes"
CACHE_TTL=604800
```

### Build and Deploy

```bash
# Build the application
npm run build

# Start production server
npm run preview
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Spoonacular](https://spoonacular.com/food-api) for the comprehensive recipe API and cuisine classifications
- [Nuxt](https://nuxt.com/) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Prisma](https://www.prisma.io/) for the excellent database ORM
