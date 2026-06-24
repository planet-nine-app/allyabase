# ngrok Integration for Planet Nine Ecosystem Testing

This integration allows the Planet Nine ecosystem testing suite to use ngrok tunnels instead of localhost URLs, enabling remote testing and better simulation of real-world deployment scenarios.

## 🌍 Overview

The ngrok integration provides:
- **Public HTTPS URLs** for all 3 allyabase instances
- **Remote accessibility** for testing from different networks
- **Real SSL/TLS testing** with valid certificates
- **Webhook compatibility** for services that require public endpoints
- **CI/CD friendly** remote testing capabilities

## 🚀 Quick Start

### 1. Install ngrok
```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

### 2. Start your ecosystem with ngrok
```bash
# Full ecosystem with ngrok tunnels
./test-complete-ecosystem.sh --use-ngrok --continue-on-failure

# Or step by step:
./spin-up-bases-corrected.sh --clean --build  # Start containers
./setup-ngrok-tunnels.sh                      # Create tunnels
./test-complete-ecosystem.sh --use-ngrok       # Run tests
```

### 3. Test individual apps
```bash
cd nullary-tests
USE_NGROK=true ./test-rhapsold.sh 1000
USE_NGROK=true ./test-ninefy.sh 2000
```

## 📋 Available Scripts

### Tunnel Management
- **`./setup-ngrok-tunnels.sh`** - Create tunnels for all 3 bases
- **`./stop-ngrok-tunnels.sh`** - Stop all active tunnels  
- **`./get-ngrok-urls.sh`** - Get tunnel URLs and manage environment variables

### Testing
- **`./test-ngrok-integration.sh`** - Verify ngrok integration is working
- **`./test-complete-ecosystem.sh --use-ngrok`** - Full ecosystem test with tunnels

## 🔧 How It Works

### Architecture
```
                    ┌─────────────────┐
                    │  ngrok tunnels  │
                    │  (3 concurrent) │  
                    └─────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌─────────┐         ┌─────────┐         ┌─────────┐
   │ Base 1  │         │ Base 2  │         │ Base 3  │
   │ 5111-22 │         │ 5211-22 │         │ 5311-22 │
   └─────────┘         └─────────┘         └─────────┘
        │                   │                   │
   ┌─────────┐         ┌─────────┐         ┌─────────┐
   │Docker   │         │Docker   │         │Docker   │
   │Base 1   │         │Base 2   │         │Base 3   │
   └─────────┘         └─────────┘         └─────────┘
```

### Port Mapping
Each base exposes 12 services across a port range:

**Base 1**: Host ports 5111-5122 → ngrok → Docker internal ports
**Base 2**: Host ports 5211-5222 → ngrok → Docker internal ports  
**Base 3**: Host ports 5311-5322 → ngrok → Docker internal ports

### Service Mapping
| Service      | Base 1 | Base 2 | Base 3 |
|--------------|--------|--------|--------|
| julia        | 5111   | 5211   | 5311   |
| continuebee  | 5112   | 5212   | 5312   |
| pref         | 5113   | 5213   | 5313   |
| bdo          | 5114   | 5214   | 5314   |
| joan         | 5115   | 5215   | 5315   |
| addie        | 5116   | 5216   | 5316   |
| fount        | 5117   | 5217   | 5317   |
| dolores      | 5118   | 5218   | 5318   |
| minnie       | 5119   | 5219   | 5319   |
| aretha       | 5120   | 5220   | 5320   |
| sanora       | 5121   | 5221   | 5321   |

## 🛠️ URL Management

### Get tunnel URLs
```bash
# Get base tunnel URL
./get-ngrok-urls.sh base1                    # https://abc123.ngrok.io

# Get specific service URL  
./get-ngrok-urls.sh base1 sanora            # https://abc123.ngrok.io:5121

# List all active tunnels
./get-ngrok-urls.sh --list

# Export environment variables for scripts
source <(./get-ngrok-urls.sh --export)
```

### Environment Variables
When using `--export`, these variables are set:
```bash
NGROK_MODE=true
NGROK_BASE1_URL=https://abc123.ngrok.io
NGROK_BASE2_URL=https://def456.ngrok.io  
NGROK_BASE3_URL=https://ghi789.ngrok.io
```

## 🧪 Testing Integration

### Framework Integration
The nullary test framework automatically detects `USE_NGROK=true` and:
1. Maps PORT_OFFSET to base names (1000→base1, 2000→base2, 3000→base3)
2. Resolves service URLs through ngrok tunnels
3. Updates all service environment variables
4. Validates tunnel connectivity before testing

### Example Test Flow
```bash
# 1. Start ecosystem
./spin-up-bases-corrected.sh --clean --build

# 2. Create tunnels  
./setup-ngrok-tunnels.sh

# 3. Test specific app with ngrok
cd nullary-tests
USE_NGROK=true ./test-rhapsold.sh 1000

