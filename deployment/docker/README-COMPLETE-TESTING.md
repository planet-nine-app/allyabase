# Planet Nine Complete Ecosystem Testing System

## Overview

This directory contains the most comprehensive testing system for the Planet Nine ecosystem, encompassing allyabase microservices, Nullary applications, and cross-base interactions. The system provides end-to-end validation of the entire distributed, privacy-focused web infrastructure.

## Architecture

### 5-Phase Testing Strategy

1. **Infrastructure Setup** - Start 3 allyabase instances with different port configurations
2. **Service Validation** - Test all 12+ microservices across all bases
3. **Application Testing** - Validate all Nullary applications on each base
4. **Cross-Base Interaction** - Test P2P connections and content aggregation across bases
5. **Integration Validation** - Generate comprehensive reports and validate ecosystem health

### Testing Components

#### Core Infrastructure
- **Docker-based allyabase instances** - 3 independent bases with port offsets
- **Service health checking** - Automatic validation of all microservices
- **Sequential startup** - Fail-fast approach with detailed logging

#### Application Testing
- **14 Nullary applications** - Complete test coverage of The Nullary ecosystem
- **Tauri integration testing** - Desktop app launch and interaction validation
- **Content creation workflows** - End-to-end content management testing

#### Cross-Base Validation
- **StackChat P2P connections** - Cross-base messaging with cryptographic handshakes
- **MyBase aggregation** - Multi-base content aggregation testing
- **Service interoperability** - Cross-base service integration validation

## Quick Start

### Complete Ecosystem Test (Recommended)
```bash
# Run full ecosystem validation
./test-complete-ecosystem.sh

# With failure tolerance for debugging
./test-complete-ecosystem.sh --continue-on-failure

# Test specific app categories
./test-complete-ecosystem.sh --apps=core

# Skip cross-base testing for faster runs
./test-complete-ecosystem.sh --no-cross-base
```

### Individual Test Components

#### Test All Bases (Infrastructure Only)
```bash
./test-all-bases.sh --build --continue-on-failure
```

#### Test Specific Base Services
```bash
./test-all-services.sh 1000  # Base 1
./test-all-services.sh 2000  # Base 2  
./test-all-services.sh 3000  # Base 3
```

#### Test Nullary Applications
```bash
cd nullary-tests

# Test all apps on Base 1
./test-all-nullary-apps.sh 1000

# Test specific apps
./test-all-nullary-apps.sh 1000 --apps=rhapsold,stackchat,lexary

# Test individual apps
./test-rhapsold.sh 1000
./test-stackchat.sh 1000
./test-photary.sh 1000
```

## Configuration Options

### Environment Variables

#### Global Configuration
- `CONTINUE_ON_FAILURE=true` - Continue testing despite failures
- `CLEANUP_AFTER_TEST=true` - Clean up Docker containers after testing

#### Application Testing
- `NULLARY_APPS=core` - Which apps to test: `all`, `core`, `basic`, or comma-separated list
- `SELECTED_APPS=rhapsold,stackchat` - Specific apps for nullary testing

#### Cross-Base Testing
- `CROSS_BASE_TESTING=false` - Skip cross-base interaction testing

### Command Line Options

#### Complete Ecosystem Test
- `--continue-on-failure` - Don't abort on first failure
- `--apps=SELECTION` - Apps to test (all, core, basic, or app1,app2,...)
- `--no-cross-base` - Skip cross-base interaction testing
- `--cleanup` - Clean up all containers after testing

#### Individual Test Scripts
- `--continue-on-failure` - Continue despite test failures
- `--build` - Rebuild Docker images before testing
- `--keep-running` - Keep services running after tests

## Application Test Coverage

### Flagship Applications (Core Set)
- **rhapsold** - Minimalist blogging platform (reference implementation)
- **stackchat** - P2P messaging with RPG-style interfaces
- **lexary** - Microblogging and short-form content
- **photary** - Photo sharing and gallery management
- **ninefy** - Marketplace and e-commerce platform

