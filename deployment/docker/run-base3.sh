#!/bin/bash

# Run allyabase Base 3 with 60xx port mapping
echo "Starting allyabase Base 3 (60xx ports)..."

docker run -d \
  --name allyabase-base3 \
  -e PORT_OFFSET=3000 \
  -p 6000:6000 \
  -p 6001:6001 \
  -p 6002:6002 \
  -p 6003:6003 \
  -p 6004:6004 \
  -p 6005:6005 \
  -p 6006:6006 \
  -p 6007:6007 \
  -p 6525:6525 \
  -p 10277:10277 \
  -p 10243:10243 \
  allyabase-flexible

echo "Base 3 started successfully!"
echo "Services available at:"
echo "  julia: http://localhost:6000"
echo "  continuebee: http://localhost:5999"
echo "  pref: http://localhost:6002"
echo "  bdo: http://localhost:6003"
echo "  joan: http://localhost:6004"
echo "  addie: http://localhost:6005"
echo "  fount: http://localhost:6006"
echo "  dolores: http://localhost:6007"
echo "  minnie: http://localhost:6525"
echo "  aretha: http://localhost:10277"
echo "  sanora: http://localhost:10243"