# Allyabase Integrated Testing System

## Overview

This directory contains a comprehensive Docker-based testing system that integrates the original `test-em-all.sh` functionality directly into Docker containers. This ensures reproducible testing across different environments and enables automated testing of multiple allyabase instances.

## Architecture

### Testing Integration Strategy
1. **Docker-Based Testing**: All tests run inside Docker containers for reproducibility
2. **Flexible Port Configuration**: Tests adapt to different port configurations via environment variables
3. **Fail-Fast or Continue**: Configurable behavior for test failures
4. **Multi-Base Testing**: Sequential testing of all 3 bases with isolated environments

### Key Components

#### Core Scripts
- `test-all-services.sh` - Enhanced version of test-em-all.sh with port offset support
- `patch-test-urls.sh` - Updates service test files to use flexible BASE_URL configuration
- `run-tests-and-services.sh` - Main orchestrator that starts services and runs tests
- `test-all-bases.sh` - High-level script to test all 3 bases sequentially

#### Docker Configuration
- `Dockerfile-with-tests` - Enhanced Dockerfile with testing infrastructure
- `build-with-tests.sh` - Builds the integrated testing Docker image

## Usage

### Quick Start - Test All Bases
```bash
# Build and test all 3 bases with failure tolerance
./test-all-bases.sh --build --continue-on-failure

# Test all bases and keep services running for manual inspection
./test-all-bases.sh --build --keep-running
```

### Build Testing Image
```bash
./build-with-tests.sh
```

### Test Individual Bases

#### Base 1 (40xx ports)
```bash
docker run \
  -e PORT_OFFSET=1000 \
  -e RUN_MODE=both \
  allyabase-with-tests
```

#### Base 2 (50xx ports)
```bash
docker run \
  -e PORT_OFFSET=2000 \
  -e RUN_MODE=both \
  allyabase-with-tests
```

#### Base 3 (60xx ports)
```bash
docker run \
  -e PORT_OFFSET=3000 \
  -e RUN_MODE=both \
  allyabase-with-tests
```

### Run Services Only (for External Testing)
```bash
# Start Base 1 services and expose ports
docker run -d \
  --name base1-services \
  -e PORT_OFFSET=1000 \
  -e RUN_MODE=services \
  -p 4000-4011:4000-4011 \
  -p 3525:3525 \
  -p 3999:3999 \
  -p 8277:8277 \
  -p 8243:8243 \
  allyabase-with-tests
```

### Run Tests Against External Services
```bash
# Test against services running on host
docker run \
  -e RUN_MODE=tests \
  -e PORT_OFFSET=1000 \
  --network host \
  allyabase-with-tests
```

## Configuration

### Environment Variables

#### Core Configuration
- `PORT_OFFSET` - Port offset for services (1000, 2000, 3000 for bases 1, 2, 3)
- `RUN_MODE` - Operation mode: `"services"`, `"tests"`, or `"both"` (default: `"both"`)
- `CONTINUE_ON_FAILURE` - Continue testing despite failures: `"true"` or `"false"` (default: `"false"`)

#### Extended Configuration
- `KEEP_SERVICES_RUNNING` - Keep services running after tests complete: `"true"` or `"false"`
- `BASE_URL` - Override base URL for individual service tests

### Command Line Options

#### test-all-bases.sh
- `--build` - Rebuild Docker image before testing
- `--continue-on-failure` - Don't abort on first test failure
- `--keep-running` - Keep services running after tests complete

#### test-all-services.sh
- `--continue-on-failure` - Don't abort on first service test failure
- `[PORT_OFFSET]` - Positional argument for port offset

#### run-tests-and-services.sh
- `--services-only` - Start services only
- `--tests-only` - Run tests only (assumes services running)
- `--both` - Run both services and tests (default)

## Port Mapping

### Service Port Calculation
All services use the formula: `default_port + PORT_OFFSET`

