#!/bin/bash
# Wrapper to global Ralph
RALPH_GLOBAL="$HOME/.claude/ralph/core/ralph.sh"
exec bash "$RALPH_GLOBAL" "$@"
