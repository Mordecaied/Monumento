# Ralph Wiggum - Autonomous AI Agent for Monumento

Ralph Wiggum is an autonomous AI agent framework that enables feature development through fresh Claude Code instances per iteration, preventing context window degradation while maintaining accumulated knowledge.

## Quick Start

### 1. Create a PRD

```bash
cd scripts/ralph
cp prd.json.example prd.json
# Edit prd.json with your feature requirements
```

Or use the example Session Tags PRD:
```bash
cp prd-session-tags.json prd.json
```

### 2. Run Ralph

```bash
./ralph.sh run
```

### 3. Execute Iterations

When prompted, open [scripts/ralph/iteration-prompt.md](../scripts/ralph/iteration-prompt.md) in Claude Code and let it implement the user story.

### 4. Monitor Progress

```bash
./ralph.sh status
```

## What is Ralph?

Ralph implements a pattern where:
- ✅ Features are defined as **PRDs** with user stories and acceptance criteria
- ✅ Each story gets a **fresh Claude Code instance** (no context degradation)
- ✅ **Progress persists** via git commits and progress.txt
- ✅ **Quality gates** ensure code quality before commits
- ✅ **Knowledge accumulates** across iterations via progress.txt

## Why Use Ralph?

### Perfect For
- Multi-story feature development
- Complex features requiring multiple iterations
- When you want autonomous implementation with quality guardrails
- Features where maintaining context across long sessions is challenging

### Use Cases for Monumento
- **New Features**: Session tags, export functionality, advanced analytics
- **Refactoring**: Breaking down large refactors into safe, tested increments
- **API Integration**: Implementing new AI service integrations step-by-step
- **UI Components**: Building complex component systems with consistent quality

## Directory Structure

```
scripts/ralph/
├── ralph.sh                  # Main script (wrapper to global Ralph)
├── config.json               # Monumento-specific configuration
├── quality-check.sh          # Quality gates (type-check, lint, tests)
│
├── prd.json.example          # Template for creating new PRDs
├── prd-session-tags.json     # Example: Session tags feature
│
├── prd.json                  # Active PRD (gitignored)
├── progress.txt              # Learnings log (gitignored)
├── iteration-prompt.md       # Current iteration (gitignored)
└── archive/                  # Historical runs (gitignored)
```

## Commands

### Initialize Ralph (One-time per project)
```bash
# Already done for Monumento!
bash ~/.claude/ralph/core/init.sh
```

### Run Iterations
```bash
cd scripts/ralph
./ralph.sh run          # Run up to 10 iterations
./ralph.sh run 5        # Run up to 5 iterations
```

### Check Status
```bash
./ralph.sh status
```

Example output:
```
╔════════════════════════════════════════════════════════╗
║           Ralph Wiggum - Status Report           ║
╚════════════════════════════════════════════════════════╝

Project: Monumento MVP
Feature: Session Tags
Branch: feature/session-tags

Progress: 1/3 stories (33%)

[████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░]

✓ Complete:     1
○ Pending:      2
✗ Blocked:      0

User Stories:
  ✓ US-001 - Add tags to session creation
  ○ US-002 - Display tags on session cards
  ○ US-003 - Filter sessions by tag
```

### Get Help
```bash
./ralph.sh help
```

## Creating a PRD

### Structure

```json
{
  "project": "Monumento MVP",
  "feature": "Feature Name",
  "branch": "feature/branch-name",
  "userStories": [
    {
      "id": "US-001",
      "title": "As a [role], I want [goal] so that [benefit]",
      "description": "Detailed description",
      "acceptanceCriteria": [
        "Specific, testable criterion 1",
        "Specific, testable criterion 2"
      ],
      "status": "pending",
      "priority": "high|medium|low",
      "estimatedContextSize": "small|medium|large",
      "technicalNotes": "Any technical details"
    }
  ]
}
```

### Best Practices

#### Keep Stories Small
- **Small** (ideal): 1-3 files, 30-60 min, single clear objective
- **Medium** (acceptable): 3-5 files, 1-2 hours, related changes
- **Large** (split it!): 5+ files, > 2 hours - break into smaller stories

#### Write Clear Acceptance Criteria

✅ **Good:**
```json
"acceptanceCriteria": [
  "Session creation form includes tags input field",
  "Entering text and pressing Enter adds a tag",
  "Tags display as purple gradient badges",
  "Tags save to session.metadata.tags array",
  "TypeScript type-check passes",
  "Linting passes"
]
```

❌ **Bad:**
```json
"acceptanceCriteria": [
  "Tags work",
  "UI looks good"
]
```

#### Include Quality Gates
Always include these in acceptance criteria:
- TypeScript type checking passes
- Linting passes
- Tests written (if applicable)
- No regressions in existing features

## Quality Checks

Ralph enforces quality before commits via [scripts/ralph/quality-check.sh](../scripts/ralph/quality-check.sh):

### Frontend Checks
- ✅ TypeScript type checking: `npm run type-check`
- ✅ ESLint: `npm run lint`
- ✅ Tests: `npm test` (if configured)

### Backend Checks
- ⚠️ Backend compilation: Skipped (runs in VS Code Console)
- ✅ Tests: Can be enabled in quality-check.sh

### Customization

Edit [quality-check.sh](../scripts/ralph/quality-check.sh) to add project-specific checks:

```bash
# Add custom validation
log_info "Checking API schema..."
if ./scripts/validate-schema.sh; then
    log_success "API schema valid"
else
    log_error "API schema validation failed"
    FAILED=1
fi
```

