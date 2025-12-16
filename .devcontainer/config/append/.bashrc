#-------------------------------------------------
# .bashrc をカスタマイズするためのスクリプト
# コンテナ起動時に ~/.bashrc に追記される
#-------------------------------------------------
# Gitのプロンプト関数が利用可能かチェック
if [ -f /etc/bash_completion.d/git-prompt ]; then
    . /etc/bash_completion.d/git-prompt
fi

# PS1 の設定
export PS1='$(__git_ps1 "[%s]") \$ '

# ls コマンドのエイリアス
alias la='ls -aF --show-control-chars --color=auto'
alias ll='ls -lF --show-control-chars --color=auto'
alias lla='ls -laF --show-control-chars --color=auto'

# git
export GIT_PAGER='lv -c'
alias gitb='git b'
alias gits='git s'
alias gitd='git d'
alias gitl='git l'
alias gitls='git ls'
