#!/bin/bash

# Run allyabase Base 1 with 40xx port mapping
echo "Starting allyabase Base 1 (40xx ports)..."

docker run -d \
  --name allyabase-base1 \
  -e PORT_OFFSET=1000 \
  -p 4000:4000 \
  -p 4001:4001 \
  -p 4002:4002 \
  -p 4003:4003 \
  -p 4004:4004 \
  -p 4005:4005 \
  -p 4006:4006 \
  -p 4007:4007 \
  -p 4525:4525 \
  -p 8277:8277 \
  -p 8243:8243 \
  allyabase-flexible

echo "Base 1 started successfully!"
echo "Services available at:"
echo "  julia: http://localhost:4000"
echo "  continuebee: http://localhost:3999"  
echo "  pref: http://localhost:4002"
echo "  bdo: http://localhost:4003"
echo "  joan: http://localhost:4004"
echo "  addie: http://localhost:4005"
echo "  fount: http://localhost:4006"
echo "  dolores: http://localhost:4007"
echo "  minnie: http://localhost:4525"
echo "  aretha: http://localhost:8277"
echo "  sanora: http://localhost:8243"