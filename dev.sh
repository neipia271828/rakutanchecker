#!/bin/bash

# 開発用のフロントエンドとバックエンドを起動するスクリプト

# 色の定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# エラーハンドリング
set -e

# プロジェクトのルートディレクトリ
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}=== 楽単チェッカー 開発環境起動 ===${NC}"

# バックエンドの起動
echo -e "${GREEN}バックエンド (Django) を起動中...${NC}"
cd "$PROJECT_ROOT/backend"

# 仮想環境の準備・アクティベート
if [ -d ".venv" ]; then
    VENV_DIR=".venv"
elif [ -d "venv" ]; then
    VENV_DIR="venv"
else
    echo -e "${BLUE}仮想環境が見つからないため作成します...${NC}"
    python3 -m venv .venv
    VENV_DIR=".venv"
fi

source "$VENV_DIR/bin/activate"

PYTHON_BIN="python"
if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
    PYTHON_BIN="python3"
fi

# 依存関係の導入/更新（Djangoのバージョン不一致も検知）
if ! "$PYTHON_BIN" - <<'PY' >/dev/null 2>&1
import re
import sys
from pathlib import Path

req_path = Path("requirements.txt")
required = None
if req_path.exists():
    for line in req_path.read_text().splitlines():
        line = line.strip()
        if line.startswith("Django=="):
            required = line.split("==", 1)[1]
            break

try:
    import django
except Exception:
    sys.exit(1)

if required is None:
    sys.exit(0)

sys.exit(0 if django.get_version() == required else 1)
PY
then
    echo -e "${BLUE}依存関係をインストール中...${NC}"
    pip install -r requirements.txt
fi

# Djangoサーバーをバックグラウンドで起動
"$PYTHON_BIN" manage.py runserver 8000 &
BACKEND_PID=$!
echo -e "${GREEN}バックエンドが起動しました (PID: $BACKEND_PID, ポート: 8000)${NC}"

# フロントエンドの起動
echo -e "${GREEN}フロントエンド (Vite) を起動中...${NC}"
cd "$PROJECT_ROOT/frontend"

# node_modulesの確認
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}依存関係をインストール中...${NC}"
    npm install
fi

# Viteサーバーをバックグラウンドで起動
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}フロントエンドが起動しました (PID: $FRONTEND_PID)${NC}"

# 終了処理
cleanup() {
    echo -e "\n${BLUE}サーバーを停止中...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}すべてのサーバーが停止しました${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "${BLUE}=== 開発環境が起動しました ===${NC}"
echo -e "フロントエンド: ${GREEN}http://localhost:5173${NC}"
echo -e "バックエンド: ${GREEN}http://localhost:8000${NC}"
echo -e "\n${BLUE}Ctrl+C で停止します${NC}\n"

# プロセスが終了するまで待機
wait
