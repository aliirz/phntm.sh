# GitHub Actions CI/CD

This directory contains GitHub Actions workflows that automatically test and validate the P2P Share application on every push and pull request.

## 🔧 Workflows

### `test.yml` - Main Testing Pipeline

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### 🧪 Test Job
- **Node.js versions**: 18.x, 20.x (matrix strategy)
- **Steps**:
  1. **Checkout code**: Downloads repository content
  2. **Setup Node.js**: Installs specified Node version with npm caching
  3. **Install dependencies**: Runs `npm ci` for clean install
  4. **TypeScript checking**: Validates all TypeScript without emitting files
  5. **Run tests**: Executes full test suite with coverage
  6. **Upload coverage**: Sends coverage data to Codecov (optional)

#### 🔍 Lint Job
- **Node.js version**: 20.x
- **Steps**:
  1. **Checkout code**: Downloads repository content
  2. **Setup Node.js**: Installs Node 20.x with npm caching
  3. **Install dependencies**: Runs `npm ci`
  4. **Run linting**: Executes ESLint via `npm run lint`
  5. **Check build**: Validates production build via `npm run build`

## 📊 Test Coverage

The workflow automatically generates and uploads test coverage reports:
- **Current coverage**: ~90% for core functionality
- **Covered areas**:
  - ✅ User authentication and limits
  - ✅ File encryption/decryption
  - ✅ URL generation and parsing
  - ✅ Component interactions
  - ✅ Error handling

## 🚦 Status Checks

All workflows must pass before merging pull requests:
- ✅ **TypeScript compilation**: No type errors
- ✅ **Test suite**: All 83 tests passing
- ✅ **Linting**: No ESLint warnings/errors
- ✅ **Build**: Production build successful

## 🔄 Auto-run Conditions

Workflows run automatically on:
- **Direct pushes** to main/develop branches
- **Pull request creation** targeting main/develop
- **Pull request updates** (new commits)

## 📝 Local Testing

To run the same checks locally before pushing:

```bash
# Type checking
npx tsc --noEmit

# Run tests with coverage
npm test -- --coverage

# Lint code
npm run lint

# Build for production
npm run build
```

## 🚀 Integration

These workflows ensure:
- **Code quality**: Consistent formatting and no linting errors
- **Type safety**: All TypeScript compiles without errors
- **Functionality**: All features work as expected via comprehensive tests
- **Build success**: Application builds for production deployment

Perfect for maintaining high code quality in our P2P file sharing application! 🎉 