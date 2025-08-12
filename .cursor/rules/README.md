# Cursor Rules Index

This directory contains all the coding rules and standards for the Ratatouille project. Each rule is designed to ensure consistent, high-quality, and maintainable code.

## Core Development Rules

### [development-workflow.mdc](./development-workflow.mdc)
**Purpose:** Enforces the Spec → Code development workflow
- Requires specification creation before implementation
- Ensures proper planning and user approval
- Maintains high-quality feature development

### [mdc-rules-organization.mdc](./mdc-rules-organization.mdc)
**Purpose:** Guidelines for organizing and managing Cursor IDE AI MDC rules
- Standardizes rule file organization
- Ensures consistent naming and structure
- Maintains rule discoverability

## Frontend Development Rules

### [VUE-component-structure.mdc](./VUE-component-structure.mdc)
**Purpose:** Vue component structure and SFC organization best practices
- Single File Component (SFC) organization
- Component naming and file structure
- Props and emits best practices
- Composition API patterns
- Template and style organization

### [VUE-state-management.mdc](./VUE-state-management.mdc)
**Purpose:** Vue state management with Pinia and composables
- Pinia store structure and patterns
- Composables for reusable logic
- Component integration patterns
- Local vs global state management
- State persistence strategies

## JavaScript/TypeScript Rules

### [JS-modern-syntax.mdc](./JS-modern-syntax.mdc)
**Purpose:** Modern JavaScript ES6+ syntax and functional programming patterns
- ES6+ features (arrow functions, destructuring, etc.)
- Array and object methods
- Async/await patterns
- Module systems
- Optional chaining and nullish coalescing

### [JS-performance.mdc](./JS-performance.mdc)
**Purpose:** JavaScript performance optimization and memory management
- Memory management best practices
- Efficient loops and algorithms
- Debouncing and throttling
- Lazy loading strategies
- DOM operation optimization
- Caching strategies

### [TS-type-safety.mdc](./TS-type-safety.mdc)
**Purpose:** TypeScript type safety and strict typing guidelines
- Strict TypeScript configuration
- Type definitions and interfaces
- Null safety patterns
- Function types and generics
- Generic constraints

### [TS-error-handling.mdc](./TS-error-handling.mdc)
**Purpose:** TypeScript error handling patterns and custom error classes
- Custom error classes with type information
- Result pattern implementation
- Async error handling
- Type guards for error handling
- Optional chaining with error handling

## Backend Development Rules

### [api-design-standards.mdc](./api-design-standards.mdc)
**Purpose:** REST API design conventions and server route standards
- RESTful API conventions
- HTTP status code usage
- Request validation with Zod
- Error handling patterns
- Response format standards
- Rate limiting and security
- API documentation standards
- Caching strategies
- Logging and monitoring

### [database-schema-design.mdc](./database-schema-design.mdc)
**Purpose:** Prisma schema design and database performance best practices
- Prisma schema conventions
- Migration best practices
- Database client configuration
- Query optimization strategies
- Data validation and constraints
- Indexing strategies
- Database testing patterns
- Performance monitoring
- Data migration and seeding

## Quality Assurance Rules

### [testing-standards.mdc](./testing-standards.mdc)
**Purpose:** Comprehensive testing best practices across all layers
- Unit testing standards (components, stores, utilities)
- Integration testing (API, database)
- E2E testing patterns
- Test data management
- Coverage requirements
- Testing best practices
- Mock management

## Security and Code Quality Rules

### [security-best-practices.mdc](./security-best-practices.mdc)
**Purpose:** Application security standards and vulnerability prevention
- Input validation and sanitization
- XSS prevention
- CSRF protection
- Environment variable security
- Content Security Policy
- SQL injection prevention
- Rate limiting
- Authentication and authorization
- Secure file uploads
- Security headers

### [code-formatting-standards.mdc](./code-formatting-standards.mdc)
**Purpose:** Consistent code style and formatting guidelines
- Prettier configuration
- ESLint configuration
- TypeScript configuration
- Vue component formatting
- TypeScript code formatting
- Naming conventions
- Import organization
- Comment standards
- Package.json scripts

## Development Workflow Rules

### [auto-git-commit.mdc](./auto-git-commit.mdc)
**Purpose:** Automatic Git commits with conventional commit format
- Conventional commit format
- Automatic commit process
- Detailed commit messages
- Prompt analysis and reference
- Git history maintenance

## Rule Usage Guidelines

### When to Apply Rules
- **Always Apply:** Core development workflow, security practices
- **Context-Specific:** Component structure (Vue files), API design (server files)
- **Quality Gates:** Testing standards, code formatting

### Rule Dependencies
- Development workflow should be followed for all new features
- Security practices should be applied to all user-facing code
- Testing standards should be followed for all new functionality
- Code formatting should be applied to all code changes

### Rule Maintenance
- Rules should be updated when new patterns emerge
- Rules should be reviewed quarterly for relevance
- New rules should follow the established naming and structure patterns
- Rules should be cross-referenced when they relate to each other

## Getting Started

1. **For New Features:** Start with `development-workflow.mdc` and create specs in `specs/` folder
2. **For Vue Components:** Follow `VUE-component-structure.mdc`
3. **For API Development:** Use `api-design-standards.mdc`
4. **For Database Work:** Reference `database-schema-design.mdc`
5. **For Testing:** Apply `testing-standards.mdc`
6. **For Security:** Always follow `security-best-practices.mdc`

## Specification Management

- **Specs Location:** `specs/` folder (not `.cursor/scopes/`)
- **Spec Format:** Markdown (`.md`) files
- **Experimental Specs:** `specs/experimental/` subdirectory
- **Spec Template:** See `specs/README.md` for detailed guidelines

## Rule Enforcement

These rules are enforced through:
- Cursor IDE AI integration
- Pre-commit hooks
- CI/CD pipeline checks
- Code review processes
- Automated linting and formatting

---

*This index provides a comprehensive overview of all coding rules and standards for the Ratatouille project.*
