# Ralph Wiggum - Project Configuration

## Quick Start

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

- `prd.json` - Active product requirements document (create from example)
- `prd.json.example` - Template for creating new PRDs
- `progress.txt` - Accumulated learnings (auto-generated during runs)
- `iteration-prompt.md` - Current iteration prompt (auto-generated)
- `quality-check.sh` - Quality gates before commits (customize as needed)
- `config.json` - Project configuration
- `archive/` - Historical run data

## Quality Checks

Edit `quality-check.sh` to customize quality gates for your project.
Default checks include:
- TypeScript type checking
- Linting
- Unit tests
- Backend compilation

## Documentation

See global Ralph docs: ~/.claude/ralph/README.md
