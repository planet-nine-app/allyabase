#!/bin/bash

# Run allyabase Base 2 with 50xx port mapping
echo "Starting allyabase Base 2 (50xx ports)..."

docker run -d \
  --name allyabase-base2 \
  -e PORT_OFFSET=2000 \
  -p 5000:5000 \
  -p 5001:5001 \
  -p 5002:5002 \
  -p 5003:5003 \
  -p 5004:5004 \
  -p 5005:5005 \
  -p 5006:5006 \
  -p 5007:5007 \
  -p 5525:5525 \
  -p 9277:9277 \
  -p 9243:9243 \
  allyabase-flexible

echo "Base 2 started successfully!"
echo "Services available at:"
echo "  julia: http://localhost:5000"
echo "  continuebee: http://localhost:4999"
echo "  pref: http://localhost:5002"
echo "  bdo: http://localhost:5003"
echo "  joan: http://localhost:5004"
echo "  addie: http://localhost:5005"
echo "  fount: http://localhost:5006"
echo "  dolores: http://localhost:5007"
echo "  minnie: http://localhost:5525"
echo "  aretha: http://localhost:9277"
echo "  sanora: http://localhost:9243"