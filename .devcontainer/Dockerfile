FROM mcr.microsoft.com/devcontainers/typescript-node:20

USER root

# CLI とグローバルツールをあらかじめインストールして postCreateCommand を不要にする
RUN npm install -g \
    npm@latest \
    typescript@5.3.3 \
    pnpm@8 \
    @openai/codex \
    @google/gemini-cli \
    @github/copilot \
    @githubnext/github-copilot-cli && \
    apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl gnupg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor -o /etc/apt/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends gh && \
    rm -rf /var/lib/apt/lists/*

USER node
