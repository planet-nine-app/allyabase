# Allyabase Multi-Base Docker Testing Setup

## Overview

This directory contains Docker configurations and scripts for running multiple allyabase instances simultaneously for ecosystem testing. The system supports running 3 independent bases with different port mappings to enable comprehensive testing of the Planet Nine ecosystem.

## Port Mapping Strategy

### Base Port Ranges
- **Base 1**: 40xx, 30xx range (PORT_OFFSET=1000)
- **Base 2**: 50xx, 40xx range (PORT_OFFSET=2000)  
- **Base 3**: 60xx, 50xx range (PORT_OFFSET=3000)

### Service Port Mapping

| Service      | Default | Base 1    | Base 2    | Base 3    |
|--------------|---------|-----------|-----------|-----------|
| julia        | 3000    | 4000      | 5000      | 6000      |
| continuebee  | 2999    | 3999      | 4999      | 5999      |
| pref         | 3002    | 4002      | 5002      | 6002      |
| bdo          | 3003    | 4003      | 5003      | 6003      |
| joan         | 3004    | 4004      | 5004      | 6004      |
| addie        | 3005    | 4005      | 5005      | 6005      |
| fount        | 3006    | 4006      | 5006      | 6006      |
| dolores      | 3007    | 4007      | 5007      | 6007      |
| minnie       | 2525    | 3525      | 4525      | 5525      |
| aretha       | 7277    | 8277      | 9277      | 10277     |
| sanora       | 7243    | 8243      | 9243      | 10243     |

## Files

### Docker Configuration
- `Dockerfile-flexible` - Enhanced Dockerfile with configurable port support
- `start-with-ports.sh` - Startup script that accepts PORT_OFFSET parameter
- `update-service-ports.sh` - Updates hardcoded ports to use environment variables

### Build and Run Scripts
- `build-flexible.sh` - Builds the flexible allyabase Docker image
- `run-base1.sh` - Runs Base 1 with 40xx port mapping
- `run-base2.sh` - Runs Base 2 with 50xx port mapping  
- `run-base3.sh` - Runs Base 3 with 60xx port mapping

### Orchestration Scripts
- `spin-up-bases-corrected.sh` - **Main script** - Starts all 3 bases sequentially with health checks
- `stop-all-bases.sh` - Stops and removes all test base containers

## Quick Start

### 1. Build the Flexible Image
```bash
cd /Users/zachbabb/Work/planet-nine/allyabase/deployment/docker
./build-flexible.sh
```

### 2. Start All Three Bases
```bash
./spin-up-bases-corrected.sh --clean --build
```

Options:
- `--clean`: Remove existing containers before starting
- `--build`: Rebuild Docker image before starting

### 3. Verify All Services Are Running
The script will automatically wait for all services to be ready and report status.

### 4. Stop All Bases
```bash
./stop-all-bases.sh
```

## Individual Base Management

### Start Individual Bases
```bash
# Base 1 only
./run-base1.sh  

# Base 2 only
./run-base2.sh

# Base 3 only  
./run-base3.sh
```

### Check Base Status
```bash
# View running containers
docker ps | grep allyabase

# Check specific base logs
docker logs allyabase-base1
docker logs allyabase-base2  
docker logs allyabase-base3
```

## Testing Integration

### With StackChat P2P Testing
The three bases enable testing StackChat's P2P connection mechanism:


### With Nullary Applications
Each Nullary app can be configured to connect to different bases:

```javascript
// Connect to Base 1
const base1Config = {
  bdo: 'http://localhost:4003',
  fount: 'http://localhost:4006',
  sanora: 'http://localhost:8243',
};

// Connect to Base 2  
const base2Config = {
  bdo: 'http://localhost:5003',
  fount: 'http://localhost:5006', 
  sanora: 'http://localhost:9243',
};

// Connect to Base 3
const base3Config = {
  bdo: 'http://localhost:6003',
  fount: 'http://localhost:5006',
  sanora: 'http://localhost:10243', 
};
```

## Health Checking

The orchestration script includes comprehensive health checking:

1. **Port Availability**: Uses `nc -z` to check if services are accepting connections
2. **Sequential Startup**: Bases start one at a time, with full health checks between each
3. **Timeout Handling**: 60-second timeout per service, fails fast on any service failure
4. **Detailed Reporting**: Clear success/failure messaging for each service

## Troubleshooting

### Service Won't Start
```bash
# Check container logs
docker logs allyabase-base1

# Check if port is already in use
netstat -tlnp | grep :4000

# Restart with clean slate
./spin-up-bases-corrected.sh --clean --build
```

### Port Conflicts
If you see port binding errors:
1. Stop all bases: `./stop-all-bases.sh`
2. Check for processes using the ports: `lsof -i :4000-6011`
3. Kill conflicting processes or change port offsets

### Docker Issues
```bash
# Clean up Docker system
docker system prune -f

# Remove allyabase image and rebuild
docker rmi allyabase-flexible
./build-flexible.sh
```

## Architecture Benefits

### 1. **True Multi-Base Testing**
- Each base runs completely independently
- No shared state between bases
- Realistic production-like environment

### 2. **Cross-Base Communication Testing**  
- StackChat P2P connections across bases
- Content aggregation from multiple sources
- Teleportation content discovery testing

### 3. **Scalable Port Management**
- Clean PORT_OFFSET system
- No hardcoded port conflicts
- Easy to add more bases (70xx, 80xx, etc.)

### 4. **Production-Ready Patterns**
- Environment variable configuration
- Health checking and monitoring
- Graceful startup and shutdown

This setup enables comprehensive testing of the entire Planet Nine ecosystem across multiple bases, validating both individual service functionality and cross-base interactions.