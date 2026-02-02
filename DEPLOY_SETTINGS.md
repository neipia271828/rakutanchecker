# デプロイ構成仕様書 (DEPLOY_SETTINGS.md)

このプロジェクトは、既存のウェブサイト (`pai314.jp` on Sakura VPS) のサブディレクトリ `/rakutan` に配置される形でデプロイされています。

## 1. 全体アーキテクチャ

- **URL**: `https://pai314.jp/rakutan/`
- **Frontend**: React (Vite) - SPA
- **Backend**: Django (Gunicorn) - API Server
- **Database**: SQLite (VPS上のファイル)
- **Web Server**: Nginx (Reverse Proxy)

## 2. フロントエンド設定

SPAのルーティング問題を回避し、サブディレクトリでの配信を確実にするため、以下の設定を採用しています。

- **Router**: `HashRouter` (URL例: `.../rakutan/#/dashboard`)
- **Base Path**: `/rakutan/`
  - `vite.config.ts`: `base: '/rakutan/'` (本番時)
  - `package.json`: `vite build --base=/rakutan/`
- **Output**: `/var/www/pai314/rakutan` (VPS)

## 3. バックエンド設定

- **Location**: `/var/www/rakutan-backend` (VPS)
- **Python**: venv仮想環境を使用
- **WSGI**: Gunicorn (`config.wsgi:application`)
- **Systemd Service**: `rakutan-backend.service`
  - User: `ubuntu`
  - Socket: `unix:/var/www/rakutan-backend/rakutan.sock`
- **Static Files**:
  - `STATIC_ROOT`: `/var/www/rakutan-backend/static`
  - `collectstatic` で上記に集約され、Nginx経由で配信 (`/rakutan/static/`)

## 4. Nginx設定 (pai314.jp)

既存の `server` ブロックに以下を追記して共存させています。

```nginx
# フロントエンド (静的ファイル)
location /rakutan/ {
    alias /var/www/pai314/rakutan/;
    try_files $uri $uri/ /rakutan/index.html;
}

# バックエンドAPI
location /rakutan/api/ {
    proxy_pass http://unix:/var/www/rakutan-backend/rakutan.sock:/api/;
    proxy_set_header Host $host;
    # ... headers
}

# 静的ファイル (Admin画面用など)
location /rakutan/static/ {
    alias /var/www/rakutan-backend/static/;
}
```

## 5. 自動デプロイ (GitHub Actions)

`.github/workflows/deploy-rakutan.yml` にて定義。

1. **Frontend Job**:
   - `npm run build`
   - `rsync` で成果物 (`dist/`) を `/var/www/pai314/rakutan` へ同期

2. **Backend Job**:
   - `rsync` でコード一式を `/var/www/rakutan-backend` へ同期
   - SSH経由でコマンド実行:
     - `pip install`
     - `migrate`
     - `collectstatic`
   - **注意**: Gunicornの再起動は権限設定の都合上、手動または設定変更が必要（現在は自動再起動をコメントアウト中）。
     - 手動再起動: `ssh ubuntu@... "sudo systemctl restart rakutan-backend"`

## 6. 重要ファイル・ディレクトリ

| 場所 | パス | 説明 |
|---|---|---|
| Frontend Deploy | `/var/www/pai314/rakutan` | Reactビルド成果物 |
| Backend Deploy | `/var/www/rakutan-backend` | Djangoコード & venv |
| Database | `/var/www/rakutan-backend/db.sqlite3` | SQLiteデータベースファイル |
| Socket | `/var/www/rakutan-backend/rakutan.sock` | Nginxとの通信ソケット |
| Log | `journalctl -u rakutan-backend` | アプリケーションログ |
