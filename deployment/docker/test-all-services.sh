#!/bin/bash

# Enhanced test-em-all script for Docker deployment testing
# Usage: ./test-all-services.sh [PORT_OFFSET] [--continue-on-failure]
# 
# PORT_OFFSET: Offset for service ports (1000, 2000, 3000 for bases 1, 2, 3)
# --continue-on-failure: Don't abort on first test failure (set CONTINUE_ON_FAILURE=true)

set -e  # Exit on any error by default

PORT_OFFSET=${1:-0}
CONTINUE_ON_FAILURE=${CONTINUE_ON_FAILURE:-false}

# Parse command line arguments
for arg in "$@"; do
  case $arg in
    --continue-on-failure)
      CONTINUE_ON_FAILURE=true
      shift
      ;;
    [0-9]*)
      PORT_OFFSET=$arg
      shift
      ;;
  esac
done

echo "🧪 Planet Nine Service Testing"
echo "============================="
echo "PORT_OFFSET: $PORT_OFFSET"
echo "CONTINUE_ON_FAILURE: $CONTINUE_ON_FAILURE"
echo ""

# Override exit on error if continue-on-failure is enabled
if [ "$CONTINUE_ON_FAILURE" = "true" ]; then
  set +e
fi

# Calculate service ports based on offset (using host port mappings)
# Maps PORT_OFFSET to actual host ports where services are exposed
case $PORT_OFFSET in
  1000)
    # Base 1: Host ports 5111-5122
    JULIA_PORT=5111
    CONTINUEBEE_PORT=5112
    PREF_PORT=5113
    BDO_PORT=5114
    JOAN_PORT=5115
    ADDIE_PORT=5116
    FOUNT_PORT=5117
    DOLORES_PORT=5118
    MINNIE_PORT=5119
    ARETHA_PORT=5120
    SANORA_PORT=5121
    ;;
  2000)
    # Base 2: Host ports 5211-5222
    JULIA_PORT=5211
    CONTINUEBEE_PORT=5212
    PREF_PORT=5213
    BDO_PORT=5214
    JOAN_PORT=5215
    ADDIE_PORT=5216
    FOUNT_PORT=5217
    DOLORES_PORT=5218
    MINNIE_PORT=5219
    ARETHA_PORT=5220
    SANORA_PORT=5221
    ;;
  3000)
    # Base 3: Host ports 5311-5322
    JULIA_PORT=5311
    CONTINUEBEE_PORT=5312
    PREF_PORT=5313
    BDO_PORT=5314
    JOAN_PORT=5315
    ADDIE_PORT=5316
    FOUNT_PORT=5317
    DOLORES_PORT=5318
    MINNIE_PORT=5319
    ARETHA_PORT=5320
    SANORA_PORT=5321
    ;;
  *)
    echo "❌ Unknown PORT_OFFSET: $PORT_OFFSET. Expected 1000, 2000, or 3000."
    exit 1
    ;;
esac

echo "🔧 Service Port Mapping:"
echo "  julia: localhost:$JULIA_PORT"
echo "  continuebee: localhost:$CONTINUEBEE_PORT"
echo "  pref: localhost:$PREF_PORT"
echo "  bdo: localhost:$BDO_PORT"
echo "  joan: localhost:$JOAN_PORT"
echo "  addie: localhost:$ADDIE_PORT"
echo "  fount: localhost:$FOUNT_PORT"
echo "  dolores: localhost:$DOLORES_PORT"
echo "  minnie: localhost:$MINNIE_PORT"
echo "  aretha: localhost:$ARETHA_PORT"
echo "  sanora: localhost:$SANORA_PORT"
echo ""