# The framework automatically:
# - Detects USE_NGROK=true
# - Maps offset 1000 to base1
# - Gets https://abc123.ngrok.io:5121 for Sanora
# - Tests against public URLs instead of localhost
```

## 🔍 Monitoring & Debugging

### ngrok Web Interface
Visit `http://127.0.0.1:4040` to:
- Monitor tunnel traffic in real-time
- See request/response headers
- Debug SSL/TLS issues
- View tunnel statistics

### Log Files
Tunnel logs are stored in `/tmp/ngrok-tunnels/`:
```bash
# View tunnel logs
tail -f /tmp/ngrok-tunnels/ngrok-base1.log
tail -f /tmp/ngrok-tunnels/ngrok-base2.log  
tail -f /tmp/ngrok-tunnels/ngrok-base3.log
```

### Tunnel Status
```bash
# Check tunnel API directly
curl -s http://127.0.0.1:4040/api/tunnels | jq

# Verify connectivity
for base in base1 base2 base3; do
  url=$(./get-ngrok-urls.sh $base sanora)
  curl -k -s --connect-timeout 5 "$url" && echo "✅ $base" || echo "❌ $base"
done
```

## ⚠️ Limitations & Considerations

### ngrok Free Tier
- **3 concurrent tunnels** (perfect for our 3 bases)
- **Random subdomains** (URLs change each restart)
- **2GB data transfer/month** limit

### Performance
- **Extra latency** due to ngrok routing
- **Rate limiting** on free tier
- **Connection limits** during high traffic

### Security
- **Public URLs** are accessible from internet
- **No authentication** by default (services are exposed)
- **SSL termination** at ngrok (tunnels use ngrok certs)

## 🚨 Troubleshooting

### Common Issues

**"ngrok not found"**
```bash
# Install ngrok first
brew install ngrok
# or download from https://ngrok.com/download
```

**"Failed to establish tunnels"**
```bash
# Check if containers are running
docker ps | grep allyabase

# Restart containers  
./spin-up-bases-corrected.sh --clean --build

# Try tunnel setup again
./setup-ngrok-tunnels.sh
```

**"Service not responding through tunnel"**
```bash
# Check local service first
curl -s http://localhost:5121  # Direct container access

# Check tunnel resolution
./get-ngrok-urls.sh base1 sanora

# Check ngrok web interface
open http://127.0.0.1:4040
```

**"Tunnel URLs return ERROR"**
```bash
# Check if tunnels are actually running
ps aux | grep ngrok

# Restart tunnel setup
./stop-ngrok-tunnels.sh
./setup-ngrok-tunnels.sh
```

### Debug Commands
```bash
# Test integration without full ecosystem
./test-ngrok-integration.sh

# Check tunnel connectivity manually  
for base in base1 base2 base3; do
  for service in sanora bdo fount; do
    url=$(./get-ngrok-urls.sh $base $service)
    echo "Testing $base/$service: $url"
    curl -k -s --connect-timeout 5 "$url" >/dev/null && echo "✅" || echo "❌"
  done
done

# Monitor tunnel traffic
# Visit http://127.0.0.1:4040 in browser
```

## 🎯 Best Practices

### Development Workflow
1. **Start containers first**: Always run `./spin-up-bases-corrected.sh` before tunnels
2. **Keep tunnels running**: Restarting tunnels changes URLs, breaking ongoing tests
3. **Monitor tunnel usage**: Check the web interface for traffic patterns
4. **Clean up after testing**: Run `./stop-ngrok-tunnels.sh` to free resources

### CI/CD Integration
```bash
# Example CI pipeline step
- name: Test with ngrok tunnels
  run: |
    ./spin-up-bases-corrected.sh --clean --build
    ./setup-ngrok-tunnels.sh
    ./test-complete-ecosystem.sh --use-ngrok --continue-on-failure
    ./stop-ngrok-tunnels.sh
```

### Performance Optimization
- **Use localhost for dev**: Only use ngrok when you need public URLs
- **Batch tests**: Avoid frequent tunnel restarts
- **Monitor data usage**: Keep track of ngrok transfer limits

## 🚀 Advanced Usage

### Custom ngrok Config
Create `.ngrok2/ngrok.yml`:
```yaml
version: "2"
authtoken: your_auth_token
region: us
tunnels:
  base1:
    proto: http
    addr: 5111
    subdomain: my-planet-nine-base1  # Requires paid plan
```

### Integration with External Services
The public URLs enable testing with:
- **Webhooks**: GitHub, Stripe, etc. can call your services
- **Mobile apps**: Test against real HTTPS endpoints  
- **External APIs**: Services that require public callback URLs
- **Load testing**: Tools like Artillery can hit public endpoints

### Multi-Developer Testing
Different developers can:
1. Run their own tunnel instances
2. Share tunnel URLs for collaboration  
3. Test cross-base interactions remotely
4. Debug issues across different networks

## 📚 Related Documentation

- [Complete Ecosystem Testing Guide](README-COMPLETE-TESTING.md)
- [Docker Deployment Guide](README-INTEGRATED-TESTING.md)
- [Nullary Application Testing](nullary-tests/README.md)
- [ngrok Official Documentation](https://ngrok.com/docs)