# Ratatouille Application Specifications

This document provides an overview of all specifications for rebuilding the Ratatouille Recipe Discovery Platform from scratch. Each specification covers a specific domain or technical aspect of the application.

## Overview

Ratatouille is a modern, fast, and responsive web application for discovering and exploring culinary recipes. Built with Nuxt 3, Vue 3, and Tailwind CSS, it provides comprehensive recipe search, filtering, and nutritional information.

## Specifications Index

| Domain | Specification File | Description |
|--------|-------------------|-------------|
| **Architecture** | [Architecture & Tech Stack](specs/architecture-tech-stack.md) | Overall system architecture, technology choices, and design patterns |
| **Frontend** | [Frontend Components](specs/frontend-components.md) | Vue components, layouts, pages, and UI architecture |
| **Backend** | [Backend API & Server](specs/backend-api-server.md) | Server-side API endpoints, middleware, and utilities |
| **Database** | [Database Schema & Models](specs/database-schema-models.md) | Database design, Prisma schema, and data relationships |
| **State Management** | [State Management & Stores](specs/state-management-stores.md) | Pinia stores, composables, and application state |
| **API Integration** | [External API Integration](specs/external-api-integration.md) | Spoonacular API integration, caching, and data synchronization |
| **Styling & UI** | [Styling & UI System](specs/styling-ui-system.md) | Tailwind CSS configuration, design system, and component styling |
| **Testing** | [Testing Strategy & Setup](specs/testing-strategy-setup.md) | Testing framework, test structure, and coverage requirements |
| **Build & Deployment** | [Build & Deployment](specs/build-deployment.md) | Build configuration, environment setup, and deployment process |
| **Performance** | [Performance & Optimization](specs/performance-optimization.md) | Caching strategies, performance monitoring, and optimization techniques |
| **Security** | [Security & Best Practices](specs/security-best-practices.md) | Security considerations, API key management, and data protection |
| **Development Workflow** | [Development Workflow](specs/development-workflow.md) | Development process, coding standards, and quality assurance |

## Quick Start Guide

### Prerequisites
- Node.js 20.19.0 or higher
- npm or yarn
- Spoonacular API key (free at [spoonacular.com](https://spoonacular.com/food-api))

### Environment Setup
```bash
# Clone repository
git clone <repository-url>
cd ratatouille

# Install dependencies
npm install

# Environment configuration
cp .env.example .env
# Edit .env with your API key and database settings

# Database setup
npx prisma migrate dev
npx prisma generate

# Start development
npm run dev
```

### Key Features
- 🔍 **Recipe Search**: Search by name or ingredients with real-time results
- 🌍 **Cuisine Filtering**: Filter by 25+ cuisine types
- 🥗 **Dietary Filters**: Vegetarian, Vegan, Gluten-Free options
- ⏱️ **Quick Meals**: 20-minute or less recipes
- 📊 **Nutritional Info**: Comprehensive nutritional breakdown
- 🆕 **New Recipes**: Recently added recipe highlighting
- ⚡ **Fast Performance**: Server-side rendering with smart caching

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Nuxt 3)      │◄──►│   (Nitro)       │◄──►│   (Prisma)      │
│                 │    │                 │    │                 │
│ • Vue Components│    │ • API Routes    │    │ • SQLite/PostgreSQL
│ • Pinia Stores  │    │ • Middleware    │    │ • Migrations    │
│ • Tailwind CSS  │    │ • Caching       │    │ • Schema       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   External      │
                       │   (Spoonacular) │
                       │                 │
                       │ • Recipe API    │
                       │ • Nutrition Data│
                       │ • Cuisine Types │
                       └─────────────────┘
```

## Technology Stack

- **Framework**: Nuxt 3 with Vue 3
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: Prisma
- **Testing**: Vitest
- **Build Tool**: Vite
- **External API**: Spoonacular Recipe API

## Development Standards

- **TypeScript**: Strict typing and type safety
- **Component Architecture**: Single File Components (SFC)
- **State Management**: Centralized with Pinia stores
- **Testing**: Unit, integration, and e2e tests
- **Code Quality**: ESLint + Prettier
- **Performance**: Server-side rendering with caching
- **Accessibility**: WCAG compliance

## Contributing

1. Review the relevant specification document
2. Follow the development workflow
3. Write tests for new features
4. Ensure code quality standards
5. Submit pull requests with clear descriptions

## Support

For questions about specific specifications, refer to the individual specification documents. For general development questions, consult the development workflow specification.

---

*Last updated: January 2025*
*Version: 1.0.0*