## Iteration Workflow

### What Happens in an Iteration

1. **Ralph prepares**: Generates iteration prompt with story details
2. **You execute**: Open iteration-prompt.md in Claude Code
3. **Claude Code implements**: Reads prompt, implements story, runs quality checks
4. **Claude Code documents**: Appends learnings to progress.txt
5. **Claude Code signals**: Outputs `<promise>COMPLETE</promise>`
6. **Ralph validates**: Runs quality checks
7. **Ralph commits**: Creates git commit
8. **Ralph advances**: Moves to next story

### Progress Tracking

Ralph uses `progress.txt` to accumulate knowledge:

```
=== Iteration 1 | 2026-01-09 14:30 ===
[PATTERN] Session metadata uses JSONB, flexible for new fields
[GOTCHA] Backend runs in VS Code Console, not terminal
[SUCCESS] Tags feature implemented cleanly
[LEARNING] Always check existing components before creating new ones

<promise>COMPLETE</promise>

=== Iteration 2 | 2026-01-09 15:45 ===
[PATTERN] Session cards use consistent purple gradient badges
[SUCCESS] Tags display correctly
[LEARNING] Tailwind badge utilities already exist in design system

<promise>COMPLETE</promise>
```

Tag types:
- **[PATTERN]**: Architectural patterns discovered
- **[GOTCHA]**: Pitfalls or tricky behaviors
- **[SUCCESS]**: What worked well
- **[LEARNING]**: Key takeaways
- **[BLOCKED]**: Blocking issues (if any)

## Handling Blockers

If Claude Code encounters a blocker:

```
=== Iteration 3 | 2026-01-09 16:00 ===
[BLOCKED] Backend API doesn't support tag filtering
[REASON] GET /api/v1/sessions needs ?tag= query parameter
[NEEDS] Add backend endpoint support or use client-side filtering

<promise>BLOCKED: Missing backend API support</promise>
```

Ralph will:
1. Update story status to "blocked"
2. Stop iteration loop
3. Wait for you to resolve

## Monumento-Specific Configuration

Ralph is configured for Monumento with:

### Tech Stack
- React 19 + TypeScript
- Tailwind CSS (purple gradient design system)
- Spring Boot 3.x
- PostgreSQL with JSONB metadata

### Context Documents
- [docs/CLAUDE.md](CLAUDE.md) - Complete project guide
- [docs/architecture/system-design.md](architecture/system-design.md) - Architecture

### Skills
- [skills/ui-design.md](../skills/ui-design.md) - UI design system and patterns

### Special Notes
- Backend runs via VS Code Spring Boot Console (not terminal)
- Quality checks skip backend compilation
- Metadata fields use PostgreSQL JSONB

## Example PRD: Session Tags

See [scripts/ralph/prd-session-tags.json](../scripts/ralph/prd-session-tags.json) for a complete example PRD with 3 user stories:

1. **US-001**: Add tags to session creation
2. **US-002**: Display tags on session cards
3. **US-003**: Filter sessions by tag

This PRD demonstrates:
- ✅ Small, focused user stories
- ✅ Clear acceptance criteria
- ✅ Incremental feature development
- ✅ Quality gates in every story

## Tips for Success

### 1. Start Small
Begin with a simple 2-3 story feature to get familiar with Ralph.

### 2. Trust the Process
Each iteration focuses on ONE story. Resist the urge to do more.

### 3. Document Immediately
Don't batch learnings - document as you discover patterns.

### 4. Quality is Non-Negotiable
Never skip quality checks. Fix issues before marking complete.

### 5. Review Progress
Run `./ralph.sh status` frequently to track progress.

### 6. Archive When Done
When feature is complete, Ralph automatically archives the run.

## Troubleshooting

### "jq: command not found"
Install jq for JSON processing:
- **Windows**: Download from https://stedolan.github.io/jq/download/
- **macOS**: `brew install jq`
- **Linux**: `sudo apt-get install jq`

### "No completion signal found"
Claude Code must output `<promise>COMPLETE</promise>` in progress.txt.

Check:
- Did iteration finish?
- Is progress.txt updated?
- Does it contain the completion signal?

### Quality checks failing
Run checks manually to see details:
```bash
cd scripts/ralph
./quality-check.sh
```

### Stories not updating
Verify PRD JSON is valid:
```bash
jq empty scripts/ralph/prd.json
```

## Advanced Usage

### Multiple Features
Create separate PRDs for different features:
```bash
# Feature 1: Session Tags
cp prd-session-tags.json prd.json
./ralph.sh run

# Archive, then Feature 2: Export PDF
cp prd-export-pdf.json prd.json
./ralph.sh run
```

### Custom Quality Gates
Add Monumento-specific checks to quality-check.sh:
- API schema validation
- Database migration checks
- Integration test suites

### Branch Management
Ralph works best with feature branches:
```bash
git checkout -b feature/session-tags
cd scripts/ralph
cp prd-session-tags.json prd.json
./ralph.sh run
```

## Resources

- **Global Ralph Docs**: `~/.claude/ralph/README.md`
- **PRD Management Guide**: `~/.claude/ralph/skills/prd-management.md`
- **Ralph Behavior Guide**: `~/.claude/ralph/skills/ralph-behavior.md`
- **Monumento Context**: [docs/CLAUDE.md](CLAUDE.md)
- **Design System**: [skills/ui-design.md](../skills/ui-design.md)

---

**Happy autonomous coding with Ralph! 🤖**

For questions or issues, refer to the global Ralph documentation or create an issue in the project repository.
