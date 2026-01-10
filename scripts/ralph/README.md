# Ralph Wiggum - Project Configuration

## Quick Start (Windows)

**Easiest Way - Double-Click Batch Files:**

1. Double-click `setup-prd.bat` to create a PRD
2. Edit `prd.json` with your feature requirements
3. Double-click `ralph-run.bat` to start Ralph
4. Double-click `ralph-status.bat` to check progress

**Command Line:**

1. Create a PRD from the example:
   ```bash
   cp prd.json.example prd.json
   ```

2. Edit `prd.json` with your feature's user stories

3. Run Ralph:
   ```bash
   ./ralph.sh run
   ```

## Files

**Batch Files (Windows - Double-Click to Run):**
- `setup-prd.bat` - Create a new PRD (interactive menu)
- `ralph-run.bat` - Start Ralph iteration loop
- `ralph-status.bat` - Check current progress
- `ralph.bat` - General Ralph launcher (accepts commands)

**Shell Scripts (Git Bash / Linux / macOS):**
- `ralph.sh` - Main Ralph script (run, status, help)
- `quality-check.sh` - Quality gates before commits

**Configuration & Data:**
- `prd.json` - Active product requirements document (create from example)
- `prd.json.example` - Template for creating new PRDs
- `prd-session-tags.json` - Example: Session Tags feature
- `config.json` - Monumento-specific configuration
- `progress.txt` - Accumulated learnings (auto-generated, gitignored)
- `iteration-prompt.md` - Current iteration prompt (auto-generated, gitignored)
- `archive/` - Historical run data (gitignored)

## Quality Checks

Edit `quality-check.sh` to customize quality gates for your project.
Default checks include:
- TypeScript type checking
- Linting
- Unit tests
- Backend compilation

## Documentation

See global Ralph docs: ~/.claude/ralph/README.md
