#!/bin/bash

# Single-base allyabase deployment for production testing
# Usage: ./start-single-base.sh [--clean] [--build] [--seed] [--enable-prof]

set -e  # Exit on any error

CLEAN=false
BUILD=false
SEED=false
ENABLE_PROF=false

# Parse command line arguments
for arg in "$@"; do
  case $arg in
    --clean)
      CLEAN=true
      shift
      ;;
    --build)
      BUILD=true
      shift
      ;;
    --seed)
      SEED=true
      shift
      ;;
    --enable-prof)
      ENABLE_PROF=true
      shift
      ;;
    -h|--help)
      echo "Planet Nine Single-Base Deployment"
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --clean              Clean up existing container before starting"
      echo "  --build              Build Docker image before starting"
      echo "  --seed               Seed the environment with sample data"
      echo "  --enable-prof        Enable prof service (profile management)"
      echo "  -h, --help           Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0 --clean --build --seed"
      echo "  $0 --seed"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: $0 [--clean] [--build] [--seed] [--enable-prof]"
      echo "Use --help for detailed options"
      exit 1
      ;;
  esac
done

echo "🚀 Planet Nine Single-Base Deployment"
echo "======================================"
if [ "$SEED" = true ]; then
  echo "Seeding: Enabled"
else
  echo "Seeding: Disabled"
fi
if [ "$ENABLE_PROF" = true ]; then
  echo "Prof Service: Enabled"
else
  echo "Prof Service: Disabled"
fi
echo ""

# Clean up existing container if requested
if [ "$CLEAN" = true ]; then
  echo "🧹 Cleaning up existing container..."

  if docker ps -a --format 'table {{.Names}}' | grep -q "^allyabase-single$"; then
    echo "  Stopping and removing allyabase-single..."
    docker stop allyabase-single >/dev/null 2>&1 || true
    docker rm allyabase-single >/dev/null 2>&1 || true
  fi

  echo "✅ Cleanup completed"
  echo ""
fi

# Build Docker image if requested
if [ "$BUILD" = true ]; then
  echo "🔨 Building allyabase Docker image..."
  # Build from planet-nine root directory so COPY paths work correctly
  cd ../../../
  docker build -f allyabase/deployment/docker/Dockerfile-flexible -t allyabase-flexible .
  cd allyabase/deployment/docker
  echo "✅ Docker image built successfully"
  echo ""
fi

# Function to check if a port is responding
check_port() {
  local host=$1
  local port=$2
  local timeout=${3:-30}

  for i in $(seq 1 $timeout); do
    if nc -z $host $port 2>/dev/null; then
      return 0
    fi
    sleep 1
  done
  return 1
}

# Function to wait for all services to be ready
wait_for_services() {

  echo "  ⏳ Waiting for services to be ready..."

  for service in "${services[@]}"; do
    IFS=':' read -r port name <<< "$service"
    if ! check_port localhost $port 60; then
      echo "  ❌ Service $name on port $port failed to start"
      return 1
    fi
    echo "  ✅ $name ready (port $port)"
  done

  # Check prof if enabled
  if [ "$ENABLE_PROF" = true ]; then
    if ! check_port localhost 3008 60; then
      echo "  ❌ Prof service on port 3008 failed to start"
      return 1
    fi
    echo "  ✅ prof ready (port 3008)"
  fi

  return 0
}

# Build prof port arguments
PROF_PORTS=""
if [ "$ENABLE_PROF" = true ]; then
  PROF_PORTS="-p 3008:3008"
fi

# Start single base with standard ports (no offset)
echo "🏗️  Starting single allyabase instance..."
if [ "$ENABLE_PROF" = true ]; then
  echo "   Prof enabled on port 3008"
fi
echo "   Wiki enabled on port 3333"
echo ""

docker run -d \
  --name allyabase-single \
  -e ENABLE_PROF=$ENABLE_PROF \
  -e PORT_OFFSET=0 \
  -p 3000:3000 \
  -p 2999:2999 \
  -p 3002:3002 \
  -p 3003:3003 \
  -p 3004:3004 \
  -p 3005:3005 \
  -p 3006:3006 \
  -p 3007:3007 \
  -p 2525:2525 \
  -p 7277:7277 \
  -p 7243:7243 \
  -p 3011:3011 \
  -p 3333:3333 \
  $PROF_PORTS \
  allyabase-flexible

# Wait for services to be ready
if ! wait_for_services; then
  echo "❌ Service startup failed"
  echo ""
  echo "📋 View logs with: docker logs allyabase-single"
  exit 1
fi

echo ""
echo "✅ Single allyabase instance started successfully!"
echo ""
echo "📋 Service URLs:"
echo "  julia:       http://localhost:3000"
echo "  continuebee: http://localhost:2999"
echo "  pref:        http://localhost:3002"
echo "  bdo:         http://localhost:3003"
echo "  joan:        http://localhost:3004"
echo "  addie:       http://localhost:3005"
echo "  fount:       http://localhost:3006"
echo "  dolores:     http://localhost:3007"
echo "  minnie:      http://localhost:2525"
echo "  aretha:      http://localhost:7277"
echo "  sanora:      http://localhost:7243"
echo "  wiki:        http://localhost:3333"
if [ "$ENABLE_PROF" = true ]; then
  echo "  prof:        http://localhost:3008"
fi
echo ""
echo "🛠️  Management Commands:"
echo "  View logs:   docker logs allyabase-single"
echo "  Follow logs: docker logs -f allyabase-single"
echo "  Stop:        docker stop allyabase-single"
echo "  Remove:      docker rm allyabase-single"
echo "  Restart:     ./start-single-base.sh --clean"
echo ""

# Handle seeding
if [ "$SEED" = true ]; then
  echo "🌱 Starting ecosystem seeding..."

  # Check if Node.js is available
  if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required for seeding but not found"
    echo "   Please install Node.js to use the seeding feature"
    exit 1
  fi

  # Check if seed script exists
  if [ ! -f "seed-ecosystem.js" ]; then
    echo "❌ Seed script not found: seed-ecosystem.js"
    echo "   Please ensure you're running from the correct directory"
    exit 1
  fi

  # Wait a moment for services to fully stabilize
  echo "⏳ Waiting 10 seconds for services to stabilize..."
  sleep 10

  # Run seeding for single base (use localhost URLs, not base numbers)
  echo "🌱 Running ecosystem seeder..."
  node seed-ecosystem.js local

  if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Ecosystem seeding complete!"
    echo ""
    echo "🔗 Seeded Services:"
    echo "  BDO:      http://localhost:3003 (storage)"
    echo "  Sanora:   http://localhost:7243 (products & blogs)"
    echo "  Dolores:  http://localhost:3007 (media)"
    echo "  Covenant: http://localhost:3011 (contracts)"
  else
    echo "❌ Seeding failed. Please check the output above for errors."
    echo "   Services may need more time to start or there may be connection issues."
  fi
fi

echo ""
echo "✨ Setup complete! Your single Planet Nine base is ready for testing."
if [ "$SEED" = false ]; then
  echo "💡 Tip: Use --seed flag next time to populate with sample data"
fi
