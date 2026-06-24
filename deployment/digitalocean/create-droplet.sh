#!/bin/bash
# Run from your LOCAL machine.
# Creates a DigitalOcean droplet, waits for it to be ready, then SSHes in
# and runs the full deployment (Node, wiki, allyabase services, nginx, DNS, SSL).
#
# Usage:
#   ./create-droplet.sh <domain> <do_api_token> [ssh_key_id] [local_key_file]
#
# If ssh_key_id is omitted, your registered DO SSH keys are listed and you'll be
# prompted to pick one.
#
# local_key_file: path to the private key on THIS machine that corresponds to the
#   DO SSH key you select (e.g. ~/.ssh/id_ed25519). If omitted, common locations
#   are tried automatically.
#
# Prerequisites (local machine):
#   - curl, ssh, scp, ssh-keyscan
#   - An SSH key registered in your DigitalOcean account
#   - Your domain already added to DigitalOcean Networking > Domains

set -e

DOMAIN="${1:?Usage: create-droplet.sh <domain> <do_api_token> [ssh_key_id] [local_key_file]}"
DO_API_TOKEN="${2:?Usage: create-droplet.sh <domain> <do_api_token> [ssh_key_id] [local_key_file]}"
SSH_KEY_ID="${3:-}"
LOCAL_KEY_FILE="${4:-}"

DO_API="https://api.digitalocean.com/v2"
DROPLET_NAME="${DOMAIN//./-}"   # e.g. wiki-example-com
REGION="nyc3"
SIZE="s-2vcpu-2gb"              # 2 vCPU / 2 GB — minimum comfortable for 13 services + wiki
IMAGE="ubuntu-22-04-x64"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log()  { echo -e "\n\033[1;32m==>\033[0m $1"; }
info() { echo "    $1"; }
die()  { echo -e "\n\033[1;31mERROR:\033[0m $1" >&2; exit 1; }

# Portable timeout: uses GNU timeout, gtimeout (macOS brew), or a bash fallback
if command -v timeout &>/dev/null; then
    _timeout() { timeout "$@"; }
elif command -v gtimeout &>/dev/null; then
    _timeout() { gtimeout "$@"; }
else
    _timeout() {
        local secs=$1; shift
        "$@" &
        local pid=$!
        ( sleep "$secs"; kill "$pid" 2>/dev/null ) &
        local watcher=$!
        wait "$pid" 2>/dev/null
        local ret=$?
        kill "$watcher" 2>/dev/null
        wait "$watcher" 2>/dev/null
        return $ret
    }
fi

do_api() {
    local method="$1"; shift
    local path="$1"; shift
    curl -sf -X "$method" \
        -H "Authorization: Bearer $DO_API_TOKEN" \
        -H "Content-Type: application/json" \
        "$@" \
        "$DO_API$path"
}

# ── 1. Resolve SSH key ─────────────────────────────────────────────────────────

if [ -z "$SSH_KEY_ID" ]; then
    log "Fetching your DigitalOcean SSH keys..."
    KEY_JSON=$(do_api GET /account/keys)
    KEY_COUNT=$(echo "$KEY_JSON" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['ssh_keys']))")

    if [ "$KEY_COUNT" -eq 0 ]; then
        die "No SSH keys found in your DO account. Add one at: https://cloud.digitalocean.com/account/security"
    fi

    echo ""
    echo "  Available SSH keys:"
    echo "$KEY_JSON" | python3 -c "
import sys, json
keys = json.load(sys.stdin)['ssh_keys']
for i, k in enumerate(keys):
    print(f'  [{i}] id={k[\"id\"]}  name={k[\"name\"]}  fingerprint={k[\"fingerprint\"]}')
