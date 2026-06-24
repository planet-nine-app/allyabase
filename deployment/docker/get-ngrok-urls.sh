#!/bin/bash

# Helper script to get ngrok tunnel URLs for ecosystem testing
# Returns base URLs that can be used by test scripts

TUNNEL_URLS_FILE="/tmp/ngrok-tunnel-urls.txt"

# Function to get base URL for a specific base
get_base_url() {
    local base_name=$1
    
    if [ ! -f "$TUNNEL_URLS_FILE" ]; then
        echo "ERROR: No tunnel URLs file found. Run ./setup-ngrok-tunnels.sh first" >&2
        return 1
    fi
    
    local base_info=$(grep "^$base_name:" "$TUNNEL_URLS_FILE" | head -1)
    if [ -n "$base_info" ]; then
        # Extract just the tunnel URL (remove the protocol for easier port manipulation)
        echo "$base_info" | cut -d: -f2-3
    else
        echo "ERROR: Base $base_name not found in tunnel URLs" >&2
        return 1
    fi
}

# Function to get service URL for specific service on a base
get_service_url() {
    local base_name=$1
    local service=$2
    
    local base_url=$(get_base_url "$base_name")
    if [ $? -ne 0 ]; then
        return 1
    fi
    
    # Remove https:// to get hostname
    local hostname=${base_url#https://}
    
    # Map service to port based on base
    local port=""
    case "$base_name:$service" in
        base1:julia) port="5111" ;;
        base1:continuebee) port="5112" ;;
        base1:pref) port="5113" ;;
        base1:bdo) port="5114" ;;
        base1:joan) port="5115" ;;
        base1:addie) port="5116" ;;
        base1:fount) port="5117" ;;
        base1:dolores) port="5118" ;;
        base1:minnie) port="5119" ;;
        base1:aretha) port="5120" ;;
        base1:sanora) port="5121" ;;
        
        base2:julia) port="5211" ;;
        base2:continuebee) port="5212" ;;
        base2:pref) port="5213" ;;
        base2:bdo) port="5214" ;;
        base2:joan) port="5215" ;;
        base2:addie) port="5216" ;;
        base2:fount) port="5217" ;;
        base2:dolores) port="5218" ;;
        base2:minnie) port="5219" ;;
        base2:aretha) port="5220" ;;
        base2:sanora) port="5221" ;;
        
        base3:julia) port="5311" ;;
        base3:continuebee) port="5312" ;;
        base3:pref) port="5313" ;;
        base3:bdo) port="5314" ;;
        base3:joan) port="5315" ;;
        base3:addie) port="5316" ;;
        base3:fount) port="5317" ;;
        base3:dolores) port="5318" ;;
        base3:minnie) port="5319" ;;
        base3:aretha) port="5320" ;;
        base3:sanora) port="5321" ;;
        
        *) 
            echo "ERROR: Unknown service $service for base $base_name" >&2
            return 1
            ;;
    esac
    
    echo "https://$hostname:$port"
}

# Function to export environment variables for test scripts
export_ngrok_urls() {
    echo "# ngrok environment variables for Planet Nine ecosystem testing"
    echo "# Source this with: source <(./get-ngrok-urls.sh --export)"
    echo ""
    
    if [ ! -f "$TUNNEL_URLS_FILE" ]; then
        echo "echo 'ERROR: No tunnel URLs file found. Run ./setup-ngrok-tunnels.sh first' >&2"
        return 1
    fi
    
    # Export base URLs
    local base1_url=$(get_base_url "base1" 2>/dev/null)
    local base2_url=$(get_base_url "base2" 2>/dev/null)
    local base3_url=$(get_base_url "base3" 2>/dev/null)
    
    if [ -n "$base1_url" ]; then
        echo "export NGROK_BASE1_URL='$base1_url'"
    fi
    if [ -n "$base2_url" ]; then
        echo "export NGROK_BASE2_URL='$base2_url'"
    fi
    if [ -n "$base3_url" ]; then
        echo "export NGROK_BASE3_URL='$base3_url'"
    fi
    
    echo "export NGROK_MODE=true"
    echo "echo '✅ ngrok environment variables exported'"
}

# Function to display help
show_help() {
    echo "Usage: $0 [OPTIONS] [BASE] [SERVICE]"
    echo ""
    echo "Get ngrok tunnel URLs for Planet Nine ecosystem testing"
    echo ""
    echo "Options:"
    echo "  --export           Export environment variables for test scripts"
    echo "  --list             List all available tunnels"  
    echo "  --help             Show this help message"
    echo ""
    echo "Arguments:"
    echo "  BASE               base1, base2, or base3"
    echo "  SERVICE            Service name (julia, sanora, bdo, etc.)"
    echo ""
    echo "Examples:"
    echo "  $0 base1                    # Get base1 tunnel URL"
    echo "  $0 base1 sanora            # Get base1 sanora service URL"
    echo "  $0 --list                  # List all available tunnels"
    echo "  source <($0 --export)      # Export variables for testing"
}

# Function to list all tunnels
list_tunnels() {
    echo "🌍 Active ngrok Tunnels:"
    echo "======================="
    
    if [ ! -f "$TUNNEL_URLS_FILE" ]; then
        echo "❌ No tunnel URLs file found. Run ./setup-ngrok-tunnels.sh first"
        return 1
    fi
    
    while IFS=: read -r base tunnel_url ports pid; do
        echo ""
        echo "📍 $base:"
        echo "   URL: $tunnel_url"  
        echo "   Ports: $ports"
        echo "   PID: $pid"
        
        # Show service URLs for this base
        echo "   Services:"
            service_url=$(get_service_url "$base" "$service" 2>/dev/null)
            if [ $? -eq 0 ]; then
                printf "     %-12s %s\n" "$service:" "$service_url"
            fi
        done
    done < "$TUNNEL_URLS_FILE"
}

# Parse command line arguments
case "$1" in
    --export)
        export_ngrok_urls
        ;;
    --list)
        list_tunnels
        ;;
    --help)
        show_help
        ;;
    "")
        show_help
        ;;
    *)
        if [ -n "$2" ]; then
            # Get service URL
            get_service_url "$1" "$2"
        else
            # Get base URL
            get_base_url "$1"
        fi
        ;;
esac