### Social Applications
- **mybase** - Social networking aggregation across bases
- **screenary** - Multi-purpose social app
- **postary** - General posting and sharing
- **blogary** - Traditional blogging

### Specialized Applications
- **eventary** - Event management and scheduling
- **idothis** - Business service listings
- **viewary** / **viewaris** - Video sharing platforms
- **wikiary** - Wiki and knowledge sharing

### Test Coverage Per Application
Each application test validates:
- ✅ **Application Launch** - Tauri app startup and initialization
- ✅ **Base Connection** - Integration with allyabase services (BDO, Fount, Sanora)
- ✅ **Content Creation** - App-specific content creation workflows
- ✅ **Content Management** - CRUD operations and data persistence
- ✅ **User Interactions** - UI/UX functionality and user flows
- ✅ **Service Integration** - Proper use of allyabase microservices
- ✅ **Error Handling** - Graceful failure and recovery scenarios

## Port Mapping System

### Base Port Ranges
- **Base 1**: Host ports 5111-5122 → Docker ports 3000-3011, 2999, 2525, 7277, 7243 (PORT_OFFSET=1000)
- **Base 2**: Host ports 5211-5222 → Docker ports 4000-4011, 3999, 3525, 8277, 8243 (PORT_OFFSET=2000)
- **Base 3**: Host ports 5311-5322 → Docker ports 5000-5011, 4999, 4525, 9277, 9243 (PORT_OFFSET=3000)

### Service URLs by Base

| Service     | Base 1     | Base 2     | Base 3     | Docker Port Mapping |
|-------------|------------|------------|------------|---------------------|
| julia       | :5111      | :5211      | :5311      | 3000 + PORT_OFFSET |
| continuebee | :5112      | :5212      | :5312      | 2999 + PORT_OFFSET |
| pref        | :5113      | :5213      | :5313      | 3002 + PORT_OFFSET |
| bdo         | :5114      | :5214      | :5314      | 3003 + PORT_OFFSET |
| joan        | :5115      | :5215      | :5315      | 3004 + PORT_OFFSET |
| addie       | :5116      | :5216      | :5316      | 3005 + PORT_OFFSET |
| fount       | :5117      | :5217      | :5317      | 3006 + PORT_OFFSET |
| dolores     | :5118      | :5218      | :5318      | 3007 + PORT_OFFSET |
| minnie      | :5119      | :5219      | :5319      | 2525 + PORT_OFFSET |
| aretha      | :5120      | :5220      | :5320      | 7277 + PORT_OFFSET |
| sanora      | :5121      | :5221      | :5321      | 7243 + PORT_OFFSET |

## Cross-Base Testing Scenarios

### StackChat P2P Testing
- **User on Base 1** connects to **User on Base 2**
- **User on Base 1** connects to **User on Base 3**
- Tests joint BDO creation for cross-base messaging

### MyBase Aggregation Testing
- Connects to multiple bases simultaneously
- Aggregates content from different sources
- Tests unified social feed across bases
- Validates cross-base user interactions

### Content Sharing Testing
- Create content on Base 1, verify visibility on Base 2
- Test teleportation content discovery across bases
- Validate cross-base user following and interactions

## Test Results and Reporting

### Individual Test Reports
Each test generates detailed reports in `/tmp/nullary-test-data/`:
- `{app_name}_test_report.txt` - Per-application test results
- `{app_name}_{test_phase}_{timestamp}.png` - Screenshots (simulated)
- `{app_name}_keys.json` - Test sessionless keys
- `{app_name}_tauri.log` - Application startup logs

### Master Ecosystem Report
Complete ecosystem tests generate comprehensive reports:
- `/tmp/planet-nine-ecosystem-report-{timestamp}.txt` - Master test report
- Phase-by-phase results with timing information
- Overall ecosystem health assessment
- Detailed failure analysis and recommendations

### Logging and Debugging
- **Container logs**: `docker logs {container-name}`
- **Service logs**: Individual service startup and operation logs
- **Application logs**: Tauri application debug information
- **Test framework logs**: Step-by-step test execution details

## Success Criteria

