#!/bin/bash

# Base test framework for Nullary applications
# Provides common functionality for testing Tauri apps against allyabase services

# Common configuration
PORT_OFFSET=${1:-0}
CONTINUE_ON_FAILURE="${CONTINUE_ON_FAILURE:-false}"
TEST_DATA_DIR="/tmp/nullary-test-data"
SCREENSHOT_DIR="/tmp/nullary-screenshots"

# Create test directories
mkdir -p "$TEST_DATA_DIR" "$SCREENSHOT_DIR"

# Calculate service URLs based on deployment type
get_service_urls() {
  local offset=$1
  
  # Check if using ngrok tunnels
  if [ "${USE_NGROK:-false}" = "true" ]; then
    echo "🌍 Using ngrok tunnel URLs for PORT_OFFSET=$offset"
    
    # Determine which base to use based on offset
    local base_name=""
    case $offset in
      1000) base_name="base1" ;;
      2000) base_name="base2" ;;
      3000) base_name="base3" ;;
      *)
        echo "❌ Unknown PORT_OFFSET: $offset. Expected 1000, 2000, or 3000."
        return 1
        ;;
    esac
    
    # Get ngrok URLs helper script path
    local get_urls_script="$(dirname "$0")/../get-ngrok-urls.sh"
    
    if [ ! -f "$get_urls_script" ]; then
      echo "❌ ngrok URLs helper script not found: $get_urls_script"
      return 1
    fi
    
    # Get service URLs from ngrok
    export JULIA_URL=$("$get_urls_script" "$base_name" "julia" 2>/dev/null || echo "ERROR")
    export CONTINUEBEE_URL=$("$get_urls_script" "$base_name" "continuebee" 2>/dev/null || echo "ERROR")
    export PREF_URL=$("$get_urls_script" "$base_name" "pref" 2>/dev/null || echo "ERROR")
    export BDO_URL=$("$get_urls_script" "$base_name" "bdo" 2>/dev/null || echo "ERROR")
    export JOAN_URL=$("$get_urls_script" "$base_name" "joan" 2>/dev/null || echo "ERROR")
    export ADDIE_URL=$("$get_urls_script" "$base_name" "addie" 2>/dev/null || echo "ERROR")
    export FOUNT_URL=$("$get_urls_script" "$base_name" "fount" 2>/dev/null || echo "ERROR")
    export DOLORES_URL=$("$get_urls_script" "$base_name" "dolores" 2>/dev/null || echo "ERROR")
    export MINNIE_URL=$("$get_urls_script" "$base_name" "minnie" 2>/dev/null || echo "ERROR")
    export ARETHA_URL=$("$get_urls_script" "$base_name" "aretha" 2>/dev/null || echo "ERROR")
    export SANORA_URL=$("$get_urls_script" "$base_name" "sanora" 2>/dev/null || echo "ERROR")

    # Check if any URLs failed to resolve
    local failed_urls=()
    for service_url in "$JULIA_URL" "$CONTINUEBEE_URL" "$PREF_URL" "$BDO_URL" "$JOAN_URL" "$ADDIE_URL" "$FOUNT_URL" "$DOLORES_URL" "$MINNIE_URL" "$ARETHA_URL" "$SANORA_URL"; do
      if [ "$service_url" = "ERROR" ] || [ -z "$service_url" ]; then
        failed_urls+=("$service_url")
      fi
    done
    
    if [ ${#failed_urls[@]} -gt 0 ]; then
      echo "❌ Failed to resolve some ngrok URLs. Are tunnels running?"
      echo "   Run: ../setup-ngrok-tunnels.sh"
      return 1
    fi
    
  else
    echo "🔗 Using dev deployment URLs for PORT_OFFSET=$offset"
    
    case $offset in
      1000|2000|3000)
        # Use dev deployment for all bases - same services, different logical separation for testing
        export JULIA_URL="https://dev.julia.allyabase.com"
        export CONTINUEBEE_URL="https://dev.continuebee.allyabase.com"
        export PREF_URL="https://dev.pref.allyabase.com"
        export BDO_URL="https://dev.bdo.allyabase.com"
        export JOAN_URL="https://dev.joan.allyabase.com"
        export ADDIE_URL="https://dev.addie.allyabase.com"
        export FOUNT_URL="https://dev.fount.allyabase.com"
        export DOLORES_URL="https://dev.dolores.allyabase.com"
        export MINNIE_URL="https://dev.minnie.allyabase.com"
        export ARETHA_URL="https://dev.aretha.allyabase.com"
        export SANORA_URL="https://dev.sanora.allyabase.com"
        ;;
      *)
        echo "❌ Unknown PORT_OFFSET: $offset. Expected 1000, 2000, or 3000."
        return 1
        ;;
    esac
  fi
  
  echo "Service URLs for PORT_OFFSET=$offset:"
  echo "  JULIA: $JULIA_URL"
  echo "  CONTINUEBEE: $CONTINUEBEE_URL"
  echo "  PREF: $PREF_URL"
  echo "  BDO: $BDO_URL"
  echo "  JOAN: $JOAN_URL"
  echo "  ADDIE: $ADDIE_URL"
  echo "  FOUNT: $FOUNT_URL"
  echo "  DOLORES: $DOLORES_URL"
  echo "  MINNIE: $MINNIE_URL"
  echo "  ARETHA: $ARETHA_URL"
  echo "  SANORA: $SANORA_URL"
}