| Service      | Default | Base 1 (+1000) | Base 2 (+2000) | Base 3 (+3000) |
|--------------|---------|----------------|----------------|----------------|
| julia        | 3000    | 4000           | 5000           | 6000           |
| continuebee  | 2999    | 3999           | 4999           | 5999           |
| pref         | 3002    | 4002           | 5002           | 6002           |
| bdo          | 3003    | 4003           | 5003           | 6003           |
| joan         | 3004    | 4004           | 5004           | 6004           |
| addie        | 3005    | 4005           | 5005           | 6005           |
| fount        | 3006    | 4006           | 5006           | 6006           |
| dolores      | 3007    | 4007           | 5007           | 6007           |
| minnie       | 2525    | 3525           | 4525           | 5525           |
| aretha       | 7277    | 8277           | 9277           | 10277          |
| sanora       | 7243    | 8243           | 9243           | 10243          |

### Test URL Configuration
Test files now support flexible URL configuration:

1. **BASE_URL environment variable** (highest priority)
2. **SUB_DOMAIN environment variable** (fallback to production URLs)
3. **Default localhost URLs** (fallback to development)

## Testing Flow

### Sequential Base Testing (`test-all-bases.sh`)
1. **Cleanup**: Remove any existing test containers
2. **Build**: Optionally rebuild the Docker image
3. **Base 1 Testing**: Start services + run tests with PORT_OFFSET=1000
4. **Base 2 Testing**: Start services + run tests with PORT_OFFSET=2000
5. **Base 3 Testing**: Start services + run tests with PORT_OFFSET=3000
6. **Results**: Comprehensive pass/fail reporting

### Individual Container Testing (`run-tests-and-services.sh`)
1. **Service Startup**: Start all allyabase services with port offset
2. **Health Checking**: Wait for core services (BDO, Fount, Julia) to be ready
3. **Test Execution**: Run comprehensive test suite against running services
4. **Result Reporting**: Detailed pass/fail analysis per service

### Service Test Execution (`test-all-services.sh`)
1. **Port Calculation**: Calculate service ports based on offset
2. **Service Testing**: Test each service individually with proper URL configuration
3. **Failure Handling**: Abort on first failure or continue based on configuration
4. **Final Report**: Summary of all test results

## Failure Handling

### Abort on Failure (Default)
- Any service test failure immediately aborts the entire test run
- Container exits with non-zero exit code
- Ideal for CI/CD pipelines requiring strict validation

### Continue on Failure Mode
- Test failures are logged but don't abort the test run
- All services are tested regardless of individual failures
- Final report shows which services passed/failed
- Useful for comprehensive system diagnostics

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Test Allyabase Ecosystem

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Test All Bases
        run: |
          cd allyabase/deployment/docker
          ./test-all-bases.sh --build
```

### Jenkins Pipeline Example
```groovy
pipeline {
    agent any
    stages {
        stage('Test Ecosystem') {
            steps {
                dir('allyabase/deployment/docker') {
                    sh './test-all-bases.sh --build --continue-on-failure'
                }
            }
        }
    }
}
```

## Troubleshooting

### Test Failures
```bash
# View detailed logs from failed container
docker logs test-base1

# Run with failure tolerance for diagnostics
./test-all-bases.sh --continue-on-failure

# Test individual services
docker run -e RUN_MODE=tests -e PORT_OFFSET=1000 allyabase-with-tests
```

### Port Conflicts
```bash
# Check for port conflicts
netstat -tlnp | grep -E ':(4000|5000|6000)'

# Clean up test containers
docker stop test-base1 test-base2 test-base3
docker rm test-base1 test-base2 test-base3
```

### Service Startup Issues
```bash
# Check service logs
docker run -e RUN_MODE=services -e PORT_OFFSET=1000 allyabase-with-tests

# Test with extended timeouts
docker run -e PORT_OFFSET=1000 -e KEEP_SERVICES_RUNNING=true allyabase-with-tests
```

## Benefits

### 1. **Reproducible Testing**
- All tests run in identical Docker environments
- No dependency on local development setup
- Consistent results across different machines

### 2. **Comprehensive Coverage**
- Tests all 10+ allyabase services
- Validates service interconnections
- Supports multi-base scenarios

### 3. **Flexible Configuration**
- Configurable port offsets for multiple bases
- Optional failure tolerance for diagnostics
- Both automated and manual testing modes

### 4. **CI/CD Ready**
- Docker-based execution
- Clear pass/fail exit codes
- Detailed logging and reporting

This integrated testing system provides a robust foundation for validating the entire Planet Nine allyabase ecosystem in a reproducible, automated manner.