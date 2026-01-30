# デプロイ手順書 (VPS環境構築)

このドキュメントでは、既存のVPS (pai314.jp) に `rakutanchecker` をデプロイするためのサーバー設定手順を説明します。

## 1. ディレクトリ作成と権限設定

VPSにSSH接続し、以下のディレクトリを作成します。ユーザー名は `deploy` などを想定していますが、既存の構成 (`${{ secrets.SSH_USER }}`) に合わせてください。

```bash
# フロントエンド用ディレクトリ (pai314の下にrakutanフォルダを作成)
sudo mkdir -p /var/www/pai314/rakutan
sudo chown -R $USER:$USER /var/www/pai314/rakutan

# バックエンド用ディレクトリ
sudo mkdir -p /var/www/rakutan-backend
sudo chown -R $USER:$USER /var/www/rakutan-backend
```

## 2. Python環境の準備 (バックエンド用)

必要なパッケージをインストールし、venvを作成します。

```bash
# Pythonとvenvのインストール (Ubuntuの場合)
sudo apt update
sudo apt install python3-pip python3-venv

# venvの作成
cd /var/www/rakutan-backend
python3 -m venv venv
```

## 3. Systemd サービス設定 (Gunicorn)

Djangoを常駐プロセスとして動かすための設定ファイルを作成します。

`/etc/systemd/system/rakutan-backend.service`:

```ini
[Unit]
Description=gunicorn daemon for rakutan-backend
After=network.target

[Service]
User=USERNAME
Group=USERNAME
WorkingDirectory=/var/www/rakutan-backend
ExecStart=/var/www/rakutan-backend/venv/bin/gunicorn --access-logfile - --workers 3 --bind unix:/var/www/rakutan-backend/rakutan.sock config.wsgi:application

[Install]
WantedBy=multi-user.target
```
※ `USERNAME` は実行ユーザー名(例: ubuntu や root など)に書き換えてください。

サービスを有効化・起動します（まだコードがないので起動は失敗する可能性がありますが、登録だけしておきます）。

```bash
sudo systemctl start rakutan-backend
sudo systemctl enable rakutan-backend
```

## 4. Nginx 設定

既存の Nginx 設定（`pai314` 用の設定ファイル）に追記します。
`/rakutan` へのアクセスを制御します。

```nginx
server {
    # ... 既存の設定 (server_name pai314.jp ...)

    # フロントエンド (静的ファイル)
    location /rakutan/ {
        alias /var/www/pai314/rakutan/;
        try_files $uri $uri/ /rakutan/index.html;
    }

    # バックエンド (API)
    location /rakutan/api/ {
        proxy_pass http://unix:/var/www/rakutan-backend/rakutan.sock:/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Django Admin (必要であれば)
    location /rakutan/admin/ {
        proxy_pass http://unix:/var/www/rakutan-backend/rakutan.sock:/admin/;
        proxy_set_header Host $host;
        # ... (同上)
    }

    # Static files (Django admin style etc)
    location /rakutan/static/ {
        alias /var/www/rakutan-backend/static/;
    }
}
```

設定をテストして再読み込みします。

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 5. GitHub Secrets の設定

リポジトリの Settings > Secrets and variables > Actions に以下の登録が必要です。

| Secret Name | Description |
|---|---|
| `SSH_HOST` | VPSのIPアドレスまたはホスト名 |
| `SSH_USER` | SSHログインユーザー名 |
| `SSH_KEY` | SSH秘密鍵 (Private Key) の内容 |
| `SSH_PORT` | SSHポート番号 (通常22) |

---

## 6. 初回デプロイ後の作業

GitHub Actions が一度走ってコードが配置された後に、サーバーで以下を実行する必要があります（またはCIが自動でやりますが、初回は確認推奨）。

1. データベースのマイグレーション:
   ```bash
   cd /var/www/rakutan-backend
   source venv/bin/activate
   python manage.py migrate
   python manage.py createsuperuser  # 管理者作成
   ```

2. 権限設定 (SQLiteを使う場合):
   `db.sqlite3` ファイルとそのディレクトリに書き込み権限が必要です。
   ```bash
   chown $USER:$USER db.sqlite3
   chmod 664 db.sqlite3
   chown $USER:$USER .  # ディレクトリ自体にも書き込み権限が必要
   ```
