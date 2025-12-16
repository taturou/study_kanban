# ベースは Node.js 20 の devcontainer イメージ
FROM mcr.microsoft.com/devcontainers/typescript-node:20

# プロキシ経由のビルドに使うオプション（未設定なら空のまま）
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

USER root

# パッケージをインストール
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl git language-pack-ja less locales lv tree vim

# グローバルに利用する CLI 群をインストール
RUN npm_config_proxy=$HTTP_PROXY npm_config_https_proxy=$HTTPS_PROXY npm_config_noproxy=$NO_PROXY \
    npm install -g \
    npm@latest \
    typescript@5.3.3 \
    pnpm@8 \
    @openai/codex \
    @google/gemini-cli \
    @github/copilot \
    @githubnext/github-copilot-cli

# GitHub CLI を apt 経由で追加
RUN http_proxy=$HTTP_PROXY https_proxy=$HTTPS_PROXY no_proxy=$NO_PROXY \
    apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl gnupg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor -o /etc/apt/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends gh && \
    rm -rf /var/lib/apt/lists/*

# ロケールを日本語に設定
RUN sed -i '/^# *ja_JP.UTF-8/s/^# *//' /etc/locale.gen && \
    locale-gen && \
    rm -rf /var/lib/apt/lists/*
ENV LANG=ja_JP.UTF-8
ENV LC_ALL=ja_JP.UTF-8

# Kiro スタイルの cc-sdd プロンプトをコンテナ内に展開
ENV CCSDD_TEMP=/tmp/cc-sdd
RUN rm -rf ${CCSDD_TEMP} && mkdir -p ${CCSDD_TEMP} && \
    npm_config_proxy=$HTTP_PROXY npm_config_https_proxy=$HTTPS_PROXY npm_config_noproxy=$NO_PROXY \
    /bin/bash -lc "cd ${CCSDD_TEMP} && npx cc-sdd@latest --codex --lang ja" && \
    mkdir -p /home/node/.codex/prompts && \
    cp -a ${CCSDD_TEMP}/.codex/prompts/. /home/node/.codex/prompts && \
    rm -rf ${CCSDD_TEMP}

USER node
