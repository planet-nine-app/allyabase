#!/bin/bash

# Setup Bootstrap Configurations for Three-Base Testing
# Creates leader/follower architecture configurations

set -e

BOOTSTRAP_DIR="$(dirname "$0")/bootstrap-configs"

echo "🔄 Setting up bootstrap configurations for three-base testing..."
echo "================================================================"
echo ""

# Clean up any existing configurations
if [ -d "$BOOTSTRAP_DIR" ]; then
  echo "🧹 Cleaning up existing bootstrap configurations..."
  rm -rf "$BOOTSTRAP_DIR"
fi

# Create bootstrap configurations directory
mkdir -p "$BOOTSTRAP_DIR"

# Determine service URLs based on ngrok usage
if [ "${USE_NGROK:-false}" = "true" ]; then
  echo "🌍 Using ngrok URLs for bootstrap configurations..."
  
  # Get ngrok URLs for services
  BASE1_BDO_URL=$(./get-ngrok-urls.sh base1 bdo 2>/dev/null || echo "https://localhost:5114")
  BASE1_JULIA_URL=$(./get-ngrok-urls.sh base1 julia 2>/dev/null || echo "https://localhost:5111")
  BASE1_SANORA_URL=$(./get-ngrok-urls.sh base1 sanora 2>/dev/null || echo "https://localhost:5121")
  BASE1_FOUNT_URL=$(./get-ngrok-urls.sh base1 fount 2>/dev/null || echo "https://localhost:5117")
  BASE1_DOLORES_URL=$(./get-ngrok-urls.sh base1 dolores 2>/dev/null || echo "https://localhost:5118")
  BASE1_ADDIE_URL=$(./get-ngrok-urls.sh base1 addie 2>/dev/null || echo "https://localhost:5116")
  BASE1_JOAN_URL=$(./get-ngrok-urls.sh base1 joan 2>/dev/null || echo "https://localhost:5115")
  BASE1_MINNIE_URL=$(./get-ngrok-urls.sh base1 minnie 2>/dev/null || echo "https://localhost:5119")
  BASE1_ARETHA_URL=$(./get-ngrok-urls.sh base1 aretha 2>/dev/null || echo "https://localhost:5120")
  BASE1_PREF_URL=$(./get-ngrok-urls.sh base1 pref 2>/dev/null || echo "https://localhost:5113")
  BASE1_CONTINUEBEE_URL=$(./get-ngrok-urls.sh base1 continuebee 2>/dev/null || echo "https://localhost:5112")

  BASE2_BDO_URL=$(./get-ngrok-urls.sh base2 bdo 2>/dev/null || echo "https://localhost:5214")
  BASE3_BDO_URL=$(./get-ngrok-urls.sh base3 bdo 2>/dev/null || echo "https://localhost:5314")
else
  echo "🔗 Using localhost URLs for bootstrap configurations..."
  
  # Use localhost URLs for services
  BASE1_BDO_URL="http://localhost:5114"
  BASE1_JULIA_URL="http://localhost:5111"
  BASE1_SANORA_URL="http://localhost:5121"
  BASE1_FOUNT_URL="http://localhost:5117"
  BASE1_DOLORES_URL="http://localhost:5118"
  BASE1_ADDIE_URL="http://localhost:5116"
  BASE1_JOAN_URL="http://localhost:5115"
  BASE1_MINNIE_URL="http://localhost:5119"
  BASE1_ARETHA_URL="http://localhost:5120"
  BASE1_PREF_URL="http://localhost:5113"
  BASE1_CONTINUEBEE_URL="http://localhost:5112"

  BASE2_BDO_URL="http://localhost:5214"
  BASE3_BDO_URL="http://localhost:5314"
fi

# Create Base 1 Configuration (Leader)
echo "📝 Creating Base 1 (Leader) configuration..."

