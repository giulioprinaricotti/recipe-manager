# Documentation and process templates

Documentation maintenance and how the role/template system is meant to be used.

## Documentation Maintenance
When implementing features, always update domain knowledge in `business-knowledge-base.md` and execution patterns in role-specific documents if new learnings emerge.

## How to Use This System

### For Complex Features & Multi-Step Development
1. **Always start here**: Read AGENTS.md (this file) for universal principles
2. **Identify your role**: Determine which phase you're in (PRD, development, or review)
3. **Read role document**: Read the appropriate role-specific document
4. **Reference domain knowledge**: Consult `business-knowledge-base.md` for SpendSync-specific context
5. **Execute with focus**: Apply both universal principles and role-specific guidelines

### For Small Tasks & Quick Fixes
**Use `docs/prp-templates/quick-context-template.md` when:**
- **Bug fixes and hotfixes**: Single-issue corrections
- **Minor improvements**: Small enhancements to existing functionality
- **Configuration changes**: Environment, dependency, or setting updates
- **Documentation updates**: README, comments, or doc file changes
- **Single-file modifications**: Changes contained to one file
- **Maintenance tasks**: Cleanup, refactoring within single module

**Do NOT use quick-context-template for:**
- **New features**: Anything requiring new functionality
- **Multi-module changes**: Changes affecting multiple parts of the system
- **Provider integrations**: Airwallex/Revolut API modifications
- **Database schema changes**: New tables, columns, or migrations
- **Business logic changes**: Modifications to core business rules
- **Architecture changes**: Structural or pattern **modifications**
