# Create PRD Skill

This skill guides you in generating Product Requirements Documents (PRDs) for Ralph Wiggum from high-level feature requests.

## When to Use This Skill

Use this skill when a user asks you to:
- "Create a PRD for [feature]"
- "Write user stories for [feature]"
- "Help me plan [feature] implementation"
- "Set up Ralph for [feature]"

## PRD Generation Process

### Step 1: Understand the Feature

Ask clarifying questions if needed:
- What is the user trying to accomplish?
- What are the acceptance criteria?
- Are there any technical constraints?
- What is the priority (high/medium/low)?

### Step 2: Break Down into User Stories

Guidelines:
- **Small stories** (ideal): 1-3 files, 30-60 min, single objective
- **Medium stories** (acceptable): 3-5 files, 1-2 hours
- **Large stories** (split!): > 5 files or > 2 hours

### Step 3: Write Clear Acceptance Criteria

Each criterion should be:
- **Specific**: No vague terms like "works well"
- **Testable**: Can be verified
- **Complete**: Includes quality gates

Format:
```
"Given [context], when [action], then [result]"
```

### Step 4: Add Technical Context

Include:
- Files likely to be modified
- Existing patterns to follow
- Technical constraints
- Dependencies

### Step 5: Generate PRD JSON

Use this template:

```json
{
  "project": "Monumento MVP",
  "feature": "[Feature Name]",
  "branch": "feature/[branch-name]",
  "userStories": [
    {
      "id": "US-001",
      "title": "As a [role], I want [goal] so that [benefit]",
      "description": "Detailed description of what needs to be implemented",
      "acceptanceCriteria": [
        "Specific, testable criterion 1",
        "Specific, testable criterion 2",
        "TypeScript type checking passes (npm run type-check)",
        "Linting passes (npm run lint)"
      ],
      "status": "pending",
      "priority": "high|medium|low",
      "estimatedContextSize": "small|medium|large",
      "technicalNotes": "Files: VirtualStudio.tsx, SessionService.ts. Follow existing form input patterns."
    }
  ],
  "technicalContext": {
    "frontend": "React 19 + TypeScript + Tailwind CSS",
    "backend": "Spring Boot 3.x + PostgreSQL",
    "database": "PostgreSQL with JSONB metadata",
    "designSystem": "Purple gradient theme (see skills/ui-design.md)",
    "specialNotes": "Backend runs via VS Code Spring Boot Console"
  },
  "qualityStandards": {
    "typeChecking": "npm run type-check must pass",
    "linting": "npm run lint must pass",
    "testing": "Manual testing required, unit tests if time permits",
    "documentation": "Update docs if new components created"
  }
}
```

## Example: PDF Export Feature

**User Request**: "I want users to be able to export their podcast session to PDF"

**Generated PRD**:

```json
{
  "project": "Monumento MVP",
  "feature": "PDF Export",
  "branch": "feature/pdf-export",
  "userStories": [
    {
      "id": "US-001",
      "title": "As a user, I want an export button on session detail page so that I can export my session",
      "description": "Add an 'Export PDF' button to the SessionDetail component that triggers PDF generation",
      "acceptanceCriteria": [
        "SessionDetail component shows 'Export PDF' button below session metadata",
        "Button uses purple gradient styling consistent with design system",
        "Clicking button triggers PDF generation (placeholder for now)",
        "Button is disabled while session is still recording",
        "TypeScript type checking passes",
        "Linting passes"
      ],
      "status": "pending",
      "priority": "high",
      "estimatedContextSize": "small",
      "technicalNotes": "Files: SessionDetail.tsx. Follow existing button patterns in VirtualStudio.tsx for styling."
    },
    {
      "id": "US-002",
      "title": "As a user, I want my session transcript included in the PDF so that I have a complete record",
      "description": "Implement PDF generation using a library like jsPDF, including session metadata and message transcript",
      "acceptanceCriteria": [
        "PDF includes session title, vibe, duration, and date",
        "PDF includes full message transcript with timestamps",
        "PDF is formatted with Monumento branding (purple theme)",
        "PDF downloads automatically with filename: 'monumento-session-[id].pdf'",
        "All quality checks pass"
      ],
      "status": "pending",
      "priority": "high",
      "estimatedContextSize": "medium",
      "technicalNotes": "Install jsPDF library. Create new util/pdfGenerator.ts. Reference session and message data from SessionDetail props."
    },
    {
      "id": "US-003",
      "title": "As a user, I want a loading indicator while PDF generates so that I know the export is in progress",
      "description": "Show loading state during PDF generation to improve UX",
      "acceptanceCriteria": [
        "Button shows loading spinner and 'Generating PDF...' text during generation",
        "Button is disabled during generation",
        "Success message appears when PDF is ready",
        "Error handling if PDF generation fails",
        "All quality checks pass"
      ],
      "status": "pending",
      "priority": "medium",
      "estimatedContextSize": "small",
      "technicalNotes": "Use React state for loading. Follow existing loading patterns in VirtualStudio.tsx."
    }
  ],
  "technicalContext": {
    "frontend": "React 19 + TypeScript + Tailwind CSS",
    "backend": "Spring Boot 3.x + PostgreSQL",
    "libraries": "Will need: jsPDF for PDF generation",
    "designSystem": "Purple gradient theme",
    "specialNotes": "PDF generation happens client-side, no backend needed"
  },
  "qualityStandards": {
    "typeChecking": "npm run type-check must pass",
    "linting": "npm run lint must pass",
    "testing": "Manual testing with various session sizes",
    "documentation": "Add usage docs to DEMO_GUIDE.md"
  }
}
```

