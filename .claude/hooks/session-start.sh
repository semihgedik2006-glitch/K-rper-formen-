#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code on the web environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

ECC_DIR="/tmp/ECC"

# Skip if already installed in this container
if [ -d "$ECC_DIR" ] && [ -f "$ECC_DIR/.installed" ]; then
  exit 0
fi

echo "Installing ECC (agent harness OS)..."

# Clone ECC repository
if [ -d "$ECC_DIR" ]; then
  rm -rf "$ECC_DIR"
fi

git clone --depth=1 https://github.com/affaan-m/ECC.git "$ECC_DIR"

cd "$ECC_DIR"

# Install npm dependencies if package.json exists
if [ -f "package.json" ]; then
  npm install --prefer-offline 2>/dev/null || npm install
fi

# Install agents
if [ -d "agents" ]; then
  mkdir -p ~/.claude/agents
  cp agents/*.md ~/.claude/agents/
  echo "Installed $(ls agents/*.md | wc -l) ECC agents"
fi

# Install rules (common + typescript + python)
mkdir -p ~/.claude/rules/ecc
for ruleset in common typescript python; do
  if [ -d "rules/$ruleset" ]; then
    cp -r "rules/$ruleset" ~/.claude/rules/ecc/
    echo "Installed rules/$ruleset"
  fi
done

# Install skills if present
if [ -d "skills" ]; then
  mkdir -p ~/.claude/skills
  cp -r skills/* ~/.claude/skills/ 2>/dev/null || true
  echo "Installed ECC skills"
fi

touch "$ECC_DIR/.installed"
echo "ECC installation complete."
