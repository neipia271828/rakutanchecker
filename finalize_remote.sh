#!/bin/bash
PASS="o4UjZgxlK7pl"

echo "=== Configure Nginx ==="
echo "$PASS" | sudo -S mv ~/rakutan_nginx.conf /etc/nginx/sites-available/rakutan
echo "$PASS" | sudo -S ln -sf /etc/nginx/sites-available/rakutan /etc/nginx/sites-enabled/

echo "=== Setup Backend ==="
cd /var/www/rakutan-backend
if [ ! -d "venv" ]; then
    echo "Creating venv..."
    python3 -m venv venv
fi
source venv/bin/activate
echo "Installing requirements..."
pip install -r requirements.txt
echo "Migrating..."
python3 manage.py migrate
echo "Collecting static..."
python3 manage.py collectstatic --noinput

echo "=== Restart Services ==="
echo "$PASS" | sudo -S systemctl restart rakutan-backend
echo "$PASS" | sudo -S systemctl reload nginx

echo "=== Deployment Finished ==="