## Story Breakdown Examples

### Too Large (Split It)
❌ **Bad**: "Build complete export system with PDF, audio, and email delivery"
- Why: Too many features, 10+ files, > 4 hours
- Fix: Split into 3 separate PRDs (PDF export, Audio export, Email delivery)

### Just Right
✅ **Good**: "Add export PDF button and basic PDF generation"
- Why: Focused, 2-3 files, ~2 hours, clear scope

### Too Small (Combine)
⚠️ **Okay but inefficient**: "Add button", "Style button", "Wire up click handler"
- Why: Each is trivial, could be combined
- Better: "Add styled export button with click handler"

## Common Patterns for Monumento

### UI Features
1. **US-001**: Add UI component/button
2. **US-002**: Implement core functionality
3. **US-003**: Add loading/error states

### Backend Integration
1. **US-001**: Add backend endpoint
2. **US-002**: Create frontend service
3. **US-003**: Integrate with UI

### Data Features
1. **US-001**: Add database field/migration
2. **US-002**: Update backend DTOs and services
3. **US-003**: Update frontend to use new field

## Technical Notes Guidelines

Good technical notes include:
- **Files**: "VirtualStudio.tsx, SessionService.ts"
- **Patterns**: "Follow existing form input patterns in VirtualStudio"
- **Dependencies**: "Requires session.metadata structure from US-001"
- **Constraints**: "Must work with existing JSONB metadata column"

Bad technical notes:
- ❌ "Make it work"
- ❌ "Use React"
- ❌ "TBD"

## Validation Checklist

Before finalizing a PRD, check:

- [ ] Each story has clear title in user story format
- [ ] Acceptance criteria are specific and testable
- [ ] Quality gates included in every story
- [ ] Stories are appropriately sized (small/medium)
- [ ] Technical notes provide implementation guidance
- [ ] Priority and context size are set
- [ ] Branch name follows convention (feature/name)
- [ ] Technical context matches Monumento stack

## Saving the PRD

1. Generate the PRD JSON
2. Save to `scripts/ralph/prd-[feature-name].json`
3. Inform user they can copy it to `prd.json` to start:
   ```bash
   cd scripts/ralph
   cp prd-[feature-name].json prd.json
   ./ralph.sh run
   ```

## Example User Interaction

**User**: "I want to add a feature to let users favorite sessions"

**Your Response**:

I'll create a PRD for the favorites feature. This breaks down into 3 user stories:

1. **US-001**: Add favorite button to session cards
2. **US-002**: Save favorite status to user preferences
3. **US-003**: Add favorites filter to history view

Creating PRD at [scripts/ralph/prd-favorites.json](../scripts/ralph/prd-favorites.json)...

[Generate and save PRD]

I've created a PRD for the favorites feature. To start implementing:

```bash
cd scripts/ralph
cp prd-favorites.json prd.json
./ralph.sh run
```

This will implement the feature story-by-story with quality checks at each step.

---

Use this skill to help users translate feature ideas into actionable, Ralph-ready PRDs.
