# Code quality

Principles, lint and build gates, method design.

## Universal Code Quality Principles
- **Method Design**: Pass specific parameters instead of whole entities when possible
- **Self-Documenting Code**: Prefer clear naming and structure over comments
- **Error Handling**: Implement consistent, user-friendly error handling
- **Testing**: Maintain comprehensive test coverage appropriate to your role
- **Performance**: Consider scalability and performance implications
### Code Quality & Linting
- **MANDATORY**: Run `yarn lint` at the end of every development task
- **MANDATORY**: Run `yarn build` before pushing to ensure TypeScript compilation succeeds
- **Fix New Errors**: Address any linting errors introduced by your changes
- **Fix Build Errors**: Address any TypeScript compilation errors immediately
- **Acceptable Warnings**: Pre-existing warnings (like `@typescript-eslint/no-explicit-any`) are acceptable if not caused by your changes
- **Zero Tolerance**: Never introduce new linting errors or build failures - fix them immediately
- **Clean Commits**: Ensure all commits pass linting AND building before pushing

### Method Design & Parameter Passing
- **Don't pass whole entities unnecessarily**: When a method only needs specific properties from an entity, pass only those properties instead of the entire entity
- **Example**: Instead of `doSomething(card: CardEntity)`, prefer `doSomething(provider: CardProvider)` if only the provider is needed
- **Benefits**: Clearer method contracts, easier testing, reduced coupling, better maintainability
- **This makes methods more testable and reduces dependencies**
