#!/bin/bash
# Master deployment script for a fresh DigitalOcean droplet.
#
# Usage (run on the droplet):
#   ./deploy.sh <domain>
#
# Steps:
#   1. Install Node.js via nvm
#   2. Install Fedwiki + wiki-plugin-allyabase
#   3. Install nginx + certbot (SSL configured separately once DNS propagates)
#
# After DNS propagates, obtain the cert with:
#   sudo certbot --nginx -d <domain>

set -e

DOMAIN="${1:?Usage: deploy.sh <domain> <do_api_token>}"
DO_API_TOKEN="${2:?Usage: deploy.sh <domain> <do_api_token>}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() { echo -e "\n\033[1;32m==>\033[0m $1"; }

log "Starting deployment for domain: $DOMAIN"

log "[1/4] Installing Node.js"
bash "$SCRIPT_DIR/01-install-node.sh"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

log "[2/4] Installing Fedwiki and wiki-plugin-allyabase"
bash "$SCRIPT_DIR/02-install-wiki.sh"

log "[3/4] Installing nginx and certbot"
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx
bash "$SCRIPT_DIR/04-configure-nginx.sh" "$DOMAIN"

log "[4/4] Adding A record in DigitalOcean DNS"
bash "$SCRIPT_DIR/05-configure-dns.sh" "$DOMAIN" "$DO_API_TOKEN"

log "Base deployment complete!"
echo ""
echo "  Droplet is ready. Once DNS propagates:"
echo ""
echo "  1. Run: sudo certbot --nginx -d $DOMAIN"
echo "  2. Install allyabase services via the wiki plugin"
echo ""