"
    echo ""
    read -rp "  Enter the number of the key to use: " KEY_IDX
    SSH_KEY_ID=$(echo "$KEY_JSON" | python3 -c "
import sys, json
keys = json.load(sys.stdin)['ssh_keys']
print(keys[$KEY_IDX]['id'])
")
    info "Using SSH key id: $SSH_KEY_ID"
fi

# ── 2. Create droplet ──────────────────────────────────────────────────────────

log "Creating droplet '$DROPLET_NAME' ($SIZE, $REGION, $IMAGE)..."

CREATE_RESP=$(do_api POST /droplets -d "{
    \"name\":     \"$DROPLET_NAME\",
    \"region\":   \"$REGION\",
    \"size\":     \"$SIZE\",
    \"image\":    \"$IMAGE\",
    \"ssh_keys\": [$SSH_KEY_ID],
    \"tags\":     [\"allyabase\"]
}")

DROPLET_ID=$(echo "$CREATE_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['droplet']['id'])")
info "Droplet id: $DROPLET_ID"

# Assign droplet to the "allyabase" project (creates it if it doesn't exist)
PROJECT_ID=$(do_api GET /projects | python3 -c "
import sys, json
projects = json.load(sys.stdin)['projects']
match = [p for p in projects if p['name'].lower() == 'allyabase']
print(match[0]['id'] if match else '')
" 2>/dev/null || true)

if [ -z "$PROJECT_ID" ]; then
    info "Creating 'allyabase' project in DigitalOcean..."
    PROJECT_ID=$(do_api POST /projects -d '{"name":"allyabase","description":"Allyabase fedwiki instances","purpose":"Web Application","environment":"Production"}' | \
        python3 -c "import sys,json; print(json.load(sys.stdin)['project']['id'])")
fi

do_api POST /projects/"$PROJECT_ID"/resources \
    -d "{\"resources\":[\"do:droplet:$DROPLET_ID\"]}" > /dev/null
info "Assigned to project 'allyabase' (id: $PROJECT_ID)"

# ── 3. Wait for public IP ──────────────────────────────────────────────────────

log "Waiting for droplet to get a public IP..."
DROPLET_IP=""
for i in $(seq 1 30); do
    sleep 5
    DROPLET_IP=$(do_api GET /droplets/"$DROPLET_ID" | \
        python3 -c "
import sys, json
d = json.load(sys.stdin)['droplet']
nets = d.get('networks', {}).get('v4', [])
pub = [n for n in nets if n['type'] == 'public']
print(pub[0]['ip_address'] if pub else '')
" 2>/dev/null || true)
    if [ -n "$DROPLET_IP" ]; then
        info "Public IP: $DROPLET_IP"
        break
    fi
    info "Attempt $i/30 — no IP yet, waiting..."
done

[ -n "$DROPLET_IP" ] || die "Droplet never got a public IP after 150s."

# ── 4. Resolve local SSH key file ─────────────────────────────────────────────

if [ -z "$LOCAL_KEY_FILE" ]; then
    for candidate in ~/.ssh/id_ed25519_do ~/.ssh/id_ed25519 ~/.ssh/id_rsa ~/.ssh/id_ecdsa ~/.ssh/id_dsa; do
        if [ -f "$candidate" ]; then
            LOCAL_KEY_FILE="$candidate"
            break
        fi
    done
fi

if [ -z "$LOCAL_KEY_FILE" ]; then
    die "Could not find a local SSH private key. Pass it as the 4th argument:\n  ./create-droplet.sh $DOMAIN <token> <key_id> ~/.ssh/your_key"
fi

info "Using local key: $LOCAL_KEY_FILE"

# DO API returns MD5 fingerprints; match that format for comparison
LOCAL_FINGERPRINT=$(ssh-keygen -l -E md5 -f "$LOCAL_KEY_FILE" 2>/dev/null | awk '{print $2}' | sed 's/^MD5://' || echo "could not read")
DO_FINGERPRINT=$(do_api GET /account/keys/"$SSH_KEY_ID" | python3 -c "import sys,json; print(json.load(sys.stdin)['ssh_key']['fingerprint'])" 2>/dev/null || echo "could not fetch")
info "Local key fingerprint : $LOCAL_FINGERPRINT"
info "DO key fingerprint    : $DO_FINGERPRINT"
if [ "$LOCAL_FINGERPRINT" != "$DO_FINGERPRINT" ]; then
    die "Key mismatch! The local key ($LOCAL_KEY_FILE) does not match the selected DO SSH key (id: $SSH_KEY_ID).\nPass the correct private key as the 4th argument:\n  ./create-droplet.sh $DOMAIN <token> $SSH_KEY_ID /path/to/matching/key"
fi

# Check if the key has a passphrase; if so, ensure it's loaded in the agent
if ! ssh-keygen -y -P "" -f "$LOCAL_KEY_FILE" &>/dev/null; then
    info "Key has a passphrase — adding to SSH agent so automation can proceed..."
    ssh-add "$LOCAL_KEY_FILE" || die "Could not add key to agent. Run: ssh-add $LOCAL_KEY_FILE"
fi

SSH_OPTS=(-o StrictHostKeyChecking=no -o BatchMode=yes -o UserKnownHostsFile=/dev/null -o IdentitiesOnly=yes -i "$LOCAL_KEY_FILE")

# ── 5. Wait for SSH to be fully ready ─────────────────────────────────────────
# ConnectTimeout only covers the TCP handshake. If sshd is up but cloud-init
# hasn't written authorized_keys yet the connection hangs during auth.
# Wrap each attempt with `timeout` for a hard wall-clock cap.

log "Waiting for SSH to be fully ready on $DROPLET_IP (up to 15 min)..."
info "Giving cloud-init a 20s head start..."
sleep 20

for i in $(seq 1 180); do
    SSH_ERR=$(_timeout 10 ssh "${SSH_OPTS[@]}" -o ConnectTimeout=5 root@"$DROPLET_IP" true 2>&1) && SSH_EXIT=0 || SSH_EXIT=$?
    if [ $SSH_EXIT -eq 0 ]; then
        info "SSH is ready."
        break
    fi
    if [ "$i" -eq 180 ]; then
        die "SSH never became ready after 15 minutes.\nYou can try manually: ssh -i $LOCAL_KEY_FILE root@$DROPLET_IP"
    fi
    info "Attempt $i/180 — exit=$SSH_EXIT — ${SSH_ERR:-no output} — waiting 5s..."
    sleep 5
done

# ── 6. Copy deployment scripts to droplet ─────────────────────────────────────

log "Copying deployment scripts to droplet..."
scp "${SSH_OPTS[@]}" -r "$SCRIPT_DIR" root@"$DROPLET_IP":/root/digitalocean
ssh "${SSH_OPTS[@]}" root@"$DROPLET_IP" "chmod +x /root/digitalocean/*.sh"

# ── 7. Run deployment on the droplet ──────────────────────────────────────────

log "Running deployment on droplet (this will take a few minutes)..."
ssh "${SSH_OPTS[@]}" -t root@"$DROPLET_IP" \
    "bash /root/digitalocean/deploy.sh '$DOMAIN' '$DO_API_TOKEN'"

# ── 8. Done ────────────────────────────────────────────────────────────────────

log "All done!"
echo ""
echo "  Droplet:  $DROPLET_NAME ($DROPLET_IP)"
echo ""
echo "SSH in with:  ssh root@$DROPLET_IP"
echo ""
echo "Next steps:"
echo "  1. Point $DOMAIN A record → $DROPLET_IP"
echo "  2. Once DNS propagates: sudo certbot --nginx -d $DOMAIN"
echo "  3. Install allyabase services via the wiki plugin"
