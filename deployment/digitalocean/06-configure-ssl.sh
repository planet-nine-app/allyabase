#!/bin/bash
# Obtain a Let's Encrypt certificate via certbot and configure nginx for HTTPS.
#
# Run this AFTER:
#   - nginx is configured (step 4)
#   - the A record is propagated (step 5)
#
# Usage:
#   ./06-configure-ssl.sh <domain> [email]
#
# If email is omitted, certbot runs with --register-unsafely-without-email.

set -e

DOMAIN="${1:?Usage: 06-configure-ssl.sh <domain> [email]}"
EMAIL="${2:-}"

echo "Installing certbot..."
apt-get update -qq
apt-get install -y certbot python3-certbot-nginx

echo "Verifying nginx is running..."
systemctl is-active nginx || systemctl start nginx

echo "Verifying $DOMAIN resolves to this server before requesting certificate..."
SERVER_IP=$(curl -sf http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address || echo "")
DOMAIN_IP=$(dig +short "$DOMAIN" | tail -1)

if [ -n "$SERVER_IP" ] && [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    echo "WARNING: $DOMAIN resolves to $DOMAIN_IP but this server is $SERVER_IP"
    echo "DNS may still be propagating. certbot will fail if they don't match."
    read -rp "Continue anyway? [y/N] " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || exit 1
fi

if [ -n "$EMAIL" ]; then
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"
else
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email
fi

echo "SSL certificate obtained. nginx has been updated."
echo ""
echo "Certbot auto-renew is set up via systemd timer. Verify with:"
echo "  systemctl status certbot.timer"