cat > "$BOOTSTRAP_DIR/base1-config.json" << EOF
{
  "baseInfo": {
    "name": "Planet Nine Test Leader Base",
    "description": "Leader base for Planet Nine ecosystem testing - receives announcements from follower bases",
    "starSystemNumber": 1000,
    "contactInfo": {
      "email": "leader@test.planetnine.app",
      "website": "https://test.planetnine.app/base1"
    }
  },
  "networking": {
    "announceToBase": [],
    "listenForAnnouncements": true
  },
  "userManagement": {
    "maxUsers": 1000,
    "allowedPublicKeys": [],
    "registrationMode": "open"
  },
  "contentFeeds": {
    "blueskyFeeds": [
      {
        "handle": "planetnine.test",
        "feedType": "timeline",
        "tags": ["planetnine", "test", "leader"],
        "enabled": true,
        "importInterval": 60
      }
    ],
    "customFeeds": []
  },
  "services": {
    "enabled": [
      "bdo", "julia", "sanora", "fount", "dolores",
      "addie", "joan", "minnie", "aretha", "pref",
      "continuebee"
    ],
    "ports": {
      "basePort": 4000,
      "portOffset": 1000
    }
  },
  "bootstrap": {
    "autoAnnounce": false,
    "announcementInterval": 0,
    "retryFailedAnnouncements": false,
    "retryInterval": 0
  },
  "_internal": {
    "role": "leader",
    "testId": "base1-leader-$(date +%s)",
    "serviceUrls": {
      "bdo": "$BASE1_BDO_URL",
      "julia": "$BASE1_JULIA_URL",
      "sanora": "$BASE1_SANORA_URL",
      "fount": "$BASE1_FOUNT_URL",
      "dolores": "$BASE1_DOLORES_URL",
      "addie": "$BASE1_ADDIE_URL",
      "joan": "$BASE1_JOAN_URL",
      "minnie": "$BASE1_MINNIE_URL",
      "aretha": "$BASE1_ARETHA_URL",
      "pref": "$BASE1_PREF_URL",
      "continuebee": "$BASE1_CONTINUEBEE_URL"
    }
  }
}
EOF

# Create Base 2 Configuration (Follower)
echo "📝 Creating Base 2 (Follower) configuration..."

cat > "$BOOTSTRAP_DIR/base2-config.json" << EOF
{
  "baseInfo": {
    "name": "Planet Nine Test Follower Base 2",
    "description": "Follower base #2 for Planet Nine ecosystem testing - announces to leader base",
    "starSystemNumber": 2000,
    "contactInfo": {
      "email": "follower2@test.planetnine.app", 
      "website": "https://test.planetnine.app/base2"
    }
  },
  "networking": {
    "announceToBase": [
      {
        "name": "Planet Nine Test Leader Base",
        "baseUrl": "$BASE1_BDO_URL",
        "services": {
          "bdo": "$BASE1_BDO_URL",
          "julia": "$BASE1_JULIA_URL",
          "sanora": "$BASE1_SANORA_URL",
          "fount": "$BASE1_FOUNT_URL",
          "dolores": "$BASE1_DOLORES_URL",
          "addie": "$BASE1_ADDIE_URL",
          "joan": "$BASE1_JOAN_URL",
          "minnie": "$BASE1_MINNIE_URL",
          "aretha": "$BASE1_ARETHA_URL",
          "pref": "$BASE1_PREF_URL",
          "continuebee": "$BASE1_CONTINUEBEE_URL"
        },
        "enabled": true
      }
    ],
    "listenForAnnouncements": true
  },
  "userManagement": {
    "maxUsers": 500,
    "allowedPublicKeys": [],
    "registrationMode": "open"
  },
  "contentFeeds": {
    "blueskyFeeds": [
      {
        "handle": "follower2.test",
        "feedType": "timeline", 
        "tags": ["planetnine", "test", "follower2"],
        "enabled": true,
        "importInterval": 90
      }
    ],
    "customFeeds": [
      {
        "name": "Test RSS Feed",
        "url": "https://feeds.feedburner.com/oreilly/radar",
        "feedType": "rss",
        "tags": ["tech", "test"],
        "enabled": true,
        "importInterval": 120
      }
    ]
  },
  "services": {
    "enabled": [
      "bdo", "julia", "sanora", "fount", "dolores",
      "addie", "joan", "minnie", "aretha", "pref",
      "continuebee"
    ],
    "ports": {
      "basePort": 5000,
      "portOffset": 2000
    }
  },
  "bootstrap": {
    "autoAnnounce": true,
    "announcementInterval": 300,
    "retryFailedAnnouncements": true,
    "retryInterval": 30
  },
  "_internal": {
    "role": "follower",
    "testId": "base2-follower-$(date +%s)",
    "leaderBaseUrl": "$BASE1_BDO_URL"
  }
}
EOF

# Create Base 3 Configuration (Follower)
echo "📝 Creating Base 3 (Follower) configuration..."

