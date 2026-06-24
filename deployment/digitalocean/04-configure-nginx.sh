#!/bin/bash
# Configure nginx to reverse-proxy the domain to Federated Wiki (port 3333).
# Certbot (step 6) will patch in the SSL directives after certs are issued.

set -e

DOMAIN="${1:?Usage: 04-configure-nginx.sh <domain>}"
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

echo "Installing nginx..."
apt-get update -qq
apt-get install -y nginx

echo "Writing nginx config for $DOMAIN..."
cat > "$NGINX_CONF" <<EOF
# HTTP only — certbot will add the HTTPS server block and redirect when run
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # WebSocket support (wiki uses socket.io)
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";

    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 300;
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3333;
    }
}
EOF

# Enable the site
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/"$DOMAIN"

# Disable default site if it's still linked
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

echo "nginx configured for $DOMAIN."
