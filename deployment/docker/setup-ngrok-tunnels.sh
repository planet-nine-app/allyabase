#!/bin/bash

# ngrok tunnel management for Planet Nine ecosystem testing
# Creates public tunnels for all 3 allyabase instances to enable remote testing

set -e

NGROK_REGION="${NGROK_REGION:-us}"
TUNNEL_LOG_DIR="/tmp/ngrok-tunnels"
TUNNEL_URLS_FILE="/tmp/ngrok-tunnel-urls.txt"

# Create log directory
mkdir -p "$TUNNEL_LOG_DIR"

echo "🌍 Planet Nine Ecosystem - ngrok Tunnel Setup"
echo "============================================="
echo "Region: $NGROK_REGION"
echo "Log directory: $TUNNEL_LOG_DIR"
echo ""

# Function to start a single ngrok tunnel
start_tunnel() {
    local base_name=$1
    local port_start=$2
    local port_end=$3
    local tunnel_name=$4
    
    echo "🚀 Starting ngrok tunnel for $base_name (ports $port_start-$port_end)..."
    
    # Kill any existing tunnel for this base
    pkill -f "ngrok.*$port_start" 2>/dev/null || true
    sleep 2
    
    # Start ngrok tunnel in background
    local log_file="$TUNNEL_LOG_DIR/ngrok-$base_name.log"
    ngrok http $port_start --region $NGROK_REGION --log stdout > "$log_file" 2>&1 &
    local ngrok_pid=$!
    
    echo "  PID: $ngrok_pid"
    echo "  Log: $log_file"
    echo "  Primary port: $port_start (others: $port_start-$port_end)"
    
    # Wait for tunnel to establish
    echo "  ⏳ Waiting for tunnel to establish..."
    local max_attempts=30
    local tunnel_url=""
    
    for i in $(seq 1 $max_attempts); do
        sleep 2
        
        # Try to get tunnel URL from ngrok API
        if curl -s http://127.0.0.1:4040/api/tunnels >/dev/null 2>&1; then
            tunnel_url=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok\.io' | head -1)
            
            if [ -n "$tunnel_url" ]; then
                echo "  ✅ Tunnel established: $tunnel_url"
                
                # Store tunnel info
                echo "$base_name:$tunnel_url:$port_start-$port_end:$ngrok_pid" >> "$TUNNEL_URLS_FILE"
                return 0
            fi
        fi
        
        if [ $i -eq $max_attempts ]; then
            echo "  ❌ Tunnel failed to establish after $max_attempts attempts"
            echo "  Last log entries:"
            tail -5 "$log_file"
            return 1
        else
            echo "    Attempt $i/$max_attempts: Not ready, waiting..."
        fi
    done
}

# Function to extract service URLs from base tunnel
generate_service_urls() {
    local base_name=$1
    local tunnel_url=$2
    local port_start=$3
    
    echo "🔗 Generating service URLs for $base_name:"
    
    # Calculate port offsets based on the pattern from spin-up-bases-corrected.sh
    case $port_start in
        5111) # Base 1
            echo "  julia: ${tunnel_url%:*}:5111"
            echo "  continuebee: ${tunnel_url%:*}:5112"
            echo "  pref: ${tunnel_url%:*}:5113"
            echo "  bdo: ${tunnel_url%:*}:5114"
            echo "  joan: ${tunnel_url%:*}:5115"
            echo "  addie: ${tunnel_url%:*}:5116"
            echo "  fount: ${tunnel_url%:*}:5117"
            echo "  dolores: ${tunnel_url%:*}:5118"
            echo "  minnie: ${tunnel_url%:*}:5119"
            echo "  aretha: ${tunnel_url%:*}:5120"
            echo "  sanora: ${tunnel_url%:*}:5121"
            ;;
        5211) # Base 2
            echo "  julia: ${tunnel_url%:*}:5211"
            echo "  continuebee: ${tunnel_url%:*}:5212"
            echo "  pref: ${tunnel_url%:*}:5213"
            echo "  bdo: ${tunnel_url%:*}:5214"
            echo "  joan: ${tunnel_url%:*}:5215"
            echo "  addie: ${tunnel_url%:*}:5216"
            echo "  fount: ${tunnel_url%:*}:5217"
            echo "  dolores: ${tunnel_url%:*}:5218"
            echo "  minnie: ${tunnel_url%:*}:5219"
            echo "  aretha: ${tunnel_url%:*}:5220"
            echo "  sanora: ${tunnel_url%:*}:5221"
            ;;
        5311) # Base 3
            echo "  julia: ${tunnel_url%:*}:5311"
            echo "  continuebee: ${tunnel_url%:*}:5312"
            echo "  pref: ${tunnel_url%:*}:5313"
            echo "  bdo: ${tunnel_url%:*}:5314"
            echo "  joan: ${tunnel_url%:*}:5315"
            echo "  addie: ${tunnel_url%:*}:5316"
            echo "  fount: ${tunnel_url%:*}:5317"
            echo "  dolores: ${tunnel_url%:*}:5318"
            echo "  minnie: ${tunnel_url%:*}:5319"
            echo "  aretha: ${tunnel_url%:*}:5320"
            echo "  sanora: ${tunnel_url%:*}:5321"
            ;;
    esac
    echo ""
}

# Clean up any existing tunnel tracking
> "$TUNNEL_URLS_FILE"

echo "📋 Creating ngrok tunnels for all 3 bases..."
echo ""

# Start tunnels for all 3 bases
if start_tunnel "base1" 5111 5122 "base1"; then
    base1_info=$(tail -1 "$TUNNEL_URLS_FILE")
    base1_url=$(echo "$base1_info" | cut -d: -f2-3)
    generate_service_urls "Base 1" "$base1_url" 5111
fi

if start_tunnel "base2" 5211 5222 "base2"; then
    base2_info=$(tail -1 "$TUNNEL_URLS_FILE")
    base2_url=$(echo "$base2_info" | cut -d: -f2-3)
    generate_service_urls "Base 2" "$base2_url" 5211
fi

if start_tunnel "base3" 5311 5322 "base3"; then
    base3_info=$(tail -1 "$TUNNEL_URLS_FILE")
    base3_url=$(echo "$base3_info" | cut -d: -f2-3)
    generate_service_urls "Base 3" "$base3_url" 5311
fi

echo "🎯 ngrok Tunnel Setup Complete!"
echo ""

# Display summary
if [ -f "$TUNNEL_URLS_FILE" ] && [ -s "$TUNNEL_URLS_FILE" ]; then
    echo "📊 Active Tunnels Summary:"
    while IFS=: read -r base tunnel_url ports pid; do
        echo "  $base: $tunnel_url (ports $ports, PID $pid)"
    done < "$TUNNEL_URLS_FILE"
    echo ""
    
    echo "🔧 Management Commands:"
    echo "  View tunnel status: curl -s http://127.0.0.1:4040/api/tunnels | jq"
    echo "  Web interface: http://127.0.0.1:4040"
    echo "  Stop all tunnels: ./stop-ngrok-tunnels.sh"
    echo "  Tunnel URLs file: $TUNNEL_URLS_FILE"
    echo ""
    
    echo "✅ Ready for remote ecosystem testing!"
else
    echo "❌ No tunnels were successfully established"
    exit 1
fi

echo "💡 Next steps:"
echo "  1. Your allyabase instances should already be running on localhost"
echo "  2. Run tests using: ./test-complete-ecosystem.sh --use-ngrok"
echo "  3. Or test individual apps: cd nullary-tests && NGROK_MODE=true ./test-rhapsold.sh"