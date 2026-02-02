#!/bin/bash
PASS="o4UjZgxlK7pl"

# Exit on error
set -e

echo "=== Setup Directories ==="
echo "$PASS" | sudo -S mkdir -p /var/www/rakutan-frontend
echo "$PASS" | sudo -S chown -R ubuntu:ubuntu /var/www/rakutan-frontend
echo "$PASS" | sudo -S mkdir -p /var/www/rakutan-backend
echo "$PASS" | sudo -S chown -R ubuntu:ubuntu /var/www/rakutan-backend

# Note: After this script runs, the deploy script will rsync files.
# So we usually run directory setup first, then rsync, then config/restart.
# To support this flow, we might need two scripts or arguments.
# For simplicity, we'll allow this script to be idempotent and run it AFTER rsync is safer for the logic,
# BUT we need directories to exist BEFORE rsync.

# So:
# 1. We'll run a quick ssh command in expect to make directories.
# 2. Then rsync.
# 3. Then run this script for the rest.
