# Scrollcraft / design-dna toolchain env. Source it once per shell:
#   source ./tools/env.sh
# Portable Node (if using standalone binary) or standard system Node.
# Playwright browser lives in scrollcraft/.browsers (project-local).

if [ -d "/tmp/opencode/node-v22.18.0-linux-x64/bin" ]; then
  export PATH="/tmp/opencode/node-v22.18.0-linux-x64/bin:$PATH"
fi

export PLAYWRIGHT_BROWSERS_PATH="$PWD/scrollcraft/.browsers"
export SCROLLCRAFT_CHROME="$PWD/scrollcraft/.browsers/chromium-1248/chrome-linux64/chrome"
# Optional: export KIE_AI_API_KEY="..."  # only for AI-generated imagery
# Optional: export SCROLLCRAFT_HOME="..." # default: <project root>/scrollcraft