# Function to run a test with proper error handling
run_test() {
  local service=$1
  local test_file=$2
  local base_url=$3
  
  echo "🧪 Testing $service ($base_url)..."
  
  # Set environment variables for the test
  export BASE_URL="$base_url"
  export SERVICE_NAME="$service"
  
  # Run the test
  local test_result=0
  if command -v npx >/dev/null 2>&1; then
    npx mocha "$test_file" || test_result=$?
  else
    echo "⚠️  npx not found, installing..."
    npm install -g mocha || test_result=$?
    if [ $test_result -eq 0 ]; then
      npx mocha "$test_file" || test_result=$?
    fi
  fi
  
  if [ $test_result -eq 0 ]; then
    echo "✅ $service tests passed"
    return 0
  else
    echo "❌ $service tests failed (exit code: $test_result)"
    if [ "$CONTINUE_ON_FAILURE" = "false" ]; then
      echo "🛑 Aborting due to test failure. Use --continue-on-failure to override."
      exit $test_result
    else
      echo "⏭️  Continuing despite failure..."
      return $test_result
    fi
  fi
}

# Track test results
declare -a FAILED_TESTS=()
TOTAL_TESTS=0
PASSED_TESTS=0

# Run all service tests
echo "🚀 Starting service tests..."
echo ""

# Test Addie
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "addie" "/usr/src/app/addie/test/mocha/server.js" "http://127.0.0.1:$ADDIE_PORT/"; then
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  FAILED_TESTS+=("addie")
fi
echo ""

# Test Aretha
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "aretha" "/usr/src/app/aretha/test/mocha/server.js" "http://127.0.0.1:$ARETHA_PORT/"; then
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  FAILED_TESTS+=("aretha")
fi
echo ""

# Test BDO
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "bdo" "/usr/src/app/bdo/test/mocha/server.js" "http://127.0.0.1:$BDO_PORT/"; then
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  FAILED_TESTS+=("bdo")
fi
echo ""

# Test ContinueBee
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "continuebee" "/usr/src/app/continuebee/test/mocha/server.js" "http://127.0.0.1:$CONTINUEBEE_PORT/"; then
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  FAILED_TESTS+=("continuebee")
fi
echo ""

# Test Dolores
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "dolores" "/usr/src/app/dolores/test/mocha/server.js" "http://127.0.0.1:$DOLORES_PORT/"; then
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  FAILED_TESTS+=("dolores")
fi
echo ""

# Test Fount
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "fount" "/usr/src/app/fount/test/mocha/server.js" "http://127.0.0.1:$FOUNT_PORT/"; then
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  FAILED_TESTS+=("fount")
fi
echo ""

# Test Joan
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "joan" "/usr/src/app/joan/test/mocha/server.js" "http://127.0.0.1:$JOAN_PORT/"; then
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  FAILED_TESTS+=("joan")
fi
echo ""

# Test Julia
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "julia" "/usr/src/app/julia/test/mocha/server.js" "http://127.0.0.1:$JULIA_PORT/"; then
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  FAILED_TESTS+=("julia")
fi
echo ""

# Test Pref
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "pref" "/usr/src/app/pref/test/mocha/server.js" "http://127.0.0.1:$PREF_PORT/"; then
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  FAILED_TESTS+=("pref")
fi
echo ""

# Test Sanora
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "sanora" "/usr/src/app/sanora/test/mocha/server.js" "http://127.0.0.1:$SANORA_PORT/"; then
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  FAILED_TESTS+=("sanora")
fi
echo ""

# Final test report
echo "📊 Test Results Summary"
echo "======================"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $((TOTAL_TESTS - PASSED_TESTS))"
echo ""

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
  echo "🎉 All tests passed!"
  exit 0
else
  echo "❌ Failed services:"
  for service in "${FAILED_TESTS[@]}"; do
    echo "  - $service"
  done
  echo ""
  
  if [ "$CONTINUE_ON_FAILURE" = "true" ]; then
    echo "⚠️  Some tests failed, but continuing due to --continue-on-failure flag"
    exit 0
  else
    echo "🛑 Tests failed. Set CONTINUE_ON_FAILURE=true environment variable to ignore failures."
    exit 1
  fi
fi