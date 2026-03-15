#!/bin/bash
# Universal Memory Skill - Global Installation Script
# This script installs the skill to a global location and initializes global memory.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_NAME="Universal Memory"
GLOBAL_SKILL_DIR="$HOME/.trae/skills/$SKILL_NAME"

echo "🚀 Installing Universal Memory Skill..."

# Create global skill directory
mkdir -p "$GLOBAL_SKILL_DIR"

# Copy skill files (excluding .mnemonic_data which is project-specific)
echo "📦 Copying skill files to $GLOBAL_SKILL_DIR..."
cp -r "$SCRIPT_DIR/scripts" "$GLOBAL_SKILL_DIR/"
cp "$SCRIPT_DIR/SKILL.md" "$GLOBAL_SKILL_DIR/"

# Initialize global memory
echo "🔧 Initializing global memory..."
python3 "$GLOBAL_SKILL_DIR/scripts/memory_cli.py" init-global

# Make CLI executable
chmod +x "$GLOBAL_SKILL_DIR/scripts/memory_cli.py"

echo ""
echo "✅ Universal Memory Skill installed successfully!"
echo ""
echo "📁 Global skill location: $GLOBAL_SKILL_DIR"
echo "📁 Global memory location: $HOME/.mnemonic/"
echo ""
echo "Usage:"
echo "  # Initialize project memory (run in project directory)"
echo "  python3 \"$GLOBAL_SKILL_DIR/scripts/memory_cli.py\" init-project"
echo ""
echo "  # Remember a global preference"
echo "  python3 \"$GLOBAL_SKILL_DIR/scripts/memory_cli.py\" remember \"Your preference\" --type preference"
echo ""
echo "  # Search memories"
echo "  python3 \"$GLOBAL_SKILL_DIR/scripts/memory_cli.py\" search \"query\""
echo ""
echo "  # Migrate legacy data (if any)"
echo "  python3 \"$GLOBAL_SKILL_DIR/scripts/memory_cli.py\" migrate"
