FROM mcr.microsoft.com/devcontainers/typescript-node:20

USER root

# CLI とグローバルツールをあらかじめインストールして postCreateCommand を不要にする
RUN npm install -g \
    npm@latest \
    typescript@5.3.3 \
    pnpm@8 \
    @openai/codex \
    @google/gemini-cli \
    @github/copilot

USER node