cat > "$BOOTSTRAP_DIR/base3-config.json" << EOF
{
  "baseInfo": {
    "name": "Planet Nine Test Follower Base 3",
    "description": "Follower base #3 for Planet Nine ecosystem testing - announces to leader base",
    "starSystemNumber": 3000,
    "contactInfo": {
      "email": "follower3@test.planetnine.app",
      "website": "https://test.planetnine.app/base3"
    }
  },
  "networking": {
    "announceToBase": [
      {
        "name": "Planet Nine Test Leader Base",
        "baseUrl": "$BASE1_BDO_URL",
        "services": {
          "bdo": "$BASE1_BDO_URL",
          "julia": "$BASE1_JULIA_URL",
          "sanora": "$BASE1_SANORA_URL",
          "fount": "$BASE1_FOUNT_URL",
          "dolores": "$BASE1_DOLORES_URL",
          "addie": "$BASE1_ADDIE_URL",
          "joan": "$BASE1_JOAN_URL",
          "minnie": "$BASE1_MINNIE_URL",
          "aretha": "$BASE1_ARETHA_URL",
          "pref": "$BASE1_PREF_URL",
          "continuebee": "$BASE1_CONTINUEBEE_URL"
        },
        "enabled": true
      }
    ],
    "listenForAnnouncements": true
  },
  "userManagement": {
    "maxUsers": 750,
    "allowedPublicKeys": [
      {
        "publicKey": "03a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd",
        "name": "Test Admin Key",
        "permissions": ["read", "write", "admin"],
        "enabled": true
      }
    ],
    "registrationMode": "whitelist"
  },
  "contentFeeds": {
    "blueskyFeeds": [
      {
        "handle": "follower3.test",
        "feedType": "timeline",
        "tags": ["planetnine", "test", "follower3"],
        "enabled": true,
        "importInterval": 120
      }
    ],
    "customFeeds": [
      {
        "name": "Planet Nine Dev Feed",
        "url": "https://dev.planetnine.app/feed.json",
        "feedType": "json",
        "tags": ["dev", "planetnine"],
        "enabled": true,
        "importInterval": 60
      }
    ]
  },
  "services": {
    "enabled": [
      "bdo", "julia", "sanora", "fount", "dolores",
      "addie", "joan", "minnie", "aretha", "pref",
      "continuebee"
    ],
    "ports": {
      "basePort": 6000,
      "portOffset": 3000
    }
  },
  "bootstrap": {
    "autoAnnounce": true,
    "announcementInterval": 450,
    "retryFailedAnnouncements": true,
    "retryInterval": 45
  },
  "_internal": {
    "role": "follower",
    "testId": "base3-follower-$(date +%s)",
    "leaderBaseUrl": "$BASE1_BDO_URL"
  }
}
EOF

# Create a summary configuration file for testing reference
echo "📝 Creating bootstrap test summary..."

cat > "$BOOTSTRAP_DIR/test-summary.json" << EOF
{
  "testConfiguration": {
    "architecture": "leader-follower",
    "totalBases": 3,
    "useNgrok": ${USE_NGROK:-false},
    "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  },
  "bases": {
    "leader": {
      "name": "Planet Nine Test Leader Base",
      "role": "leader",
      "portOffset": 1000,
      "starSystemNumber": 1000,
      "configFile": "base1-config.json",
      "listenForAnnouncements": true,
      "announcesToOthers": false
    },
    "followers": [
      {
        "name": "Planet Nine Test Follower Base 2", 
        "role": "follower",
        "portOffset": 2000,
        "starSystemNumber": 2000,
        "configFile": "base2-config.json",
        "announcesTo": "leader",
        "announcementInterval": 300
      },
      {
        "name": "Planet Nine Test Follower Base 3",
        "role": "follower", 
        "portOffset": 3000,
        "starSystemNumber": 3000,
        "configFile": "base3-config.json",
        "announcesTo": "leader",
        "announcementInterval": 450
      }
    ]
  },
  "testValidation": {
    "expectedAnnouncements": 2,
    "expectedDiscoveredBases": 3,
    "leaderShouldReceive": ["base2", "base3"],
    "followersShouldDiscover": ["leader", "peer-followers"]
  }
}
EOF

echo ""
echo "✅ Bootstrap configurations created successfully!"
echo ""
echo "📋 Configuration Summary:"
echo "  • Base 1 (Leader):   Listens for announcements, star system 1000"
echo "  • Base 2 (Follower): Announces to leader every 5min, star system 2000"
echo "  • Base 3 (Follower): Announces to leader every 7.5min, star system 3000"
echo ""
echo "📁 Configuration Files:"
echo "  • Leader:    $BOOTSTRAP_DIR/base1-config.json"
echo "  • Follower2: $BOOTSTRAP_DIR/base2-config.json"  
echo "  • Follower3: $BOOTSTRAP_DIR/base3-config.json"
echo "  • Summary:   $BOOTSTRAP_DIR/test-summary.json"
echo ""
echo "🔧 Architecture Details:"
echo "  • Leader accepts announcements from followers"
echo "  • Followers automatically announce to leader on startup"
echo "  • All bases support cross-base discovery"
echo "  • Content feeds configured for testing"
if [ "${USE_NGROK:-false}" = "true" ]; then
echo "  • Using ngrok URLs for remote accessibility"
else
echo "  • Using localhost URLs for local testing"
fi
echo ""
echo "💡 Next Steps:"
echo "  1. Run: ./start-all-bootstrap-services.sh"
echo "  2. Wait for announcements to complete"
echo "  3. Run: ./verify-bootstrap-announcements.sh"