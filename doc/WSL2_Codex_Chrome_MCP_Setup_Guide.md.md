# WSL2 (Codex CLI) から Windows Chrome への MCP 接続確立技術レポート

## 1. 概要

**目的:** WSL2 上で動作する Codex CLI (MCP Client) から、Windows 11 ホスト上で動作する Google Chrome を `chrome-devtools-mcp` 経由で操作し、ブラウザ操作の自動化を実現する。

**環境:**

* **OS:** Windows 11 Pro / WSL2 (Ubuntu)
* **Network:** Azure VPN 接続環境下
* **Security:** Digital Arts (i-FILTER) 社内プロキシ、Enterprise Firewall ポリシー適用済み

## 2. ネットワーク環境特有の課題 (Azure VPN / Corporate Proxy)

本環境における接続確立の難易度が高かった主な原因は、以下の企業ネットワーク特性にある。

1. **社内プロキシ (Digital Arts) による遮断**
* **現象:** ローカル IP (`172.x.x.x`) への通信であっても、プロキシ設定が有効だと強制的に社内プロキシサーバーを経由しようとする。結果、プロキシサーバーが「不明な社内サイト」としてブロック画面 (HTML) を返す。
* **対策:** 環境変数 `no_proxy` に Windows ホストの動的 IP を明示的に追加する必要がある。


2. **Azure VPN / Firewall の厳格なポリシー**
* **現象:** VPN 接続中は「パブリックネットワーク」や「識別されていないネットワーク (WSL)」からの着信が厳しく制限される。`Allow Profile=Any` のような単純なルールではブロックされる場合がある。
* **対策:** WSL アダプタのインターフェース名 (`InterfaceAlias`) を特定し、そのインターフェースからの通信のみを許可する強力なルールを作成する。



---

## 3. 最終解決策 (Golden Configuration)

### Step 1: Windows 側 - Chrome のデバッグ起動

既存の Chrome プロセスとの干渉を防ぎ、外部接続を受け入れる状態で起動する。

**起動用ショートカットの作成:**

* **リンク先:**
```cmd
"C:\Users\USERNAME\AppData\Local\Google\Chrome SxS\Application\chrome.exe" --remote-debugging-port=60053 --user-data-dir="%TEMP%\chrome_debug_mcp" --remote-allow-origins=* --no-first-run --no-default-browser-check

```


* `--remote-allow-origins=*`: MCP ツールからの WebSocket 接続許可に必須。
* `--user-data-dir`: 普段使いの Chrome とプロファイルを分離するために必須。



### Step 2: Windows 側 - ファイアウォール設定

WSL2 からの通信を通すため、WSL 用アダプターを特定して穴あけを行う。

**1. インターフェース名の特定 (PowerShell 管理者):**
環境によって名前が異なるため、まずは正確な名前を調べる。

```powershell
Get-NetAdapter | Where-Object Name -like "*WSL*" | Select-Object Name, InterfaceDescription, Status

```

*(出力例: `vEthernet (WSL (Hyper-V firewall))` などの名前をコピーする)*

**2. ルールの適用 (PowerShell 管理者):**

```powershell
# 設定: 上記で確認したアダプター名を入力
$wslInterfaceName = "vEthernet (WSL (Hyper-V firewall))"

# 既存ルールのクリーンアップ
Remove-NetFirewallRule -DisplayName "WSL Chrome Debug" -ErrorAction SilentlyContinue

# 新規ルールの作成 (WSLインターフェース限定)
New-NetFirewallRule -DisplayName "WSL Chrome Debug" `
    -Direction Inbound `
    -InterfaceAlias $wslInterfaceName `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 60053

```

### Step 3: WSL2 側 - ネットワーク・プロキシ設定

Windows 側の IP アドレスは再起動ごとに変わるため、動的に取得して環境変数にセットする。

**`~/.bashrc` (または `.zshrc`) への追記:**

```bash
# --- WSL2 to Windows Chrome Debug Settings ---
# WindowsホストのIPを動的に取得 (Default Gateway)
export winhost=$(ip route show | grep default | awk '{print $3}')

# 社内プロキシ除外設定
# winhost への通信はプロキシを通さない (Digital Arts ブロック回避)
export no_proxy="${no_proxy},${winhost}"
export NO_PROXY="${NO_PROXY},${winhost}"
# ---------------------------------------------

```

### Step 4: Codex 設定 (`.codex/config.toml`)

MCP サーバー起動時に、動的に取得した IP アドレスを引数として渡す。

```toml
[mcp_servers.chrome-devtools]
command = "bash"
args = [
    "-c",
    "npx chrome-devtools-mcp@latest --browserUrl=http://$(ip route show | grep default | awk '{print $3}'):60053"
]
# Node.js プロセスにもプロキシ除外を強制
env = { NO_PROXY = "*" }

```

---

## 4. トラブルシューティング履歴 (NGパターン)

### 4.1. Docker コンテナからの直接接続 (廃案)

* **試行:** Docker (DevContainer) から `host.docker.internal` で接続。
* **結果:** 失敗。
* **理由:** Docker ネットワーク、WSL ネットワーク、Windows ホスト、VPN という多層構造により、DNS 解決不能やパケットの迷子が発生。複雑すぎるため WSL2 直接利用へ変更。

### 4.2. `netsh interface portproxy` の使用 (廃案)

* **試行:** Windows 側で `0.0.0.0:60053` を `127.0.0.1:60053` へ転送。
* **結果:** 不安定。
* **理由:** `portproxy` サービスが VPN アダプターやファイアウォールと競合し、接続が切れる現象が発生。IP 直接指定の方が確実であった。

### 4.3. `npx` 引数の誤り

* **エラー:** `Arguments channel and browserUrl are mutually exclusive`
* **原因:** `--channel` (ブラウザ自動起動モード) と `--browserUrl` (既存ブラウザ接続モード) を併用していたため。既存 Chrome を使う場合は後者のみにする。

---

## 5. 診断・確認コマンド集

接続トラブル発生時は、以下の順序で確認を行う。

### 5.1. Windows 側での診断 (PowerShell)

1. **ポート待受確認:**
```powershell
netstat -an | findstr 60053

```


(`LISTENING` になっていること)
2. **自己接続テスト (重要):**
WSL アダプターの IP に対して Windows 自身がアクセスできるか確認。これで FW ブロックかどうかが判別できる。
```powershell
# IPは ipconfig で確認した vEthernet (WSL) のもの
Test-NetConnection -ComputerName 172.x.x.x -Port 60053

```


* `TcpTestSucceeded: True` → ファイアウォール設定 OK
* `False` → ファイアウォールでブロックされている



### 5.2. WSL2 側での診断 (Bash)

1. **疎通確認 (プロキシ回避):**
```bash
# IP自動取得版
curl --noproxy "*" http://$(ip route show | grep default | awk '{print $3}'):60053/json/version

```


* JSON が返れば成功。
* HTML (Digital Arts等) が返ればプロキシ設定漏れ。
* Timeout なら Windows FW ブロック。
