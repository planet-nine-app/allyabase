#!/bin/bash
# Add an A record in DigitalOcean DNS pointing the domain to this droplet's public IP.
#
# Prerequisites:
#   - The domain must already exist in your DigitalOcean account
#     (Networking > Domains). This script only adds/updates the A record.
#   - Your domain registrar must delegate DNS to DigitalOcean nameservers.
#
# Usage:
#   ./05-configure-dns.sh <domain> <do_api_token>

set -e

DOMAIN="${1:?Usage: 05-configure-dns.sh <domain> <do_api_token>}"
DO_API_TOKEN="${2:?Usage: 05-configure-dns.sh <domain> <do_api_token>}"
DO_API="https://api.digitalocean.com/v2"

# Get this droplet's public IPv4 from the DO metadata service
echo "Detecting droplet public IP..."
DROPLET_IP=$(curl -sf http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address)
if [ -z "$DROPLET_IP" ]; then
    echo "Could not detect droplet IP from metadata service."
    read -rp "Enter droplet public IP manually: " DROPLET_IP
fi
echo "Droplet IP: $DROPLET_IP"

auth_header() { echo "Authorization: Bearer $DO_API_TOKEN"; }

# Check if an A record for @ already exists
echo "Checking for existing A record on $DOMAIN..."
EXISTING=$(curl -sf -H "$(auth_header)" \
    "$DO_API/domains/$DOMAIN/records?type=A&name=@" | \
    python3 -c "import sys,json; records=json.load(sys.stdin)['domain_records']; print(records[0]['id'] if records else '')" 2>/dev/null || true)

if [ -n "$EXISTING" ]; then
    echo "Updating existing A record (id $EXISTING)..."
    curl -sf -X PUT \
        -H "$(auth_header)" \
        -H "Content-Type: application/json" \
        -d "{\"data\": \"$DROPLET_IP\"}" \
        "$DO_API/domains/$DOMAIN/records/$EXISTING" > /dev/null
    echo "A record updated: $DOMAIN → $DROPLET_IP"
else
    echo "Creating A record..."
    curl -sf -X POST \
        -H "$(auth_header)" \
        -H "Content-Type: application/json" \
        -d "{\"type\":\"A\",\"name\":\"@\",\"data\":\"$DROPLET_IP\",\"ttl\":1800}" \
        "$DO_API/domains/$DOMAIN/records" > /dev/null
    echo "A record created: $DOMAIN → $DROPLET_IP"
fi

echo ""
echo "DNS propagation can take a few minutes. You can verify with:"
echo "  dig +short $DOMAIN"
