# セキュリティセットアップガイド

このドキュメントは、rakutancheckerを本番環境に安全にデプロイするための手順を説明します。

## 🔐 必須セキュリティ設定

### 1. 環境変数の設定

VPSサーバーで環境変数ファイルを作成します。

```bash
# バックエンドディレクトリに移動
cd /var/www/rakutan-backend

# 環境変数ファイルを作成
sudo nano .env
```

以下の内容を`.env`に記述してください：

```bash
# Django Settings - 本番環境用
DEBUG=False
SECRET_KEY=ここに長いランダムな文字列を生成して入力

# Allowed Hosts
ALLOWED_HOSTS=pai314.jp,133.125.84.34

# CORS Settings
CORS_ALLOWED_ORIGINS=https://pai314.jp,http://pai314.jp

# Database (SQLiteを使う場合)
# DATABASE_URL=sqlite:///./db.sqlite3

# PostgreSQLを使う場合（推奨）
# DATABASE_URL=postgresql://user:password@localhost:5432/rakutan

# Debug Logging
DEBUG_LOG_PATH=/var/log/rakutan-backend/debug.log
```

#### SECRET_KEYの生成方法

```bash
# Pythonで安全なランダム文字列を生成
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

生成された文字列を`SECRET_KEY`にコピーしてください。

### 2. ファイルパーミッションの設定

```bash
# 環境変数ファイルを保護
sudo chmod 600 /var/www/rakutan-backend/.env
sudo chown ubuntu:ubuntu /var/www/rakutan-backend/.env

# ログディレクトリを作成
sudo mkdir -p /var/log/rakutan-backend
sudo chown ubuntu:ubuntu /var/log/rakutan-backend
sudo chmod 755 /var/log/rakutan-backend
```

### 3. systemdサービスに環境変数を読み込ませる

`/etc/systemd/system/rakutan-backend.service` を編集：

```bash
sudo nano /etc/systemd/system/rakutan-backend.service
```

`[Service]`セクションに以下を追加：

```ini
[Service]
EnvironmentFile=/var/www/rakutan-backend/.env
```

完全な例：

```ini
[Unit]
Description=gunicorn daemon for rakutan-backend
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/var/www/rakutan-backend
EnvironmentFile=/var/www/rakutan-backend/.env
ExecStart=/var/www/rakutan-backend/venv/bin/gunicorn --access-logfile - --workers 3 --bind unix:/var/www/rakutan-backend/rakutan.sock config.wsgi:application

[Install]
WantedBy=multi-user.target
```

サービスを再読み込みして再起動：

```bash
sudo systemctl daemon-reload
sudo systemctl restart rakutan-backend
sudo systemctl status rakutan-backend
```

### 4. GitHub ActionsでのGunicorn自動再起動を有効化

sudoersファイルを編集して、パスワードなしでrakutan-backendサービスを再起動できるようにします。

```bash
sudo visudo
```

以下の行を追加（`ubuntu`は実際のユーザー名に置き換え）：

```
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart rakutan-backend
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl is-active rakutan-backend
```

保存して終了します（Ctrl+X, Y, Enter）。

## 🔒 HTTPSの設定（推奨）

### Let's Encryptを使用したSSL証明書の取得

```bash
# Certbotのインストール
sudo apt update
sudo apt install certbot python3-certbot-nginx

# SSL証明書の取得（nginxを自動設定）
sudo certbot --nginx -d pai314.jp

# 証明書の自動更新テスト
sudo certbot renew --dry-run
```

### Nginxの設定を更新

`rakutan_nginx.conf`のHTTPSセクションのコメントを解除し、pai314.jpのnginx設定に適用します。

```bash
# Nginxの設定をテスト
sudo nginx -t

# 問題なければリロード
sudo systemctl reload nginx
```

## 📊 PostgreSQLへの移行（推奨）

SQLiteは開発環境向けです。本番環境ではPostgreSQLを推奨します。

### 1. PostgreSQLのインストール

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### 2. データベースとユーザーの作成

```bash
sudo -u postgres psql

# PostgreSQLシェル内で実行
CREATE DATABASE rakutan;
CREATE USER rakutan_user WITH PASSWORD 'your_secure_password';
ALTER ROLE rakutan_user SET client_encoding TO 'utf8';
ALTER ROLE rakutan_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE rakutan_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE rakutan TO rakutan_user;
\q
```

### 3. 環境変数を更新

`.env`ファイルを編集：

```bash
DATABASE_URL=postgresql://rakutan_user:your_secure_password@localhost:5432/rakutan
```

### 4. データの移行（既存データがある場合）

```bash
cd /var/www/rakutan-backend
source venv/bin/activate

# 既存データをエクスポート
python manage.py dumpdata > data_backup.json

# 新しいデータベースにマイグレート
python manage.py migrate

# データをインポート
python manage.py loaddata data_backup.json
```

### 5. サービスを再起動

```bash
sudo systemctl restart rakutan-backend
```

## 🔍 セキュリティチェックリスト

デプロイ前に以下を確認してください：

- [ ] `DEBUG=False` が設定されている
- [ ] `SECRET_KEY` が安全なランダム文字列に変更されている
- [ ] `.env` ファイルのパーミッションが `600` に設定されている
- [ ] `.env` が `.gitignore` に含まれている
- [ ] HTTPS/SSLが有効化されている（推奨）
- [ ] CORS設定が本番ドメインのみを許可している
- [ ] データベースの認証情報が安全に管理されている
- [ ] ログファイルのディレクトリが作成されている
- [ ] sudoersファイルでGunicorn再起動権限が設定されている
- [ ] Nginxの設定がテストされている (`sudo nginx -t`)
- [ ] Gunicornサービスが正常に起動している

## 🚨 トラブルシューティング

### Gunicornが起動しない

```bash
# サービスのログを確認
sudo journalctl -u rakutan-backend -n 50

# 環境変数が正しく読み込まれているか確認
sudo systemctl show rakutan-backend | grep Environment
```

### 403 Forbiddenエラー

```bash
# ファイルパーミッションを確認
ls -la /var/www/pai314/rakutan
ls -la /var/www/rakutan-backend

# SELinuxが有効な場合（CentOS/RHELのみ）
sudo setenforce 0  # 一時的に無効化してテスト
```

### データベース接続エラー

```bash
# PostgreSQL接続テスト
psql -U rakutan_user -d rakutan -h localhost

# Django設定を確認
cd /var/www/rakutan-backend
source venv/bin/activate
python manage.py check --deploy
```

## 📚 参考リンク

- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Security Guide](https://nginx.org/en/docs/http/ngx_http_ssl_module.html)
