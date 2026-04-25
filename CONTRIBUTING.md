# Contributing to OpenTrails

Thank you for your interest in contributing to OpenTrails! We welcome contributions from the community and appreciate your help in making this project better.

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to contact@opentrails.dev.

## Getting Started

### 1. Fork & Clone
```bash
git clone https://github.com/YOUR-USERNAME/opentrails.git
cd opentrails
git remote add upstream https://github.com/opentrails/opentrails.git
```

### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
# or: git checkout -b fix/your-bug-fix
```

### 3. Set Up Development Environment
```bash
# Install dependencies
cd app && npm install
cd ../api && npm install

# Ensure Node.js 20+
node --version
```

## Development Workflow

### Before You Code
1. Check [open issues](https://github.com/opentrails/opentrails/issues) to see if someone is already working on it
2. Create a new issue for features/bugs you want to work on
3. Discuss your approach in the issue before major refactors

### While Coding
1. **Follow the style guide**
   - Use TypeScript for new code
   - Follow existing naming conventions
   - Format with Prettier (automatic on commit)

2. **Keep changes focused**
   - One feature or fix per PR
   - Smaller, focused commits are better than one massive commit

3. **Write tests**
   - Add Playwright tests for UI changes
   - Test API changes with curl or similar tools
   - Aim for >80% coverage on critical paths

4. **Update documentation**
   - Update README.md if you change API or feature
   - Add comments for complex logic
   - Update ARCHITECTURE.md for structural changes

### Testing Locally

```bash
# Frontend tests
cd app
npm exec playwright test
npm exec tsc --noEmit          # Type check

# API tests
cd api
npm start
# In another terminal:
curl http://localhost:3001/api/health
curl http://localhost:3001/api/trails?limit=5
```

## Making a Pull Request

### Before Submitting
- [ ] Your changes are on a feature branch
- [ ] Code follows project style (TypeScript, naming conventions)
- [ ] Tests pass locally (`npm exec playwright test`)
- [ ] TypeScript has no errors (`npm exec tsc --noEmit`)
- [ ] Commit messages are clear and descriptive
- [ ] You've reviewed your own changes for obvious issues

### PR Checklist
1. **Title**: Clear, concise description (e.g., "feat: add trail filters", "fix: search not working")
2. **Description**: 
   - What problem does this solve?
   - How did you test it?
   - Screenshots (for UI changes)
   - Link to related issue
3. **Type**: Mark as `feat`, `fix`, `docs`, `test`, `refactor`, etc.

### Example PR Title
```
feat: add trail difficulty filtering
fix: API timeout on large requests
docs: update deployment instructions
```

### What Reviewers Will Check
- ✅ Code quality and TypeScript types
- ✅ Tests pass and coverage is adequate
- ✅ No breaking changes to existing features
- ✅ Documentation is updated
- ✅ Performance isn't negatively impacted

## Code Style

### TypeScript/JavaScript
```typescript
// Use descriptive names
const handleTrailSearch = (query: string) => {
  // Prefer const, avoid var
  const results = trails.filter(trail => 
    trail.name.toLowerCase().includes(query.toLowerCase())
  );
  return results;
};

// Comments for non-obvious logic
// Convert meters to miles for display
const distanceMiles = trail.length_meters / 1609.34;

// Use meaningful variable names
const hasEasyDifficulty = trail.difficulty === 'Easy';
```

### React Components
```typescript
interface TrailCardProps {
  trail: TrailFeature;
  onPress: () => void;
  isFavorite?: boolean;
}

export const TrailCard: React.FC<TrailCardProps> = ({ 
  trail, 
  onPress, 
  isFavorite = false 
}) => {
  // Component body
};
```

## Commit Message Format

```
<type>: <subject>

<body>

Fixes #<issue-number>
```

### Types
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Formatting, no code logic changes
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Build, dependencies, etc.

### Example
```
feat: add trail ratings and reviews

- Add star rating display on trail cards
- Store ratings in database
- Show recent reviews on detail page

Fixes #123
```

## Project Structure

When adding files, follow the existing structure:

```
# React Components
app/src/components/MyComponent.tsx
app/src/components/index.ts (export your component)

# Types
app/src/types/trail.ts

# API files
api/my-endpoint.js

# Tests
app/tests/my-feature.spec.ts

# Documentation
docs/my-feature.md
```

## Common Contributions

### Adding a New Trail Data Source
1. Add import script in `api/import-*.js`
2. Update `api/index.js` to use it
3. Test with sample data
4. Document in README.md

### Fixing a Bug
1. Create a test that reproduces the bug
2. Fix the code
3. Verify the test passes
4. Add test to prevent regression

### Adding a UI Feature
1. Create the component in `app/src/components/`
2. Add props documentation
3. Create Playwright test
4. Export from `app/src/components/index.ts`
5. Update `app/App.tsx` to use it

### Improving Documentation
1. Clear explanations
2. Code examples
3. Link related docs
4. Keep tone friendly and inclusive

## Review Process

1. **Initial Review** (24-48 hours)
   - Style and code quality check
   - Tests must pass

2. **Functional Review** (1-2 days)
   - Does the feature work as intended?
   - Are there edge cases?

3. **Merge**
   - Squash and merge for clean history
   - Automatic deploy to staging/production

## Reporting Issues

### Bug Reports
Include:
- Clear title
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (browser, OS, Node version)
- Screenshots/logs

### Feature Requests
Include:
- Clear description of the feature
- Why it's needed
- Example use cases
- Possible implementation approach

## Questions?

- 💬 Ask in [GitHub Discussions](https://github.com/opentrails/opentrails/discussions)
- 📧 Email: contact@opentrails.dev
- 🐛 Open an [issue](https://github.com/opentrails/opentrails/issues)

## Recognition

Contributors are recognized in:
- README.md Contributors section
- Release notes
- GitHub contributors page

Thank you for making OpenTrails better! 🥾