### Complete Ecosystem Validation Requires:
- ✅ **All 3 bases start successfully** with full service stacks
- ✅ **All 12+ microservices** pass individual validation tests
- ✅ **Selected Nullary applications** launch and function correctly
- ✅ **Cross-base P2P connections** establish successfully (StackChat)
- ✅ **Content aggregation** works across multiple bases (MyBase)
- ✅ **No service crashes** or connection failures during testing
- ✅ **Clean resource management** with proper startup/shutdown

### Performance Benchmarks
- **Base startup time**: < 60 seconds per base
- **Service response time**: < 2 seconds for health checks
- **Application launch**: < 15 seconds for Tauri apps
- **Cross-base connection**: < 10 seconds for P2P handshake
- **Test execution**: < 30 minutes for complete ecosystem validation

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check for port conflicts
netstat -tlnp | grep -E ':(4000|5000|6000)'

# Stop all test containers
./stop-all-bases.sh

# Clean Docker system
docker system prune -f
```

#### Service Startup Failures
```bash
# Check container logs
docker logs allyabase-base1

# Test individual services
docker run -e PORT_OFFSET=1000 -e RUN_MODE=services allyabase-with-tests

# Rebuild with fresh images
./test-complete-ecosystem.sh --cleanup
```

#### Application Test Failures
```bash
# Run with debugging enabled
CONTINUE_ON_FAILURE=true ./test-complete-ecosystem.sh --continue-on-failure

# Test specific apps only
./test-complete-ecosystem.sh --apps=rhapsold

# Check application logs
tail -f /tmp/nullary-test-data/rhapsold_tauri.log
```

#### Cross-Base Connection Issues
```bash
# Test without cross-base functionality
./test-complete-ecosystem.sh --no-cross-base

```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Planet Nine Ecosystem Test

on: [push, pull_request]

jobs:
  ecosystem-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      
      - name: Run Complete Ecosystem Test
        run: |
          cd allyabase/deployment/docker
          ./test-complete-ecosystem.sh --continue-on-failure --cleanup
        env:
          CONTINUE_ON_FAILURE: true
          NULLARY_APPS: core
```

### Jenkins Pipeline Example
```groovy
pipeline {
    agent any
    stages {
        stage('Ecosystem Test') {
            steps {
                dir('allyabase/deployment/docker') {
                    sh './test-complete-ecosystem.sh --continue-on-failure'
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: '/tmp/planet-nine-ecosystem-report-*.txt'
                }
            }
        }
    }
}
```

## Development Workflow

### Adding New Tests
1. **Create test script** following the pattern in `nullary-tests/test-rhapsold.sh`
2. **Use test framework** by sourcing `nullary-test-framework.sh`
3. **Add to orchestrator** by updating `NULLARY_APPS` array in `test-all-nullary-apps.sh`
4. **Test integration** by running `./test-complete-ecosystem.sh --apps=new-app`

### Extending Cross-Base Testing
1. **Identify cross-base scenarios** requiring validation
2. **Create specialized test functions** in relevant app test scripts
3. **Update ecosystem test** to include new cross-base scenarios
4. **Validate with multiple base configurations**

### Performance Optimization
1. **Parallel test execution** for independent test scenarios
2. **Container reuse** to avoid repeated startup costs
3. **Selective testing** using app categories (core, basic, all)
4. **Resource cleanup** to prevent memory/disk exhaustion

## Future Enhancements

### Planned Features
- **Real browser automation** using Playwright/Selenium for actual UI testing
- **Performance monitoring** with detailed timing metrics
- **Visual regression testing** with actual screenshot comparison
- **Load testing** for high-concurrency scenarios
- **Mobile app testing** for iOS/Android Tauri builds

### Advanced Scenarios
- **Network partition testing** - Validate behavior during network failures
- **Chaos engineering** - Random service failures during testing
- **Multi-region testing** - Distributed bases across different networks
- **Upgrade testing** - Rolling updates and backward compatibility

This comprehensive testing system provides unparalleled validation of the entire Planet Nine ecosystem, ensuring that all components work together seamlessly in a distributed, privacy-focused web infrastructure.