#!/bin/bash

# Enhanced allyabase startup script with configurable port mapping
# Usage: ./start-with-ports.sh [PORT_OFFSET]
# 
# PORT_OFFSET determines which base this is:
# - Default (no offset): Standard ports 
# - 1000: Base 1 (40xx range)
# - 2000: Base 2 (50xx range) 
# - 3000: Base 3 (60xx range)

PORT_OFFSET=${1:-0}

# Calculate service ports based on offset
# Default ports + offset = new ports
# Base 1: 3000 + 1000 = 4000, Base 2: 3000 + 2000 = 5000, etc.

JULIA_PORT=$((3000 + PORT_OFFSET))
CONTINUEBEE_PORT=$((2999 + PORT_OFFSET))
JOAN_PORT=$((3004 + PORT_OFFSET))
PREF_PORT=$((3002 + PORT_OFFSET))
BDO_PORT=$((3003 + PORT_OFFSET))
FOUNT_PORT=$((3006 + PORT_OFFSET))
ADDIE_PORT=$((3005 + PORT_OFFSET))
ARETHA_PORT=$((7277 + PORT_OFFSET))
SANORA_PORT=$((7243 + PORT_OFFSET))
DOLORES_PORT=$((3007 + PORT_OFFSET))
MINNIE_PORT=$((2525 + PORT_OFFSET))
COVENANT_PORT=$((3011 + PORT_OFFSET))
GLYPHENGE_PORT=$((3010 + PORT_OFFSET))
PROF_PORT=$((3008 + PORT_OFFSET))
WIKI_PORT=$((3333 + PORT_OFFSET))
PROXY_PORT=$((5124 + (PORT_OFFSET / 100)))

echo "Starting allyabase with port offset: $PORT_OFFSET"
echo "Services will run on:"
echo "  julia: $JULIA_PORT"
echo "  continuebee: $CONTINUEBEE_PORT"
echo "  joan: $JOAN_PORT"
echo "  pref: $PREF_PORT"
echo "  bdo: $BDO_PORT"
echo "  fount: $FOUNT_PORT"
echo "  addie: $ADDIE_PORT"
echo "  aretha: $ARETHA_PORT"
echo "  sanora: $SANORA_PORT"
echo "  dolores: $DOLORES_PORT"
echo "  minnie: $MINNIE_PORT"
echo "  covenant: $COVENANT_PORT"
echo "  glyphenge: $GLYPHENGE_PORT (link tapestry weaver)"
echo "  wiki: $WIKI_PORT (federated wiki with sessionless security)"
echo "  proxy: $PROXY_PORT (wiki-style path router)"
if [ "$ENABLE_PROF" = "true" ]; then
  echo "  prof: $PROF_PORT (optional - enabled)"
else
  echo "  prof: disabled (set ENABLE_PROF=true to enable)"
fi
echo ""

cat > ecosystem.config.js << EOL
module.exports = {
  apps: [
    {
      name: 'julia',
      script: '/usr/src/app/julia/src/server/node/julia.js',
      env: { 
        LOCALHOST: 'true',
        PORT: '$JULIA_PORT'
      }
    },
    {
      name: 'continuebee',
      script: '/usr/src/app/continuebee/src/server/node/continuebee.js',
      env: { 
        LOCALHOST: 'true',
        PORT: '$CONTINUEBEE_PORT'
      }
    },
    {
      name: 'joan',
      script: '/usr/src/app/joan/src/server/node/joan.js',
      env: { 
        LOCALHOST: 'true',
        PORT: '$JOAN_PORT'
      }
    },
    {
      name: 'pref',
      script: '/usr/src/app/pref/src/server/node/pref.js',
      env: { 
        LOCALHOST: 'true',
        PORT: '$PREF_PORT'
      }
    },
    {
      name: 'bdo',
      script: '/usr/src/app/bdo/src/server/node/bdo.js',
      env: { 
        LOCALHOST: 'true',
        PORT: '$BDO_PORT'
      }
    },
    {
      name: 'fount',
      script: '/usr/src/app/fount/src/server/node/fount.js',
      env: { 
        LOCALHOST: 'true',
        PORT: '$FOUNT_PORT'
      }
    },
    {
      name: 'addie',
      script: '/usr/src/app/addie/src/server/node/addie.js',
      env: {
        LOCALHOST: 'true',
        PORT: '$ADDIE_PORT',
        STRIPE_KEY: process.env.STRIPE_KEY || '<api key here>',
        STRIPE_PUBLISHING_KEY: process.env.STRIPE_PUBLISHING_KEY || '<publishing key here>',
        SQUARE_KEY: process.env.SQUARE_KEY || '<api key here>'
      }
    },
    {
      name: 'aretha',
      script: '/usr/src/app/aretha/src/server/node/aretha.js',
      env: { 
        LOCALHOST: 'true',
        PORT: '$ARETHA_PORT'
      }
    },
    {
      name: 'sanora',
      script: '/usr/src/app/sanora/src/server/node/sanora.js',
      env: { 
        LOCALHOST: 'true',
        PORT: '$SANORA_PORT'
      }
    },
    {
      name: 'dolores',
      script: '/usr/src/app/dolores/src/server/node/dolores.js',
      env: { 
        LOCALHOST: 'true',
        PORT: '$DOLORES_PORT'
      }
    },
    {
      name: 'minnie',
      script: '/usr/src/app/minnie/src/server/node/minnie.js',
      env: { 
        LOCALHOST: 'true',
        PORT: '$MINNIE_PORT'
      }
    },
    {
      name: 'covenant',
      script: '/usr/src/app/covenant/src/server/node/covenant.js',
      env: {
        LOCALHOST: 'true',
        PORT: '$COVENANT_PORT'
      }
    },
    {
      name: 'glyphenge',
      script: '/usr/src/app/the-advancement/glyphenge/server.js',
      env: {
        PORT: '$GLYPHENGE_PORT',
        BDO_BASE_URL: 'http://localhost:$BDO_PORT',
        FOUNT_BASE_URL: 'http://localhost:$FOUNT_PORT'
      }
    },
    {
      name: 'proxy',
      script: '/usr/src/app/allyabase/deployment/docker/proxy-server.js',
      cwd: '/usr/src/app/allyabase/deployment/docker',
      env: {
        PROXY_PORT: '$PROXY_PORT',
        PORT_OFFSET: '$PORT_OFFSET'
      }
    }
EOL

# Add prof service conditionally
if [ "$ENABLE_PROF" = "true" ]; then
cat >> ecosystem.config.js << EOL
    ,{
      name: 'prof',
      script: '/usr/src/app/prof/src/server/node/prof.js',
      env: { 
        LOCALHOST: 'true',
        PORT: '$PROF_PORT'
      }
    }
EOL
fi

cat >> ecosystem.config.js << EOL
  ]
}
EOL

# Start federated wiki with sessionless security and allyabase plugin for proxy routes
echo "Starting federated wiki on port $WIKI_PORT with sessionless security and allyabase proxy..."
wiki --security wiki-security-sessionless --plugin wiki-plugin-allyabase --port $WIKI_PORT > /var/log/wiki.log 2>&1 &

pm2-runtime start ecosystem.config.js