# Check if service is responding
check_service() {
  local service_url=$1
  local service_name=$2
  local timeout=${3:-10}
  
  echo "  Checking $service_name at $service_url..."
  
  for i in $(seq 1 $timeout); do
    if curl -k -s --connect-timeout 2 "$service_url" >/dev/null 2>&1; then
      echo "  ✅ $service_name is responding"
      return 0
    fi
    sleep 1
  done
  
  echo "  ❌ $service_name is not responding after ${timeout}s"
  return 1
}

# Verify all required services are running
verify_services() {
  local offset=$1
  
  echo "🔍 Verifying allyabase services are running..."
  
  get_service_urls $offset
  
  local failed_services=()
  
  # Core services for Nullary apps
  if ! check_service "$BDO_URL" "BDO"; then
    failed_services+=("BDO")
  fi
  
  if ! check_service "$FOUNT_URL" "Fount"; then
    failed_services+=("Fount")
  fi
  
  if ! check_service "$SANORA_URL" "Sanora"; then
    failed_services+=("Sanora")
  fi
  
  # Additional services for complete functionality
  if ! check_service "$JULIA_URL" "Julia"; then
    failed_services+=("Julia")
  fi
  
  if ! check_service "$ADDIE_URL" "Addie"; then
    failed_services+=("Addie")
  fi
  
  if ! check_service "$CONTINUEBEE_URL" "Continuebee"; then
    failed_services+=("Continuebee")
  fi
  
  if [ ${#failed_services[@]} -eq 0 ]; then
    echo "✅ All required services are running"
    return 0
  else
    echo "❌ Failed services: ${failed_services[*]}"
    return 1
  fi
}

# Generate test sessionless keys
generate_test_keys() {
  local app_name=$1
  local key_file="$TEST_DATA_DIR/${app_name}_keys.json"
  
  echo "🔑 Generating test keys for $app_name..."
  
  # Create a simple test key (in real implementation would use sessionless)
  local test_private_key="b75011b167c5e3a6b0de97d8e1950cd9548f83bb67f47112bed6a082db795496"
  local test_public_key="03a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd"
  local test_uuid="test-user-$(date +%s)-$((RANDOM % 9000 + 1000))"
  
  cat > "$key_file" << EOF
{
  "privateKey": "$test_private_key",
  "publicKey": "$test_public_key", 
  "uuid": "$test_uuid",
  "address": "0x1234567890123456789012345678901234567890"
}
EOF
  
  echo "  ✅ Keys generated: $key_file"
  export TEST_KEYS_FILE="$key_file"
}

# Launch Tauri application in background
launch_tauri_app() {
  local app_path=$1
  local app_name=$2
  local config_overrides=${3:-""}
  
  echo "🚀 Launching $app_name Tauri application..."
  
  if [ ! -d "$app_path" ]; then
    echo "  ❌ App directory not found: $app_path"
    return 1
  fi
  
  cd "$app_path"
  
  # Set environment variables for the app to use dev deployment URLs
  export TAURI_ENV_BDO_URL="$BDO_URL"
  export TAURI_ENV_FOUNT_URL="$FOUNT_URL"
  export TAURI_ENV_SANORA_URL="$SANORA_URL"
  export TAURI_ENV_JULIA_URL="$JULIA_URL"
  export TAURI_ENV_ADDIE_URL="$ADDIE_URL"
  export TAURI_ENV_DOLORES_URL="$DOLORES_URL"
  
  # Launch app in development mode (background)
  local log_file="$TEST_DATA_DIR/${app_name}_tauri.log"
  echo "  Starting Tauri dev server (logs: $log_file)..."
  
  npm run tauri dev > "$log_file" 2>&1 &
  local tauri_pid=$!
  
  # Wait for app to start
  echo "  Waiting for app to initialize..."
  sleep 10
  
  # Check if process is still running
  if kill -0 $tauri_pid 2>/dev/null; then
    echo "  ✅ $app_name launched successfully (PID: $tauri_pid)"
    export TAURI_PID=$tauri_pid
    export TAURI_LOG_FILE="$log_file"
    return 0
  else
    echo "  ❌ $app_name failed to start"
    echo "  Last log entries:"
    tail -10 "$log_file"
    return 1
  fi
}

# Stop Tauri application
stop_tauri_app() {
  local app_name=$1
  
  if [ -n "$TAURI_PID" ]; then
    echo "🛑 Stopping $app_name (PID: $TAURI_PID)..."
    
    # Try graceful shutdown first
    kill $TAURI_PID 2>/dev/null
    sleep 3
    
    # Force kill if still running
    if kill -0 $TAURI_PID 2>/dev/null; then
      kill -9 $TAURI_PID 2>/dev/null
    fi
    
    echo "  ✅ $app_name stopped"
  fi
}

# Create test content for an app
create_test_content() {
  local app_name=$1
  local content_type=$2
  local content_data="$3"
  
  echo "📝 Creating test $content_type for $app_name..."
  
  local content_file="$TEST_DATA_DIR/${app_name}_${content_type}.json"
  
  cat > "$content_file" << EOF
{
  "app": "$app_name",
  "type": "$content_type",
  "data": $content_data,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "testId": "test-$(date +%s)"
}
EOF
  
  echo "  ✅ Test content created: $content_file"
  export TEST_CONTENT_FILE="$content_file"
}

# Simulate user interactions (basic automation)
simulate_click() {
  local element_selector=$1
  local app_name=$2
  
  echo "  🖱️  Simulating click on '$element_selector' in $app_name"
  # In a real implementation, this would use browser automation tools
  # For now, just log the action
  echo "    [SIMULATED] Click: $element_selector"
}

simulate_text_input() {
  local element_selector=$1
  local text=$2
  local app_name=$3
  
  echo "  ⌨️  Simulating text input '$text' in '$element_selector' for $app_name"
  echo "    [SIMULATED] Input: $element_selector = '$text'"
}

# Take screenshot for test evidence
take_screenshot() {
  local app_name=$1
  local test_phase=$2
  local screenshot_file="$SCREENSHOT_DIR/${app_name}_${test_phase}_$(date +%s).png"
  
  echo "  📸 Taking screenshot: $screenshot_file"
  # In real implementation would capture actual screenshot
  echo "    [SIMULATED] Screenshot saved: $screenshot_file"
  export LAST_SCREENSHOT="$screenshot_file"
}

# Test result tracking
declare -a TEST_RESULTS=()
CURRENT_TEST=""

start_test() {
  local test_name=$1
  CURRENT_TEST="$test_name"
  echo ""
  echo "🧪 Starting test: $test_name"
}

pass_test() {
  local message=${1:-"Test passed"}
  echo "  ✅ $CURRENT_TEST: $message"
  TEST_RESULTS+=("PASS:$CURRENT_TEST:$message")
}

fail_test() {
  local message=${1:-"Test failed"}
  echo "  ❌ $CURRENT_TEST: $message"
  TEST_RESULTS+=("FAIL:$CURRENT_TEST:$message")
  
  if [ "$CONTINUE_ON_FAILURE" = "false" ]; then
    echo "  🛑 Aborting due to test failure"
    exit 1
  fi
}

# Generate test report
generate_test_report() {
  local app_name=$1
  local report_file="$TEST_DATA_DIR/${app_name}_test_report.txt"
  
  echo ""
  echo "📊 Test Report for $app_name"
  echo "========================" | tee "$report_file"
  
  local total_tests=${#TEST_RESULTS[@]}
  local passed_tests=0
  local failed_tests=0
  
  for result in "${TEST_RESULTS[@]}"; do
    local status=$(echo "$result" | cut -d: -f1)
    local test_name=$(echo "$result" | cut -d: -f2)
    local message=$(echo "$result" | cut -d: -f3-)
    
    echo "$status: $test_name - $message" | tee -a "$report_file"
    
    if [ "$status" = "PASS" ]; then
      passed_tests=$((passed_tests + 1))
    else
      failed_tests=$((failed_tests + 1))
    fi
  done
  
  echo "" | tee -a "$report_file"
  echo "Summary: $passed_tests passed, $failed_tests failed, $total_tests total" | tee -a "$report_file"
  
  if [ $failed_tests -eq 0 ]; then
    echo "🎉 All tests passed for $app_name!" | tee -a "$report_file"
    return 0
  else
    echo "❌ $failed_tests test(s) failed for $app_name" | tee -a "$report_file"
    return 1
  fi
}

# Cleanup function
cleanup_test() {
  local app_name=$1
  
  echo ""
  echo "🧹 Cleaning up test environment for $app_name..."
  
  # Stop Tauri app if running
  stop_tauri_app "$app_name"
  
  # Optionally clean up test data (keep for debugging by default)
  if [ "${CLEANUP_TEST_DATA:-false}" = "true" ]; then
    rm -rf "$TEST_DATA_DIR"
    rm -rf "$SCREENSHOT_DIR"
    echo "  ✅ Test data cleaned up"
  else
    echo "  💾 Test data preserved in $TEST_DATA_DIR"
  fi
}

# Export all functions for use in individual test scripts
export -f get_service_urls check_service verify_services generate_test_keys
export -f launch_tauri_app stop_tauri_app create_test_content
export -f simulate_click simulate_text_input take_screenshot
export -f start_test pass_test fail_test generate_test_report cleanup_test