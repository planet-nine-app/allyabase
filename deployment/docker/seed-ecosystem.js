#!/usr/bin/env node

/**
 * Planet Nine Ecosystem Data Seeder
 * 
 * Seeds local/test environments with sample data across all services:
 * - Dolores: Social posts  
 * - Prof: Profiles for IDothis and MyBase
 * - Sanora: Products for Ninefy, blog posts for Rhapsold
 * - Covenant: Sample contracts
 * - Julia: Messages for StackChat
 * - BDO: Base discovery data
 * 
 * Usage: node seed-ecosystem.js [environment] [base_number]
 * Environment: 'local' or 'test' (default: test)
 * Base number: 1, 2, or 3 for test environment (default: 1)
 */

import sessionless from 'sessionless-node';
import fetch from 'node-fetch';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { generateMusicBDO, exampleMusicTracks } from './examples/music/music-bdo.js';
import { generateCanimusFeedBDO, sockpuppetCanimusFeed } from './examples/music/canimus-feed-bdo.js';
import { generateRoomProduct, generateRoomSVG, generateRoomHorizontalSVG, exampleRooms } from './examples/rooms/room-bdo.js';
import { generateProfiles } from './examples/profiles/profile-generator.js';
import { generateSampleProducts, generateBlogPosts } from './examples/products/product-generator.js';
import { generateSocialPosts } from './examples/social/social-generator.js';
import { events as exampleEvents, generateEventSVG } from './examples/events/events.js';
import { popupPosts, generatePopupTwoButtonSVG, generateLocationViewSVG } from './examples/popups/popups.js';
import { literaryPosts, generateBookTwoButtonSVG, generateLiteraryOneButtonSVG } from './examples/literary/literary.js';
import { idothisPosts, generateIdothisBookNowSVG } from './examples/idothis/idothis.js';
import { gamesPosts, generateGameSVG, generateFTPSVG } from './examples/games/games.js';

// Set up in-memory key storage for seed script
const keyStorage = new Map();
const testUsers = new Map();

// Track current user keys for sessionless signing
let currentUserKeys = null;

// Simple in-memory saveKeys/getKeys for sessionless (seed script only)
const saveKeys = (keys) => {
  currentUserKeys = keys;
  keyStorage.set('current', keys);
};

const getKeys = () => {
  return currentUserKeys;
};

// Helper function to create test users using sessionless
const createTestUser = async (seed) => {
  // Check if we already created this user
  if (testUsers.has(seed)) {
    return testUsers.get(seed);
  }

  // Use sessionless to generate keys with our storage callbacks
  // generateKeys is async and returns the keys
  const keys = await sessionless.generateKeys(saveKeys, getKeys);
  const uuid = sessionless.generateUUID();

  if (!keys || !keys.pubKey || !keys.privateKey) {
    throw new Error(`Failed to generate keys for ${seed}`);
  }

  const user = {
    uuid,
    pubKey: keys.pubKey,
    privateKey: keys.privateKey
  };

  testUsers.set(seed, user);
  console.log(`  🔑 Generated keys for ${seed}: ${keys.pubKey.substring(0, 16)}...`);

  return user;
};

// Sign function using sessionless
// Note: sessionless.sign() uses getKeys() internally, so we need to set currentUserKeys first
const signMessage = async (privateKey, message, pubKey) => {
  // Set the current keys so sessionless.sign() can access them
  currentUserKeys = { privateKey, pubKey };
  return sessionless.sign(message);
};

// Configuration
const ENVIRONMENT = process.argv[2] || 'test';
const BASE_NUMBER = process.argv[3] || '1';

console.log(`🌱 Planet Nine Ecosystem Seeder`);
console.log(`📍 Environment: ${ENVIRONMENT}`);
console.log(`🏠 Base: ${BASE_NUMBER}`);
console.log('==========================================\n');

// Environment-specific service URLs
const getServiceURLs = (env, baseNum) => {
  if (env === 'local') {
    return {
      dolores: 'http://localhost:3007',
      prof: 'http://localhost:3008',
      sanora: 'http://localhost:7243',
      bdo: 'http://localhost:3003',
      julia: 'http://localhost:3000',
      continuebee: 'http://localhost:2999',
      fount: 'http://localhost:3006',  // Fixed: was 3002, should be 3006
      aretha: 'http://localhost:7277', // Fixed: was 3010, should be 7277
      advancement: 'http://localhost:3456'
    };
  } else if (env === 'test') {
    const portBase = 5000 + (parseInt(baseNum) * 100);
    return {
      dolores: `http://localhost:${portBase + 18}`,
      prof: `http://localhost:${portBase + 23}`, // Prof service on port 5123 for Base 1
      sanora: `http://localhost:${portBase + 21}`,
      bdo: `http://localhost:${portBase + 14}`,
      julia: `http://localhost:${portBase + 11}`,
      continuebee: `http://localhost:${portBase + 12}`,
      fount: `http://localhost:${portBase + 17}`,
      aretha: `http://localhost:${portBase + 20}`, // Aretha service on port 5120 for Base 1
      advancement: 'http://localhost:3456' // The Advancement test server runs on fixed port
    };
  } else if (env === 'test-wiki') {
    // Local wiki proxy mode: route through local wiki plugin on test bases
    // Example: node seed-ecosystem.js test-wiki 1
    // Wiki ports: Base 1 = 5124, Base 2 = 5224, Base 3 = 5324
    const wikiPort = 5000 + (parseInt(baseNum) * 100) + 24;
    const baseURL = `http://127.0.0.1:${wikiPort}/plugin/allyabase`;
    return {
      dolores: `${baseURL}/dolores`,
      prof: `${baseURL}/prof`,
      sanora: `${baseURL}/sanora`,
      bdo: `${baseURL}/bdo`,
      julia: `${baseURL}/julia`,
      continuebee: `${baseURL}/continuebee`,
      fount: `${baseURL}/fount`,
      aretha: `${baseURL}/aretha`,
      advancement: 'http://localhost:3456' // The Advancement test server runs on fixed port
    };
  } else if (env.startsWith('wiki-')) {
    // Production wiki plugin pattern: https://ENV.allyabase.com/plugin/allyabase/SERVICE
    // Example: node seed-ecosystem.js wiki-ent
    const wikiEnv = env.substring(5); // Remove 'wiki-' prefix
    const baseURL = `https://${wikiEnv}.allyabase.com/plugin/allyabase`;
    return {
      dolores: `${baseURL}/dolores`,
      prof: `${baseURL}/prof`,
      sanora: `${baseURL}/sanora`,
      bdo: `${baseURL}/bdo`,
      julia: `${baseURL}/julia`,
      continuebee: `${baseURL}/continuebee`,
      fount: `${baseURL}/fount`,
      aretha: `${baseURL}/aretha`,
      advancement: `https://${wikiEnv}.allyabase.com` // Main wiki serves advancement
    };
  } else {
    // For any other environment, use it as a subdomain prefix (e.g., 'ent', 'staging', 'prod')
    return {
      dolores: `https://${env}.dolores.allyabase.com`,
      prof: `https://${env}.prof.allyabase.com`,
      sanora: `https://${env}.sanora.allyabase.com`,
      bdo: `https://${env}.bdo.allyabase.com`,
      julia: `https://${env}.julia.allyabase.com`,
      continuebee: `https://${env}.continuebee.allyabase.com`,
      fount: `https://${env}.fount.allyabase.com`,
      aretha: `https://${env}.aretha.allyabase.com`,
      advancement: `https://${env}.advancement.allyabase.com`
    };
  }
};

const SERVICES = getServiceURLs(ENVIRONMENT, BASE_NUMBER);

// HTTP helper functions
const post = async (url, payload) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ POST ${url} failed:`, error.message);
    throw error;
  }
};

const put = async (url, payload) => {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ PUT ${url} failed:`, error.message);
    throw error;
  }
};

const get = async (url) => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ GET ${url} failed:`, error.message);
    throw error;
  }
};

// Sample data generators have been moved to examples/ directory
// Now imported at the top of the file


// Service interaction classes
class ProfSeeder {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.users = [];
  }

  async createUser(seed) {
    return await createTestUser(seed);
  }

  async createProfile(user, profileData) {
    try {
      const timestamp = new Date().getTime();
      const hash = sessionless.generateUUID();
      const signature = await signMessage(user.privateKey, user.uuid + timestamp, user.pubKey);

      const response = await post(`${this.baseURL}/user/${user.uuid}/profile`, {
        uuid: user.uuid,
        timestamp,
        hash,
        signature,
        profileData: {
          ...profileData,
          tags: profileData.tags || ['author'], // Use profile's tags for filtering
          additional_fields: {
            idothis: profileData.idothis
          }
        }
      });

      return response;
    } catch (error) {
      console.error(`Failed to create profile for ${profileData.name}:`, error.message);
      return null;
    }
  }

  async seedProfiles() {
    console.log('👥 Seeding Prof service with user profiles...');

    const profiles = generateProfiles();

    for (const userData of profiles) {
      try {
        const user = await this.createUser(`prof-user-${userData.name}`);
        const profile = await this.createProfile(user, userData);

        if (profile) {
          this.users.push({ ...user, profile: userData });
          console.log(`  ✅ Created profile: ${userData.name} (${userData.tags.join(', ')})`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to create profile for ${userData.name}:`, error.message);
      }
    }

    console.log(`📊 Prof seeding complete: ${this.users.length} profiles created\n`);
    return this.users;
  }
}

class SanoraSeeder {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.products = [];
    this.blogPosts = [];
  }

  async createUser(seed) {
    const keys = await createTestUser(seed);
    const timestamp = new Date().getTime();
    const signature = await signMessage(keys.privateKey, timestamp + keys.pubKey, keys.pubKey);

    try {
      const response = await put(`${this.baseURL}/user/create`, {
        timestamp: timestamp.toString(),
        pubKey: keys.pubKey,
        signature
      });

      return {
        uuid: response.uuid,
        pubKey: keys.pubKey,
        privateKey: keys.privateKey
      };
    } catch (error) {
      console.error('Failed to create Sanora user:', error.message);
      return null;
    }
  }

  async createProduct(user, productData) {
    try {
      const timestamp = new Date().getTime();
      const message = timestamp + user.uuid + productData.title + productData.description + productData.price;
      const signature = await signMessage(user.privateKey, message, user.pubKey);

      const response = await put(`${this.baseURL}/user/${user.uuid}/product/${encodeURIComponent(productData.title)}`, {
        ...productData,
        timestamp: timestamp.toString(),
        signature
      });

      return response;
    } catch (error) {
      console.error(`Failed to create product ${productData.title}:`, error.message);
      return null;
    }
  }

  async seedProducts() {
    console.log('🛍️ Seeding Sanora service with products via enchant-product spell...');

    try {
      const user = await this.createUser('sanora-products-user');
      if (!user) {
        throw new Error('Failed to create Sanora user');
      }

      const sampleProducts = generateSampleProducts();

      for (const productData of sampleProducts) {
        // Cast enchant-product spell (200 MP) to create product + BDO
        const result = await this.castEnchantProductSpell(user, productData);
        if (result && result.success) {
          this.products.push(result.product);
          console.log(`  ✅ Created product + BDO: ${productData.title}`);
          if (result.bdo && result.bdo.emojiShortcode) {
            console.log(`     Emoji: ${result.bdo.emojiShortcode}`);
          }
        } else {
          console.error(`  ⚠️  Failed to enchant product: ${productData.title}`);
        }
      }

      console.log(`📊 Sanora product seeding complete: ${this.products.length} products + BDOs created\n`);
    } catch (error) {
      console.error('❌ Sanora seeding failed:', error.message);
    }

    return this.products;
  }

  async castEnchantProductSpell(user, productData) {
    try {
      // 1. Get gateway for enchant-product spell (requires 200 MP)
      const gatewayTimestamp = new Date().getTime();
      const gatewayMessage = gatewayTimestamp + user.uuid;
      const gatewaySignature = await signMessage(user.privateKey, gatewayMessage, user.pubKey);

      const gateway = {
        timestamp: gatewayTimestamp.toString(),
        uuid: user.uuid,
        signature: gatewaySignature,
        minimumCost: 200, // enchant-product costs 200 MP
        ordinal: 0
      };

      // 2. Cast the spell with product components
      const spell = {
        casterUUID: user.uuid,
        gateway: gateway,
        components: {
          title: productData.title,
          description: productData.description,
          price: productData.price,
          tags: productData.tags,
          category: productData.category,
          contentType: productData.contentType,
          productId: productData.productId,
          metadata: productData.metadata || {}
          // svgContent is optional - spell will auto-generate if not provided
        }
      };

      // 3. POST to MAGIC endpoint
      const response = await post(`${this.baseURL}/magic/spell/enchant-product`, spell);
      return response;
    } catch (error) {
      console.error(`Failed to cast enchant-product spell:`, error.message);
      return null;
    }
  }

  async seedBlogPosts() {
    console.log('📝 Seeding Sanora service with blog posts...');

    try {
      const user = await this.createUser('sanora-blogs-user');
      if (!user) {
        throw new Error('Failed to create Sanora user for blog posts');
      }

      const blogPosts = generateBlogPosts();

      for (const postData of blogPosts) {
        const blogPost = await this.createProduct(user, {
          ...postData,
          price: 0, // Blog posts are free
          tags: postData.tags || [],
          contentType: 'external'
        });

        if (blogPost) {
          this.blogPosts.push(blogPost);
          console.log(`  ✅ Created blog post: ${postData.title}`);
        }
      }

      console.log(`📊 Sanora blog seeding complete: ${this.blogPosts.length} blog posts created\n`);
    } catch (error) {
      console.error('❌ Sanora blog seeding failed:', error.message);
    }

    return this.blogPosts;
  }

  async seedRooms() {
    console.log('🏠 Seeding Sanora service with room listings for Roomz...');

    try {
      const user = await this.createUser('sanora-roomz-user');
      if (!user) {
        throw new Error('Failed to create Sanora user for rooms');
      }

      const rooms = [];

      for (const roomData of exampleRooms) {
        const roomProduct = generateRoomProduct(roomData);
        const room = await this.createProduct(user, roomProduct);

        if (room) {
          rooms.push(room);
          console.log(`  ✅ Created room: ${roomData.name}`);
          console.log(`     ${roomData.beds} bed, ${roomData.baths} bath • ${roomData.size} sq ft`);
          console.log(`     $${(roomData.monthlyRent / 100).toFixed(2)}/mo`);
        }
      }

      console.log(`📊 Sanora room seeding complete: ${rooms.length} rooms created\n`);
      return rooms;
    } catch (error) {
      console.error('❌ Sanora room seeding failed:', error.message);
      return [];
    }
  }
}

class DoloresSeeder {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.posts = [];
  }

  async createUser(seed) {
    const keys = await createTestUser(seed);
    const timestamp = new Date().getTime();
    const signature = await signMessage(keys.privateKey, timestamp + keys.pubKey, keys.pubKey);

    try {
      const response = await put(`${this.baseURL}/user/create`, {
        timestamp: timestamp.toString(),
        pubKey: keys.pubKey,
        signature,
        dolores: {} // Empty dolores object for new user
      });

      return {
        uuid: response.uuid,
        pubKey: keys.pubKey,
        privateKey: keys.privateKey
      };
    } catch (error) {
      console.error('Failed to create Dolores user:', error.message);
      return null;
    }
  }

  async seedPosts() {
    console.log('📱 Seeding Dolores service with social posts...');
    
    try {
      const user = await this.createUser('dolores-posts-user');
      if (!user) {
        throw new Error('Failed to create Dolores user');
      }

      const socialPosts = generateSocialPosts();
      
      // Note: Dolores API doesn't have post creation endpoint in the client SDK
      // This is a placeholder for when that functionality is added
      for (const postData of socialPosts) {
        // For now, just store the posts data
        this.posts.push({
          ...postData,
          uuid: sessionless.generateUUID(),
          timestamp: new Date().getTime(),
          userUuid: user.uuid
        });
        console.log(`  ✅ Prepared post: ${postData.content.substring(0, 50)}...`);
      }
      
      console.log(`📊 Dolores seeding complete: ${this.posts.length} posts prepared\n`);
    } catch (error) {
      console.error('❌ Dolores seeding failed:', error.message);
    }
    
    return this.posts;
  }
}

class BDOSeeder {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.bases = [];
  }

  async createUser(seed) {
    const keys = await createTestUser(seed);
    const timestamp = new Date().getTime();
    const hash = sessionless.generateUUID();
    const signature = await signMessage(keys.privateKey, timestamp + keys.pubKey + hash, keys.pubKey);

    try {
      const response = await put(`${this.baseURL}/user/create`, {
        timestamp: timestamp.toString(),
        pubKey: keys.pubKey,
        hash,
        signature,
        bdo: { bases: [], discoveryData: {} }
      });

      // BDO API might return full response object or just UUID string
      const uuid = typeof response === 'string' ? response :
                   response?.uuid || response?.data?.uuid || keys.uuid;

      console.log(`  ✅ BDO user created with UUID: ${uuid}`);

      return {
        uuid: uuid,
        pubKey: keys.pubKey,
        privateKey: keys.privateKey,
        hash
      };
    } catch (error) {
      console.error('Failed to create BDO user:', error.message);
      return null;
    }
  }

  async seedBaseDiscovery() {
    console.log('🌍 Seeding BDO service with base discovery data...');
    
    try {
      const user = await this.createUser('bdo-discovery-user');
      if (!user) {
        throw new Error('Failed to create BDO user');
      }

      // Sample base discovery data
      const basesData = [
        {
          name: 'Tech Hub Base',
          description: 'A community focused on technology, programming, and innovation',
          url: `http://localhost:${SERVICES.bdo.split(':')[2]}`,
          lexary: ['technology', 'programming', 'innovation', 'startups'],
          photary: ['tech-demos', 'code-screenshots', 'office-spaces'],
          viewary: ['coding-tutorials', 'tech-talks', 'product-demos']
        },
        {
          name: 'Creative Collective',
          description: 'Artists, designers, and creative professionals sharing their work',
          url: `http://localhost:${parseInt(SERVICES.bdo.split(':')[2]) + 100}`,
          lexary: ['design', 'art', 'creativity', 'inspiration'],
          photary: ['artwork', 'design-process', 'creative-spaces'],
          viewary: ['design-timelapses', 'art-tutorials', 'creative-interviews']
        },
        {
          name: 'Business Network',
          description: 'Entrepreneurs and business professionals collaborating and networking',
          url: `http://localhost:${parseInt(SERVICES.bdo.split(':')[2]) + 200}`,
          lexary: ['business', 'entrepreneurship', 'networking', 'growth'],
          photary: ['team-photos', 'office-tours', 'event-coverage'],
          viewary: ['pitch-presentations', 'business-talks', 'success-stories']
        }
      ];

      // Save bases to BDO
      const timestamp = new Date().getTime();
      const signature = await signMessage(user.privateKey, timestamp + user.uuid + user.hash, user.pubKey);

      await put(`${this.baseURL}/user/${user.uuid}/bases`, {
        timestamp: timestamp.toString(),
        uuid: user.uuid,
        hash: user.hash,
        signature,
        bases: basesData
      });

      this.bases = basesData;
      console.log(`  ✅ Created base discovery data: ${basesData.length} bases`);
      console.log(`📊 BDO seeding complete: ${this.bases.length} bases saved\n`);
    } catch (error) {
      console.error('❌ BDO seeding failed:', error.message);
    }
    
    return this.bases;
  }

  // Simple emojicoding for encoding pubKey (kept for backwards compatibility)
  simpleEncodeHex(hexString) {
    const BASE64_TO_EMOJI = {
      'A': '😀', 'B': '😃', 'C': '😄', 'D': '😁', 'E': '😆', 'F': '😅', 'G': '😂', 'H': '😊',
      'I': '😉', 'J': '😍', 'K': '😘', 'L': '😋', 'M': '😎', 'N': '😐', 'O': '😑', 'P': '😔',
      'Q': '❤️', 'R': '💛', 'S': '💚', 'T': '💙', 'U': '💜', 'V': '💔', 'W': '💕', 'X': '💖',
      'Y': '👍', 'Z': '👎', 'a': '👌', 'b': '✌️', 'c': '👈', 'd': '👉', 'e': '👆', 'f': '👇',
      'g': '☀️', 'h': '🌙', 'i': '⭐', 'j': '⚡', 'k': '☁️', 'l': '❄️', 'm': '🔥', 'n': '💧',
      'o': '🐶', 'p': '🐱', 'q': '🐭', 'r': '🐰', 's': '🐻', 't': '🐯', 'u': '🐸', 'v': '🐧',
      'w': '💎', 'x': '🔑', 'y': '🎁', 'z': '🎉', '0': '🏠', '1': '🚗', '2': '📱', '3': '⚽',
      '4': '🍎', '5': '🍊', '6': '🍌', '7': '🍕', '8': '🍔', '9': '🍰', '+': '☕', '/': '🍺',
      '=': '🌿'
    };

    const binaryString = hexString.match(/.{2}/g).map(hex =>
      String.fromCharCode(parseInt(hex, 16))
    ).join('');

    const base64 = Buffer.from(binaryString, 'binary').toString('base64');
    const emoji = base64.split('').map(char => BASE64_TO_EMOJI[char] || char).join('');

    return '✨' + emoji + '✨';
  }

  // Fetch the real emojicode from BDO service
  async getEmojicodeForPubKey(pubKey) {
    try {
      const response = await get(`${this.baseURL}/pubkey/${pubKey}/emojicode`);
      return response.emojicode;
    } catch (error) {
      console.error(`  ⚠️  Failed to fetch emojicode for pubKey: ${error.message}`);
      // Fallback to local encoding if BDO service doesn't have it yet
      return this.simpleEncodeHex(pubKey.toLowerCase());
    }
  }

  async seedProductBDO(productId, productTitle, productPrice) {
    console.log(`🛍️ Seeding product BDO with SVG content for: ${productTitle}...`);

    try {
      const user = await this.createUser(`product-bdo-user-${productId}`);
      if (!user) {
        throw new Error(`Failed to create product BDO user for ${productId}`);
      }

      // Create product BDO with SVG - includes productId and base UUID in spell-components
      const productBDOData = {
        title: productTitle,
        type: "product",
        productId: productId,
        price: productPrice,
        svgContent: `<svg width="320" height="60" viewBox="0 0 320 60" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="320" height="60" fill="#f8f9fa" stroke="#e9ecef" stroke-width="1" rx="8"/>
  <rect spell="share" x="10" y="10" width="90" height="40" fill="#3498db" stroke="#2980b9" stroke-width="2" rx="6">
    <title>Share this product</title>
  </rect>
  <text spell="share" x="55" y="32" text-anchor="middle" fill="white" font-size="12" font-weight="bold">📤 SHARE</text>
  <rect spell="add-to-cart" spell-components="productId:${productId};baseUuid:${user.uuid}" x="115" y="10" width="90" height="40" fill="#27ae60" stroke="#219a52" stroke-width="2" rx="6">
    <title>Add to cart</title>
  </rect>
  <text spell="add-to-cart" x="160" y="32" text-anchor="middle" fill="white" font-size="11" font-weight="bold">🛒 ADD TO CART</text>
  <rect spell="magic" x="220" y="10" width="90" height="40" fill="#e91e63" stroke="#c2185b" stroke-width="2" rx="6">
    <title>Cast product magic</title>
  </rect>
  <text spell="magic" x="265" y="32" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🪄 MAGIC</text>
</svg>`,
        description: `Interactive product actions for ${productTitle}`
      };

      // Create the BDO with the product data
      const timestamp = new Date().getTime();
      const hash = '';
      const messageToSign = timestamp + hash + user.pubKey;
      const signature = await signMessage(user.privateKey, messageToSign, user.pubKey);

      const bdoPayload = {
        timestamp: timestamp.toString(),
        hash,
        pubKey: user.pubKey,
        signature,
        public: true,
        bdo: productBDOData
      };

      const bdoResponse = await put(`${this.baseURL}/user/create`, bdoPayload);

      // Get emoji shortcode from response (or fallback to fetching it)
      const emojiShortcode = bdoResponse.emojiShortcode || await this.getEmojicodeForPubKey(user.pubKey);

      console.log(`  ✅ Product BDO created successfully`);
      console.log(`  🔑 PubKey: ${user.pubKey}`);
      console.log(`  🎨 Emoji Shortcode: ${emojiShortcode}`);
      console.log(`  📦 Product ID: ${productId}`);
      console.log(`  💰 Price: $${(productPrice / 100).toFixed(2)}`);

      // Track for final summary
      emojicodedReferences.push({
        type: 'Product',
        title: productTitle,
        productId,
        price: `$${(productPrice / 100).toFixed(2)}`,
        pubKey: user.pubKey,
        emojiShortcode,
        uuid: bdoResponse.uuid || user.uuid
      });

      return {
        uuid: bdoResponse.uuid || user.uuid,
        pubKey: user.pubKey,
        emojiShortcode,
        bdo: productBDOData,
        productId
      };
    } catch (error) {
      console.error(`❌ Product BDO seeding failed for ${productId}:`, error.message);
      console.error('   Stack:', error.stack);
      return null;
    }
  }

  async seedContractSigningBDO(contractId, contractTitle, participantPubKeys) {
    console.log(`📜 Seeding contract signing UI BDO for: ${contractTitle}...`);

    try {
      const user = await this.createUser(`contract-signing-ui-${contractId}`);
      user.pubKey = user.pubKey.toLowerCase();
      if (!user) {
        throw new Error('Failed to create contract signing UI user');
      }

      console.log(`  🔍 Contract signing UI user created:`, {
        uuid: user.uuid,
        pubKey: user.pubKey,
        contractId
      });

      // Create contract signing UI BDO with participants array
      const contractSigningBDOData = {
        title: `Contract Signing: ${contractTitle}`,
        type: "contract-signing-ui",
        contractId: contractId,
        contractUuid: user.uuid, // The UUID used to access the contract in Covenant
        participants: participantPubKeys, // Array of pubKeys authorized to sign
        svgContent: `<svg width="320" height="60" viewBox="0 0 320 60" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="320" height="60" fill="#f8f9fa" stroke="#e9ecef" stroke-width="1" rx="8"/>
  <rect spell="sign" spell-components="contractUuid:${user.uuid};contractId:${contractId}" x="10" y="10" width="90" height="40" fill="#27ae60" stroke="#219a52" stroke-width="2" rx="6">
    <title>Sign this contract</title>
  </rect>
  <text spell="sign" spell-components="contractUuid:${user.uuid};contractId:${contractId}" x="55" y="32" text-anchor="middle" fill="white" font-size="12" font-weight="bold">✍️ SIGN</text>
  <rect spell="decline" spell-components="contractUuid:${user.uuid};contractId:${contractId}" x="115" y="10" width="90" height="40" fill="#e74c3c" stroke="#c0392b" stroke-width="2" rx="6">
    <title>Decline this contract</title>
  </rect>
  <text spell="decline" spell-components="contractUuid:${user.uuid};contractId:${contractId}" x="160" y="32" text-anchor="middle" fill="white" font-size="12" font-weight="bold">❌ DECLINE</text>
  <rect spell="magic" x="220" y="10" width="90" height="40" fill="#e91e63" stroke="#c2185b" stroke-width="2" rx="6">
    <title>Cast contract magic</title>
  </rect>
  <text spell="magic" x="265" y="32" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🪄 MAGIC</text>
</svg>`,
        description: `Signing interface for contract: ${contractTitle}`,
        createdAt: new Date().toISOString()
      };

      // Create the BDO with the contract signing UI data
      const timestamp = new Date().getTime();
      const hash = '';
      const messageToSign = timestamp + user.pubKey + hash;
      const signature = await signMessage(user.privateKey, messageToSign, user.pubKey);

      const bdoPayload = {
        timestamp: timestamp.toString(),
        hash,
        pubKey: user.pubKey,
        signature,
        public: true,
        bdo: contractSigningBDOData
      };

      const bdoResponse = await put(`${this.baseURL}/user/create`, bdoPayload);

      // Get emoji shortcode from response (or fallback to fetching it)
      const emojiShortcode = bdoResponse.emojiShortcode || await this.getEmojicodeForPubKey(user.pubKey);

      console.log(`  ✅ Contract signing UI BDO created successfully`);
      console.log(`  🔑 PubKey: ${user.pubKey}`);
      console.log(`  🎨 Emoji Shortcode: ${emojiShortcode}`);
      console.log(`  📝 Contract: ${contractTitle}`);
      console.log(`  👥 Participants: ${participantPubKeys.length} authorized signers`);

      // Track for final summary
      emojicodedReferences.push({
        type: 'Contract Signing UI',
        title: contractTitle,
        contractId,
        participants: participantPubKeys.length,
        pubKey: user.pubKey,
        emojiShortcode,
        uuid: bdoResponse.uuid || user.uuid
      });

      return {
        uuid: bdoResponse.uuid || user.uuid,
        pubKey: user.pubKey,
        emojiShortcode,
        bdo: contractSigningBDOData,
        contractId
      };
    } catch (error) {
      console.error(`❌ Contract signing UI BDO seeding failed for ${contractId}:`, error.message);
      console.error('   Stack:', error.stack);
      return null;
    }
  }

  async seedRecipeBDO() {
    console.log('🍪 Seeding recipe BDO with SVG content...');

    try {
      const user = await this.createUser('recipe-bdo-user');
      user.pubKey = user.pubKey.toLowerCase();
      if (!user) {
        throw new Error('Failed to create recipe BDO user');
      }

      console.log(`  🔍 Recipe BDO user created:`, {
        uuid: user.uuid,
        pubKey: user.pubKey
      });

      // Create complete recipe BDO with SVG
      const recipeBDOData = {
        title: "Grandma's Secret Chocolate Chip Cookies Recipe",
        type: "recipe",
        svgContent: `<svg width="320" height="60" viewBox="0 0 320 60" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="320" height="60" fill="#f8f9fa" stroke="#e9ecef" stroke-width="1" rx="8"/>
  <rect spell="share" x="10" y="10" width="90" height="40" fill="#27ae60" stroke="#219a52" stroke-width="2" rx="6">
    <title>Share this recipe</title>
  </rect>
  <text spell="share" x="55" y="32" text-anchor="middle" fill="white" font-size="12" font-weight="bold">📤 SHARE</text>
  <rect spell="collect" x="115" y="10" width="90" height="40" fill="#9b59b6" stroke="#8e44ad" stroke-width="2" rx="6">
    <title>Save to your collection</title>
  </rect>
  <text spell="collect" x="160" y="32" text-anchor="middle" fill="white" font-size="12" font-weight="bold">💾 SAVE</text>
  <rect spell="magic" x="220" y="10" width="90" height="40" fill="#e91e63" stroke="#c2185b" stroke-width="2" rx="6">
    <title>Cast kitchen magic</title>
  </rect>
  <text spell="magic" x="265" y="32" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🪄 MAGIC</text>
</svg>`,
        description: "A family recipe passed down through generations, featuring the perfect balance of crispy edges and chewy centers.",
        author: {
          name: "Sarah Mitchell",
          bio: "Home baker and food blogger sharing family recipes",
          location: "Portland, Oregon"
        },
        ingredients: [
          { item: "all-purpose flour", amount: "2¼ cups" },
          { item: "unsalted butter, softened", amount: "1 cup (2 sticks)" },
          { item: "granulated sugar", amount: "¾ cup" },
          { item: "packed brown sugar", amount: "¾ cup" },
          { item: "large eggs", amount: "2" },
          { item: "pure vanilla extract", amount: "2 teaspoons" },
          { item: "baking soda", amount: "1 teaspoon" },
          { item: "salt", amount: "1 teaspoon" },
          { item: "semi-sweet chocolate chips", amount: "2 cups" }
        ],
        instructions: [
          "Preheat your oven to 375°F (190°C). Line two baking sheets with parchment paper.",
          "In a medium bowl, whisk together flour, baking soda, and salt. Set aside.",
          "In a large bowl, cream together the softened butter, granulated sugar, and brown sugar until light and fluffy (about 3-4 minutes with an electric mixer).",
          "Beat in eggs one at a time, then add vanilla extract. Mix until well combined.",
          "Gradually blend in the flour mixture until just combined. Don't overmix! Fold in chocolate chips gently.",
          "Drop rounded tablespoons of dough onto prepared baking sheets, spacing them about 2 inches apart.",
          "Bake for 9-11 minutes, or until edges are golden brown but centers still look slightly underdone. Cool on baking sheet for 5 minutes before transferring to wire rack."
        ],
        tags: ["cookies", "chocolate-chip", "dessert", "baking", "family-recipe", "comfort-food"]
      };

      // Create the BDO with the recipe data
      const timestamp = new Date().getTime();
      const hash = '';
      const messageToSign = timestamp + user.pubKey + hash;
      const signature = await signMessage(user.privateKey, messageToSign, user.pubKey);

      const bdoPayload = {
        timestamp: timestamp.toString(),
        hash,
        pubKey: user.pubKey,
        signature,
        public: true,
        bdo: recipeBDOData
      };

      const bdoResponse = await put(`${this.baseURL}/user/create`, bdoPayload);
      console.log('bdoResponse is ', bdoResponse);

      // Get emoji shortcode from response (or fallback to fetching it)
      const emojiShortcode = bdoResponse.emojiShortcode || await this.getEmojicodeForPubKey(user.pubKey);

      console.log(`  ✅ Recipe BDO created successfully`);
      console.log(`  🔑 PubKey: ${user.pubKey}`);
      console.log(`  🎨 Emoji Shortcode: ${emojiShortcode}`);
      console.log(`  ☮️  bdoPayloadPubKey: ${bdoPayload.pubKey}`);
      console.log(`  📝 Title: ${recipeBDOData.title}`);
      console.log(`  ✅ SVG content: ${recipeBDOData.svgContent ? 'Present' : 'Missing'}`);

      // Try to update recipe-blog.html with the new emoji shortcode
      const possiblePaths = [
        path.join(process.cwd(), '../../the-advancement/test-server/public/recipe-blog.html'),
        path.join(process.cwd(), '../../../the-advancement/test-server/public/recipe-blog.html'),
        path.join(process.cwd(), 'the-advancement/test-server/public/recipe-blog.html'),
        '/Users/zachbabb/Work/planet-nine/the-advancement/test-server/public/recipe-blog.html'
      ];

      let htmlUpdated = false;
      for (const htmlPath of possiblePaths) {
        try {
          if (fs.existsSync(htmlPath)) {
            console.log(`  📄 Found recipe-blog.html at: ${htmlPath}`);

            let htmlContent = fs.readFileSync(htmlPath, 'utf8');

            // Replace the emojicoded display content (between the div tags)
            // Look for the pattern: <div class="emojicoded-display">...</div>
            const emojicodedPattern = /(<div class="emojicoded-display">)([\s\S]*?)(<\/div>)/;

            if (emojicodedPattern.test(htmlContent)) {
              htmlContent = htmlContent.replace(
                emojicodedPattern,
                `$1\n                    ${emojiShortcode}\n                $3`
              );

              fs.writeFileSync(htmlPath, htmlContent, 'utf8');
              console.log(`  ✅ Updated recipe-blog.html with new emoji shortcode`);
              htmlUpdated = true;
              break;
            } else {
              console.log(`  ⚠️  Could not find emojicoded-display div in ${htmlPath}`);
            }
          }
        } catch (error) {
          console.log(`  ⚠️  Could not update ${htmlPath}: ${error.message}`);
        }
      }

      if (!htmlUpdated) {
        console.log(`\n  ⚠️  Could not find recipe-blog.html to update automatically`);
        console.log(`  📋 Manually update recipe-blog.html with this emoji shortcode:`);
        console.log(`     ${emojiShortcode}\n`);
      }

      // Track for final summary
      emojicodedReferences.push({
        type: 'Recipe',
        title: recipeBDOData.title,
        pubKey: user.pubKey,
        emojiShortcode,
        uuid: bdoResponse.uuid || user.uuid,
        htmlUpdated
      });

      return {
        uuid: bdoResponse.uuid || user.uuid,
        pubKey: user.pubKey,
        emojiShortcode,
        bdo: recipeBDOData,
        htmlUpdated
      };
    } catch (error) {
      console.error('❌ Recipe BDO seeding failed:', error.message);
      console.error('   Stack:', error.stack);
      return null;
    }
  }

  async seedMusicBDO(trackData) {
    console.log(`🎵 Seeding music BDO for: ${trackData.title}...`);

    try {
      const user = await this.createUser(`music-bdo-user-${trackData.title.replace(/\s+/g, '-').toLowerCase()}`);
      if (!user) {
        throw new Error('Failed to create music BDO user');
      }

      const musicBDOData = generateMusicBDO(trackData);

      // Create the BDO (similar pattern to seedRecipeBDO)
      const timestamp = new Date().getTime();
      const hash = '';
      const messageToSign = timestamp + user.pubKey + hash;
      const signature = await signMessage(user.privateKey, messageToSign, user.pubKey);

      const bdoPayload = {
        timestamp: timestamp.toString(),
        hash,
        pubKey: user.pubKey,
        signature,
        public: true,
        bdo: musicBDOData
      };

      const bdoResponse = await put(`${this.baseURL}/user/create`, bdoPayload);

      // Get emoji shortcode from response (or fallback to fetching it)
      const emojiShortcode = bdoResponse.emojiShortcode || await this.getEmojicodeForPubKey(user.pubKey);

      console.log(`  ✅ Music BDO created successfully`);
      console.log(`  🎵 Track: ${trackData.title} by ${trackData.artist}`);
      console.log(`  🔑 PubKey: ${user.pubKey}`);
      console.log(`  🎨 Emoji Shortcode: ${emojiShortcode}`);
      console.log(`  🎧 Platform: ${musicBDOData.metadata.platform}`);

      emojicodedReferences.push({
        type: 'Music',
        title: trackData.title,
        artist: trackData.artist,
        platform: musicBDOData.metadata.platform,
        pubKey: user.pubKey,
        emojiShortcode,
        uuid: bdoResponse.uuid || user.uuid
      });

      return { uuid: bdoResponse.uuid || user.uuid, pubKey: user.pubKey, emojiShortcode };
    } catch (error) {
      console.error(`❌ Music BDO seeding failed:`, error.message);
      return null;
    }
  }

  async seedCanimusFeedBDO(feedData) {
    console.log(`📼 Seeding Canimus feed BDO: ${feedData.feedTitle}...`);

    try {
      const user = await this.createUser(`canimus-feed-bdo-${feedData.feedTitle.replace(/\s+/g, '-').toLowerCase()}`);
      if (!user) {
        throw new Error('Failed to create Canimus feed BDO user');
      }

      const canimusBDOData = generateCanimusFeedBDO(feedData);

      // Create the BDO
      const timestamp = new Date().getTime();
      const hash = '';
      const messageToSign = timestamp + user.pubKey + hash;
      const signature = await signMessage(user.privateKey, messageToSign, user.pubKey);

      const bdoPayload = {
        timestamp: timestamp.toString(),
        hash,
        pubKey: user.pubKey,
        signature,
        public: true,
        bdo: canimusBDOData
      };

      const bdoResponse = await put(`${this.baseURL}/user/create`, bdoPayload);

      // Get emoji shortcode from response (or fallback to fetching it)
      const emojiShortcode = bdoResponse.emojiShortcode || await this.getEmojicodeForPubKey(user.pubKey);

      console.log(`  ✅ Canimus feed BDO created successfully`);
      console.log(`  📼 Feed: ${feedData.feedTitle} by ${feedData.artist}`);
      console.log(`  🔑 PubKey: ${user.pubKey}`);
      console.log(`  🎨 Emoji Shortcode: ${emojiShortcode}`);
      console.log(`  🔗 Feed URL: ${feedData.feedUrl}`);

      emojicodedReferences.push({
        type: 'Canimus Feed',
        title: feedData.feedTitle,
        artist: feedData.artist,
        feedUrl: feedData.feedUrl,
        pubKey: user.pubKey,
        emojiShortcode,
        uuid: bdoResponse.uuid || user.uuid
      });

      return { uuid: bdoResponse.uuid || user.uuid, pubKey: user.pubKey, emojiShortcode };
    } catch (error) {
      console.error(`❌ Canimus feed BDO seeding failed:`, error.message);
      return null;
    }
  }

  async seedRoomBDO(roomData) {
    console.log(`🏠 Seeding room BDO for: ${roomData.name}...`);

    try {
      const user = await this.createUser(`room-bdo-user-${roomData.name.replace(/\s+/g, '-').toLowerCase()}`);
      if (!user) {
        throw new Error('Failed to create room BDO user');
      }

      // Generate horizontal SVG content for the room (optimized for AdvanceKey)
      const svgContent = generateRoomHorizontalSVG(roomData);

      const roomBDOData = {
        title: roomData.name,
        type: "room",
        contentType: "room",
        category: "rental",
        svgContent: svgContent,
        metadata: {
          beds: roomData.beds,
          baths: roomData.baths,
          size: roomData.size,
          monthlyRent: roomData.monthlyRent,
          deposit: roomData.deposit,
          dateAvailable: roomData.dateAvailable,
          roomPic: roomData.roomPic,
          amenities: roomData.amenities,
          address: roomData.address,
          neighborhood: roomData.neighborhood,
          rentFormatted: `$${(roomData.monthlyRent / 100).toFixed(2)}/mo`,
          depositFormatted: `$${(roomData.deposit / 100).toFixed(2)}`
        },
        description: roomData.description || `${roomData.beds} bed, ${roomData.baths} bath apartment in ${roomData.neighborhood}`
      };

      // Create the BDO
      const timestamp = new Date().getTime();
      const hash = '';
      const messageToSign = timestamp + user.pubKey + hash;
      const signature = await signMessage(user.privateKey, messageToSign, user.pubKey);

      const bdoPayload = {
        timestamp: timestamp.toString(),
        hash,
        pubKey: user.pubKey,
        signature,
        public: true,
        bdo: roomBDOData
      };

      const bdoResponse = await put(`${this.baseURL}/user/create`, bdoPayload);

      // Get emoji shortcode from response (or fallback to fetching it)
      const emojiShortcode = bdoResponse.emojiShortcode || await this.getEmojicodeForPubKey(user.pubKey);

      console.log(`  ✅ Room BDO created successfully`);
      console.log(`  🏠 Room: ${roomData.name}`);
      console.log(`  🔑 PubKey: ${user.pubKey}`);
      console.log(`  🎨 Emoji Shortcode: ${emojiShortcode}`);
      console.log(`  💰 Rent: $${(roomData.monthlyRent / 100).toFixed(2)}/mo`);

      emojicodedReferences.push({
        type: 'Room',
        title: roomData.name,
        beds: roomData.beds,
        baths: roomData.baths,
        size: roomData.size,
        rent: `$${(roomData.monthlyRent / 100).toFixed(2)}/mo`,
        neighborhood: roomData.neighborhood,
        pubKey: user.pubKey,
        emojiShortcode,
        uuid: bdoResponse.uuid || user.uuid
      });

      return { uuid: bdoResponse.uuid || user.uuid, pubKey: user.pubKey, emojiShortcode };
    } catch (error) {
      console.error(`❌ Room BDO seeding failed:`, error.message);
      return null;
    }
  }

  async seedEventBDO(eventData) {
    console.log(`🎫 Seeding event BDO for: ${eventData.title}...`);

    try {
      const user = await this.createUser(`event-bdo-user-${eventData.title.replace(/\s+/g, '-').toLowerCase()}`);
      if (!user) {
        throw new Error('Failed to create event BDO user');
      }

      // Format price based on type (MP or cash)
      const priceType = eventData.priceType || 'cash';
      let priceDisplay;
      if (priceType === 'mp') {
        priceDisplay = `${eventData.ticketPrice} MP`;
      } else {
        priceDisplay = `$${(eventData.ticketPrice / 100).toFixed(2)}`;
      }

      // Generate SVG content with purchase spell
      const svgContent = `<svg width="320" height="120" xmlns="http://www.w3.org/2000/svg">
  <!-- Animated gradient background -->
  <defs>
    <linearGradient id="eventGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#9b59b6;stop-opacity:1">
        <animate attributeName="stop-color"
                 values="#9b59b6;#3498db;#9b59b6"
                 dur="3s" repeatCount="indefinite"/>
      </stop>
      <stop offset="100%" style="stop-color:#3498db;stop-opacity:1">
        <animate attributeName="stop-color"
                 values="#3498db;#9b59b6;#3498db"
                 dur="3s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>
  </defs>

  <rect fill="url(#eventGrad)" width="320" height="120" rx="12"/>

  <!-- Event title -->
  <text x="160" y="25" fill="white" font-size="18" text-anchor="middle" font-weight="bold">
    🎉 ${eventData.title}
  </text>

  <!-- Event details -->
  <text x="160" y="45" fill="white" font-size="12" text-anchor="middle">
    ${eventData.date}
  </text>
  <text x="160" y="62" fill="white" font-size="11" text-anchor="middle">
    ${eventData.location}
  </text>

  <!-- Animated stars -->
  <circle cx="30" cy="25" r="3" fill="yellow" opacity="0.8">
    <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
  </circle>
  <circle cx="290" cy="25" r="3" fill="yellow" opacity="0.8">
    <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
  </circle>

  <!-- Purchase button -->
  <rect spell="purchase"
        spell-components='{"eventUUID":"${user.uuid}", "ticketFlavor":"${eventData.ticketFlavor}", "amount":${eventData.ticketPrice}, "priceType":"${priceType}"}'
        x="85" y="75" width="150" height="35"
        fill="#27ae60" stroke="#219a52" stroke-width="2" rx="6"/>
  <text spell="purchase" x="160" y="97" fill="white" font-size="14"
        text-anchor="middle" font-weight="bold">
    🎫 BUY TICKET (${priceDisplay})
  </text>
</svg>`;

      const eventBDOData = {
        title: eventData.title,
        type: "event",
        svgContent: svgContent,
        eventData: {
          date: eventData.date,
          location: eventData.location,
          capacity: eventData.capacity,
          ticketPrice: eventData.ticketPrice,
          ticketFlavor: eventData.ticketFlavor,
          creatorUUID: user.uuid,
          category: eventData.category || "popup-event"
        },
        description: eventData.description || `An exclusive event at ${eventData.location}`
      };

      // Create the BDO
      const timestamp = new Date().getTime();
      const hash = '';
      const messageToSign = timestamp + user.pubKey + hash;
      const signature = await signMessage(user.privateKey, messageToSign, user.pubKey);

      const bdoPayload = {
        timestamp: timestamp.toString(),
        hash,
        pubKey: user.pubKey,
        signature,
        public: true,
        bdo: eventBDOData
      };

      const bdoResponse = await put(`${this.baseURL}/user/create`, bdoPayload);

      // Get emoji shortcode from response
      const emojiShortcode = bdoResponse.emojiShortcode || await this.getEmojicodeForPubKey(user.pubKey);

      console.log(`  ✅ Event BDO created successfully`);
      console.log(`  🎫 Event: ${eventData.title}`);
      console.log(`  🔑 PubKey: ${user.pubKey}`);
      console.log(`  🎨 Emoji Shortcode: ${emojiShortcode}`);
      console.log(`  💰 Ticket Price: ${priceDisplay}`);
      console.log(`  🎟️  Ticket Flavor: ${eventData.ticketFlavor}`);
      console.log(`  📊 Capacity: ${eventData.capacity} tickets`);

      // Create Aretha user and allocate tickets via MAGIC spell
      console.log(`  🎟️  Allocating ${eventData.capacity} tickets via Aretha...`);

      // Create Aretha user
      const arethaTimestamp = new Date().getTime();
      const arethaMessage = arethaTimestamp + user.pubKey;
      const arethaSignature = await signMessage(user.privateKey, arethaMessage, user.pubKey);

      const arethaUserResponse = await put(`${SERVICES.aretha}/user/create`, {
        timestamp: arethaTimestamp.toString(),
        pubKey: user.pubKey,
        signature: arethaSignature
      });

      // Extract UUID from response
      const arethaUUID = arethaUserResponse.uuid;
      console.log(`  ✅ Aretha user created: ${arethaUUID}`);

      // Allocate tickets via Aretha using the ticket flavor
      const ticketsTimestamp = new Date().getTime();
      const ticketsMessage = ticketsTimestamp + arethaUUID + eventData.ticketFlavor + eventData.capacity;
      const ticketsSignature = await signMessage(user.privateKey, ticketsMessage, user.pubKey);

      const ticketsPayload = {
        timestamp: ticketsTimestamp.toString(),
        pubKey: user.pubKey,
        uuid: arethaUUID,
        flavor: eventData.ticketFlavor,
        quantity: eventData.capacity,
        signature: ticketsSignature
      };

      const ticketsResponse = await put(`${SERVICES.aretha}/user/${arethaUUID}/tickets/${eventData.ticketFlavor}`, ticketsPayload);
      console.log(`  ✅ ${eventData.capacity} tickets allocated with flavor: ${eventData.ticketFlavor}`);

      emojicodedReferences.push({
        type: 'Event',
        title: eventData.title,
        date: eventData.date,
        location: eventData.location,
        ticketPrice: priceDisplay,
        capacity: eventData.capacity,
        ticketFlavor: eventData.ticketFlavor,
        pubKey: user.pubKey,
        emojiShortcode,
        uuid: bdoResponse.uuid || user.uuid,
        arethaUUID,
        ticketsAllocated: eventData.capacity
      });

      return {
        uuid: bdoResponse.uuid || user.uuid,
        pubKey: user.pubKey,
        emojiShortcode,
        arethaUUID,
        ticketsAllocated: eventData.capacity
      };
    } catch (error) {
      console.error(`❌ Event BDO seeding failed:`, error.message);
      return null;
    }
  }

  async seedPopupLocationViewBDO(popupData, popupBDOPubKey) {
    console.log(`📍 Seeding location view BDO for: ${popupData.name}...`);

    try {
      const user = await this.createUser(`location-view-bdo-${popupData.id}`);
      if (!user) {
        throw new Error('Failed to create location view BDO user');
      }

      // Generate SVG using the one-button template for going back
      const svgContent = generateLocationViewSVG(popupData, popupBDOPubKey);

      const locationBDOData = {
        title: `Location: ${popupData.name}`,
        type: "popup-location",
        popupId: popupData.id,
        svgContent: svgContent,
        locationData: {
          name: popupData.name,
          address: popupData.location,
          coordinates: popupData.coordinates
        },
        description: `Location details for ${popupData.name}`
      };

      // Create the BDO
      const timestamp = new Date().getTime();
      const hash = '';
      const messageToSign = timestamp + user.pubKey + hash;
      const signature = await signMessage(user.privateKey, messageToSign, user.pubKey);

      const bdoPayload = {
        timestamp: timestamp.toString(),
        hash,
        pubKey: user.pubKey,
        signature,
        public: true,
        bdo: locationBDOData
      };

      const bdoResponse = await put(`${this.baseURL}/user/create`, bdoPayload);
      const emojiShortcode = bdoResponse.emojiShortcode || await this.getEmojicodeForPubKey(user.pubKey);

      console.log(`  ✅ Location view BDO created successfully`);
      console.log(`  🔑 PubKey: ${user.pubKey}`);
      console.log(`  🎨 Emoji Shortcode: ${emojiShortcode}`);

      return {
        uuid: bdoResponse.uuid || user.uuid,
        pubKey: user.pubKey,
        emojiShortcode
      };
    } catch (error) {
      console.error(`❌ Location view BDO seeding failed:`, error.message);
      return null;
    }
  }

  async seedPopupBDO(popupData) {
    console.log(`🎪 Seeding popup post BDO for: ${popupData.name}...`);

    try {
      // First create the popup BDO user
      const user = await this.createUser(`popup-bdo-${popupData.id}`);
      if (!user) {
        throw new Error('Failed to create popup BDO user');
      }

      // Create location view BDO (needs popup pubkey for back navigation)
      const locationView = await this.seedPopupLocationViewBDO(popupData, user.pubKey);
      if (!locationView) {
        throw new Error('Failed to create location view BDO');
      }

      // Now generate the two-button SVG with magicard to location view
      const svgContent = generatePopupTwoButtonSVG(popupData, locationView.pubKey, user.pubKey);

      const popupBDOData = {
        title: popupData.name,
        type: "popup-post",
        popupId: popupData.id,
        svgContent: svgContent,
        popupData: {
          name: popupData.name,
          description: popupData.description,
          location: popupData.location,
          dateTimes: popupData.dateTimes,
          coordinates: popupData.coordinates,
          category: popupData.category,
          tags: popupData.tags
        },
        locationViewPubKey: locationView.pubKey,
        description: popupData.description
      };

      // Create the BDO
      const timestamp = new Date().getTime();
      const hash = '';
      const messageToSign = timestamp + user.pubKey + hash;
      const signature = await signMessage(user.privateKey, messageToSign, user.pubKey);

      const bdoPayload = {
        timestamp: timestamp.toString(),
        hash,
        pubKey: user.pubKey,
        signature,
        public: true,
        bdo: popupBDOData
      };

      const bdoResponse = await put(`${this.baseURL}/user/create`, bdoPayload);
      const emojiShortcode = bdoResponse.emojiShortcode || await this.getEmojicodeForPubKey(user.pubKey);

      console.log(`  ✅ Popup post BDO created successfully`);
      console.log(`  🔑 PubKey: ${user.pubKey}`);
      console.log(`  🎨 Emoji Shortcode: ${emojiShortcode}`);
      console.log(`  📍 Location View PubKey: ${locationView.pubKey}`);
      console.log(`  📅 Date: ${new Date(popupData.dateTimes[0].startDateTime).toLocaleDateString()}`);

      emojicodedReferences.push({
        type: 'Popup Post',
        title: popupData.name,
        location: popupData.location,
        date: new Date(popupData.dateTimes[0].startDateTime).toLocaleDateString(),
        category: popupData.category,
        pubKey: user.pubKey,
        emojiShortcode,
        locationViewPubKey: locationView.pubKey,
        locationEmojiShortcode: locationView.emojiShortcode,
        uuid: bdoResponse.uuid || user.uuid
      });

      return {
        uuid: bdoResponse.uuid || user.uuid,
        pubKey: user.pubKey,
        emojiShortcode,
        locationView
      };
    } catch (error) {
      console.error(`❌ Popup post BDO seeding failed:`, error.message);
      return null;
    }
  }

  async seedLiteraryBDO(literaryData) {
    console.log(`📚 Seeding literary BDO for: ${literaryData.title}...`);

    try {
      const user = await this.createUser(`literary-bdo-${literaryData.id}`);
      if (!user) {
        throw new Error('Failed to create literary BDO user');
      }

      // Determine which SVG template to use based on price and type
      const isPaidBook = literaryData.type === 'book' && literaryData.price > 0;
      const svgContent = isPaidBook
        ? generateBookTwoButtonSVG(literaryData, user.pubKey)
        : generateLiteraryOneButtonSVG(literaryData, user.pubKey);

      const literaryBDOData = {
        title: literaryData.title,
        type: literaryData.type, // 'book' or 'article'
        contentType: literaryData.type,
        svgContent: svgContent,
        literaryData: {
          title: literaryData.title,
          author: literaryData.author,
          description: literaryData.description,
          type: literaryData.type,
          category: literaryData.category,
          tags: literaryData.tags
        },
        metadata: literaryData.metadata,
        description: literaryData.description
      };

      // Add book-specific fields
      if (literaryData.type === 'book') {
        literaryBDOData.literaryData.price = literaryData.price;
        literaryBDOData.literaryData.isbn = literaryData.isbn;
        literaryBDOData.literaryData.publisher = literaryData.publisher;
        literaryBDOData.literaryData.publishDate = literaryData.publishDate;
        literaryBDOData.literaryData.pages = literaryData.pages;
        literaryBDOData.literaryData.purchaseUrl = literaryData.purchaseUrl;
      }

      // Add article-specific fields
      if (literaryData.type === 'article') {
        literaryBDOData.literaryData.externalUrl = literaryData.externalUrl;
        literaryBDOData.literaryData.publishDate = literaryData.publishDate;
      }

      // Create the BDO
      const timestamp = new Date().getTime();
      const hash = '';
      const messageToSign = timestamp + user.pubKey + hash;
      const signature = await signMessage(user.privateKey, messageToSign, user.pubKey);

      const bdoPayload = {
        timestamp: timestamp.toString(),
        hash,
        pubKey: user.pubKey,
        signature,
        public: true,
        bdo: literaryBDOData
      };

      const bdoResponse = await put(`${this.baseURL}/user/create`, bdoPayload);
      const emojiShortcode = bdoResponse.emojiShortcode || await this.getEmojicodeForPubKey(user.pubKey);

      const priceDisplay = literaryData.price > 0
        ? `$${(literaryData.price / 100).toFixed(2)}`
        : (literaryData.type === 'article' ? 'Free (Article)' : 'Free');

      console.log(`  ✅ Literary BDO created successfully`);
      console.log(`  📖 Type: ${literaryData.type}`);
      console.log(`  ✍️  Author: ${literaryData.author}`);
      console.log(`  🔑 PubKey: ${user.pubKey}`);
      console.log(`  🎨 Emoji Shortcode: ${emojiShortcode}`);
      console.log(`  💰 Price: ${priceDisplay}`);

      emojicodedReferences.push({
        type: literaryData.type === 'book' ? 'Book' : 'Article',
        title: literaryData.title,
        author: literaryData.author,
        price: priceDisplay,
        category: literaryData.category,
        pubKey: user.pubKey,
        emojiShortcode,
        uuid: bdoResponse.uuid || user.uuid
      });

      return {
        uuid: bdoResponse.uuid || user.uuid,
        pubKey: user.pubKey,
        emojiShortcode
      };
    } catch (error) {
      console.error(`❌ Literary BDO seeding failed:`, error.message);
      return null;
    }
  }

  async seedIdothisBDO(providerData) {
    console.log(`💼 Seeding IDothis.biz BDO for: ${providerData.providerName}...`);

    try {
      const user = await this.createUser(`idothis-bdo-${providerData.id}`);
      if (!user) {
        throw new Error('Failed to create IDothis BDO user');
      }

      // Generate SVG with "Book Now" button
      const svgContent = generateIdothisBookNowSVG(providerData, user.pubKey);

      const idothisBDOData = {
        title: providerData.providerName,
        type: "service-provider",
        contentType: "idothis-service",
        svgContent: svgContent,
        providerData: {
          providerName: providerData.providerName,
          contactName: providerData.contactName,
          description: providerData.description,
          serviceType: providerData.serviceType,
          hourlyRate: providerData.hourlyRate,
          services: providerData.services,
          availability: providerData.availability,
          serviceArea: providerData.serviceArea,
          yearsExperience: providerData.yearsExperience,
          phone: providerData.phone,
          email: providerData.email,
          category: providerData.category,
          tags: providerData.tags
        },
        metadata: providerData.metadata,
        description: providerData.description
      };

      // Add certification/licensing info
      if (providerData.licensed !== undefined) {
        idothisBDOData.providerData.licensed = providerData.licensed;
      }
      if (providerData.insured !== undefined) {
        idothisBDOData.providerData.insured = providerData.insured;
      }
      if (providerData.certified !== undefined) {
        idothisBDOData.providerData.certified = providerData.certified;
      }
      if (providerData.backgroundCheck !== undefined) {
        idothisBDOData.providerData.backgroundCheck = providerData.backgroundCheck;
      }

      // Create the BDO
      const timestamp = new Date().getTime();
      const hash = '';
      const messageToSign = timestamp + user.pubKey + hash;
      const signature = await signMessage(user.privateKey, messageToSign, user.pubKey);

      const bdoPayload = {
        timestamp: timestamp.toString(),
        hash,
        pubKey: user.pubKey,
        signature,
        public: true,
        bdo: idothisBDOData
      };

      const bdoResponse = await put(`${this.baseURL}/user/create`, bdoPayload);
      const emojiShortcode = bdoResponse.emojiShortcode || await this.getEmojicodeForPubKey(user.pubKey);

      const rateDisplay = `$${(providerData.hourlyRate / 100).toFixed(2)}/hr`;

      console.log(`  ✅ IDothis.biz BDO created successfully`);
      console.log(`  👔 Service: ${providerData.serviceType}`);
      console.log(`  👤 Provider: ${providerData.contactName}`);
      console.log(`  🔑 PubKey: ${user.pubKey}`);
      console.log(`  🎨 Emoji Shortcode: ${emojiShortcode}`);
      console.log(`  💰 Rate: ${rateDisplay}`);
      console.log(`  ⭐ Rating: ${providerData.metadata.rating} (${providerData.metadata.reviewCount} reviews)`);

      emojicodedReferences.push({
        type: 'Service Provider',
        title: providerData.providerName,
        serviceType: providerData.serviceType,
        provider: providerData.contactName,
        rate: rateDisplay,
        rating: `${providerData.metadata.rating} ⭐ (${providerData.metadata.reviewCount} reviews)`,
        category: providerData.category,
        pubKey: user.pubKey,
        emojiShortcode,
        uuid: bdoResponse.uuid || user.uuid
      });

      return {
        uuid: bdoResponse.uuid || user.uuid,
        pubKey: user.pubKey,
        emojiShortcode
      };
    } catch (error) {
      console.error(`❌ IDothis.biz BDO seeding failed:`, error.message);
      return null;
    }
  }

  async seedGameBDO(gameData) {
    console.log(`🎮 Seeding game BDO for: ${gameData.name}...`);

    try {
      const user = await this.createUser(`game-bdo-${gameData.id}`);
      if (!user) {
        throw new Error('Failed to create game BDO user');
      }

      // Determine which SVG generator to use
      const isFTPGame = gameData.type === 'ftp';
      const svgContent = isFTPGame
        ? generateFTPSVG(gameData, user.pubKey)
        : generateGameSVG(gameData, user.pubKey);

      const gameBDOData = {
        title: gameData.name,
        type: gameData.type, // 'board-game', 'video-game', or 'ftp'
        contentType: "game",
        svgContent: svgContent,
        gameData: {
          name: gameData.name,
          type: gameData.type,
          price: gameData.price,
          category: gameData.category,
          tags: gameData.tags
        },
        metadata: gameData.metadata || {},
        description: gameData.description
      };

      // Add type-specific fields
      if (gameData.type === 'board-game') {
        gameBDOData.gameData.designer = gameData.designer;
        gameBDOData.gameData.playerCount = gameData.playerCount;
        gameBDOData.gameData.playTime = gameData.playTime;
        gameBDOData.gameData.complexity = gameData.complexity;
      } else if (gameData.type === 'video-game') {
        gameBDOData.gameData.developer = gameData.developer;
        gameBDOData.gameData.platform = gameData.platform;
        gameBDOData.gameData.genre = gameData.genre;
        gameBDOData.gameData.releaseDate = gameData.releaseDate;
      } else if (gameData.type === 'ftp') {
        gameBDOData.gameData.team = gameData.team;
        gameBDOData.gameData.division = gameData.division;
        gameBDOData.gameData.city = gameData.city;
        gameBDOData.gameData.stadium = gameData.stadium;
      }

      // Create the BDO
      const timestamp = new Date().getTime();
      const hash = '';
      const messageToSign = timestamp + user.pubKey + hash;
      const signature = await signMessage(user.privateKey, messageToSign, user.pubKey);

      const bdoPayload = {
        timestamp: timestamp.toString(),
        hash,
        pubKey: user.pubKey,
        signature,
        public: true,
        bdo: gameBDOData
      };

      const bdoResponse = await put(`${this.baseURL}/user/create`, bdoPayload);
      const emojiShortcode = bdoResponse.emojiShortcode || await this.getEmojicodeForPubKey(user.pubKey);

      const priceDisplay = `$${(gameData.price / 100).toFixed(2)}`;
      const gameTypeLabel = gameData.type === 'board-game' ? 'Board Game' :
                           gameData.type === 'video-game' ? 'Video Game' : 'FTP';

      console.log(`  ✅ Game BDO created successfully`);
      console.log(`  🎮 Type: ${gameTypeLabel}`);
      if (gameData.designer) {
        console.log(`  ✏️  Designer: ${gameData.designer}`);
      } else if (gameData.developer) {
        console.log(`  💻 Developer: ${gameData.developer}`);
      } else if (gameData.team) {
        console.log(`  🏈 Team: ${gameData.team}`);
      }
      console.log(`  🔑 PubKey: ${user.pubKey}`);
      console.log(`  🎨 Emoji Shortcode: ${emojiShortcode}`);
      console.log(`  💰 Price: ${priceDisplay}`);

      emojicodedReferences.push({
        type: gameTypeLabel,
        title: gameData.name,
        gameType: gameData.type,
        designer: gameData.designer || gameData.developer || gameData.team,
        price: priceDisplay,
        category: gameData.category,
        pubKey: user.pubKey,
        emojiShortcode,
        uuid: bdoResponse.uuid || user.uuid
      });

      return {
        uuid: bdoResponse.uuid || user.uuid,
        pubKey: user.pubKey,
        emojiShortcode
      };
    } catch (error) {
      console.error(`❌ Game BDO seeding failed:`, error.message);
      return null;
    }
  }
}

class AdvancementSeeder {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.testData = [];
  }

  async seedTestData() {
    console.log('🚀 Seeding The Advancement test server...');

    try {
      // Health check The Advancement test server
      const healthResponse = await get(`${this.baseURL}/api/health`);
      console.log(`  ✅ The Advancement test server is healthy: ${healthResponse.service}`);

      // Get site owner info to verify API
      const siteOwnerResponse = await get(`${this.baseURL}/api/site-owner`);
      console.log(`  ✅ Site owner verified: ${siteOwnerResponse.data.name}`);

      // Get available bases
      const basesResponse = await get(`${this.baseURL}/api/bases`);
      const baseCount = Object.keys(basesResponse.data).length;
      console.log(`  ✅ Available bases: ${baseCount} bases configured`);

      // Test teleportation from base1
      const teleportResponse = await get(`${this.baseURL}/api/teleport/base1?pubKey=test_pubkey`);
      const productCount = teleportResponse.data.products.length;
      const menuCount = teleportResponse.data.menuCatalogs.length;
      console.log(`  ✅ Teleportation working: ${productCount} products, ${menuCount} menu catalogs`);

      // Test nineum balance endpoint
      const balanceResponse = await get(`${this.baseURL}/api/nineum-balance`);
      console.log(`  ✅ Nineum balance: ${balanceResponse.data.nineumCount} nineum`);

      this.testData.push({
        service: 'advancement-test-server',
        health: healthResponse,
        siteOwner: siteOwnerResponse.data,
        bases: baseCount,
        products: productCount,
        menuCatalogs: menuCount,
        nineumBalance: balanceResponse.data.nineumCount
      });

      console.log(`📊 The Advancement seeding complete: All endpoints verified\n`);
    } catch (error) {
      console.error('❌ The Advancement seeding failed:', error.message);
    }

    return this.testData;
  }
}

// Health check function
const checkServiceHealth = async (serviceName, url) => {
  try {
    // Different services have different health endpoints or root endpoints
    let healthUrl = url;
    if (serviceName === 'Advancement') {
      healthUrl = `${url}/api/health`;
    } else {
      // For most Planet Nine services, just check root endpoint
      healthUrl = url;
    }

    const response = await fetch(healthUrl, { timeout: 5000 });

    // If we get any response (even 404), the service is running
    console.log(`  ✅ ${serviceName}: ${url}`);
    return true;
  } catch (error) {
    // Connection refused means service is not running or not enabled
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      console.log(`  ❌ ${serviceName}: ${url} - Service not available`);
      return false;
    } else if (error.message.includes('not responding')) {
      console.log(`  ❌ ${serviceName}: ${url} - Service not responding`);
      return false;
    } else {
      // Other errors (like timeouts, socket hangs) but service might still be running
      // Let's try to seed anyway since the service might be functional
      console.log(`  ⚠️  ${serviceName}: ${url} - Service detected (will attempt seeding)`);
      return true;
    }
  }
};

// Track emojicoded references for final output
const emojicodedReferences = [];

// Main seeding function
const seedEcosystem = async () => {
  console.log('🏥 Health checking services...');

  const healthChecks = await Promise.all([
    checkServiceHealth('Prof', SERVICES.prof),
    checkServiceHealth('Sanora', SERVICES.sanora),
    checkServiceHealth('Dolores', SERVICES.dolores),
    checkServiceHealth('BDO', SERVICES.bdo),
    checkServiceHealth('Advancement', SERVICES.advancement)
  ]);

  const isServiceHealthy = {
    prof: healthChecks[0],
    sanora: healthChecks[1],
    dolores: healthChecks[2],
    bdo: healthChecks[3],
    advancement: healthChecks[4]
  };

  const healthyServices = healthChecks.filter(Boolean).length;
  console.log(`\n📊 ${healthyServices}/${healthChecks.length} services healthy\n`);

  if (healthyServices === 0) {
    console.log('❌ No services available. Please start the services first.');
    process.exit(1);
  }

  console.log('🌱 Starting ecosystem seeding...\n');

  try {
    // Seed all services in parallel (only healthy services)
    const seeders = [];

    if (isServiceHealthy.prof) {
      seeders.push(new ProfSeeder(SERVICES.prof).seedProfiles());
    } else {
      console.log('⚠️  Prof service not healthy, skipping profile seeding');
    }

    if (isServiceHealthy.sanora) {
      seeders.push(new SanoraSeeder(SERVICES.sanora).seedProducts());
      seeders.push(new SanoraSeeder(SERVICES.sanora).seedBlogPosts());
      seeders.push(new SanoraSeeder(SERVICES.sanora).seedRooms());
    } else {
      console.log('⚠️  Sanora service not healthy, skipping product/blog/room seeding');
    }

    if (isServiceHealthy.dolores) {
      seeders.push(new DoloresSeeder(SERVICES.dolores).seedPosts());
    } else {
      console.log('⚠️  Dolores service not healthy, skipping post seeding');
    }

    if (isServiceHealthy.bdo) {
      const bdoSeeder = new BDOSeeder(SERVICES.bdo);
      seeders.push(bdoSeeder.seedBaseDiscovery());
      seeders.push(bdoSeeder.seedRecipeBDO());
      seeders.push(bdoSeeder.seedProductBDO('peace-love-redistribution-tshirt', 'Peace Love and Redistribution T-Shirt', 2900));

      // Seed music BDOs from example tracks
      for (const track of exampleMusicTracks) {
        seeders.push(bdoSeeder.seedMusicBDO(track));
      }

      // Seed Canimus feed BDO (Sockpuppet mix tape)
      seeders.push(bdoSeeder.seedCanimusFeedBDO(sockpuppetCanimusFeed));

      // Seed room BDOs from example rooms
      for (const room of exampleRooms) {
        seeders.push(bdoSeeder.seedRoomBDO(room));
      }

      // Seed event BDOs from example events
      for (const exampleEvent of exampleEvents) {
        // Transform example event structure to match seedEventBDO expectations
        // Use first ticket for primary nineum creation (all tickets visible in SVG)
        const firstTicket = exampleEvent.tickets[0];
        const transformedEvent = {
          title: exampleEvent.title,
          date: new Date(exampleEvent.eventDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          }),
          location: exampleEvent.location,
          capacity: exampleEvent.metadata.capacity || firstTicket.availableCount,
          ticketPrice: firstTicket.price,
          ticketFlavor: firstTicket.flavor,
          priceType: firstTicket.priceType || exampleEvent.priceType || 'cash', // MP or cash
          category: exampleEvent.category,
          description: exampleEvent.description,
          emojiShortcode: exampleEvent.emojiShortcode,
          // Pass all tickets for future multi-ticket support
          allTickets: exampleEvent.tickets
        };
        seeders.push(bdoSeeder.seedEventBDO(transformedEvent));
      }

      // Create contract signing UI with test participant pubKeys
      const testParticipants = [
        '02a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
        '03b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3'
      ];
      seeders.push(bdoSeeder.seedContractSigningBDO(
        'website-dev-001',
        'Website Development Agreement',
        testParticipants
      ));

      // Seed popup post BDOs with two-button SaVaGe templates
      for (const popup of popupPosts) {
        seeders.push(bdoSeeder.seedPopupBDO(popup));
      }

      // Seed literary BDOs (books and articles)
      for (const literary of literaryPosts) {
        seeders.push(bdoSeeder.seedLiteraryBDO(literary));
      }

      // Seed IDothis.biz BDOs (service providers)
      for (const provider of idothisPosts) {
        seeders.push(bdoSeeder.seedIdothisBDO(provider));
      }

      // Seed game BDOs (board games, video games, FTP)
      for (const game of gamesPosts) {
        seeders.push(bdoSeeder.seedGameBDO(game));
      }
    } else {
      console.log('⚠️  BDO service not healthy, skipping BDO seeding');
    }

    if (isServiceHealthy.advancement) {
      seeders.push(new AdvancementSeeder(SERVICES.advancement).seedTestData());
    } else {
      console.log('⚠️  The Advancement service not healthy, skipping test data seeding');
    }

    const results = await Promise.allSettled(seeders);
    
    let successCount = 0;

    // Build service names array based on what was actually seeded
    const serviceNames = [];
    if (isServiceHealthy.prof) serviceNames.push('Prof');
    if (isServiceHealthy.sanora) {
      serviceNames.push('Sanora Products');
      serviceNames.push('Sanora Blogs');
      serviceNames.push('Sanora Rooms');
    }
    if (isServiceHealthy.dolores) serviceNames.push('Dolores');
    if (isServiceHealthy.bdo) serviceNames.push('BDO');
    if (isServiceHealthy.advancement) serviceNames.push('The Advancement');

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
        console.log(`✅ ${serviceNames[index]} seeding completed`);
      } else {
        console.log(`❌ ${serviceNames[index]} seeding failed:`, result.reason?.message || 'Unknown error');
      }
    });

    console.log(`\n🎉 Ecosystem seeding complete!`);
    console.log(`📊 ${successCount}/${results.length} services seeded successfully`);

    // Print emojicoded references summary
    if (emojicodedReferences.length > 0) {
      console.log(`\n✨ EMOJICODED BDO REFERENCES ✨`);
      console.log(`${'='.repeat(80)}\n`);

      for (const ref of emojicodedReferences) {
        console.log(`📦 ${ref.type}: ${ref.title}`);
        if (ref.productId) {
          console.log(`   Product ID: ${ref.productId}`);
          console.log(`   Price: ${ref.price}`);
        }
        if (ref.contractId) {
          console.log(`   Contract ID: ${ref.contractId}`);
          console.log(`   Participants: ${ref.participants} authorized signers`);
        }
        if (ref.artist) {
          console.log(`   Artist: ${ref.artist}`);
          console.log(`   Platform: ${ref.platform}`);
        }
        if (ref.beds !== undefined) {
          console.log(`   Specs: ${ref.beds} bed, ${ref.baths} bath • ${ref.size} sq ft`);
          console.log(`   Rent: ${ref.rent}`);
          console.log(`   Location: ${ref.neighborhood}`);
        }
        if (ref.date !== undefined && ref.ticketPrice !== undefined) {
          console.log(`   Date: ${ref.date}`);
          console.log(`   Location: ${ref.location}`);
          console.log(`   Ticket Price: ${ref.ticketPrice}`);
          console.log(`   Capacity: ${ref.capacity} tickets`);
          console.log(`   Ticket Flavor: ${ref.ticketFlavor}`);
        }
        if (ref.locationViewPubKey) {
          console.log(`   Date: ${ref.date}`);
          console.log(`   Location: ${ref.location}`);
          console.log(`   Category: ${ref.category}`);
          console.log(`   📍 Location View PubKey: ${ref.locationViewPubKey}`);
          console.log(`   🎨 Location Emoji: ${ref.locationEmojiShortcode}`);
        }
        console.log(`   UUID: ${ref.uuid}`);
        console.log(`   PubKey: ${ref.pubKey}`);
        console.log(`   \n   🎨 Emoji Shortcode:\n   ${ref.emojiShortcode}\n`);
        if (ref.htmlUpdated !== undefined) {
          console.log(`   ${ref.htmlUpdated ? '✅' : '⚠️'} HTML updated: ${ref.htmlUpdated ? 'Yes' : 'No'}\n`);
        }
        console.log(`${'-'.repeat(80)}\n`);
      }
    }

    if (ENVIRONMENT === 'test') {
      console.log(`🔗 Test Base ${BASE_NUMBER} URLs:`);
      console.log(`   BDO: ${SERVICES.bdo}`);
      console.log(`   Sanora: ${SERVICES.sanora}`);
      console.log(`   The Advancement: ${SERVICES.advancement}`);
    } else if (ENVIRONMENT === 'local') {
      console.log(`\n🔗 Local Environment URLs:`);
      console.log(`   BDO: ${SERVICES.bdo}`);
      console.log(`   Sanora: ${SERVICES.sanora}`);
      console.log(`   The Advancement: ${SERVICES.advancement}`);
    }

    // Save emojicoded references to file for carrierBag test
    if (emojicodedReferences.length > 0) {
      const outputPath = path.join(process.cwd(), 'seed-output.json');
      const outputData = {
        environment: ENVIRONMENT,
        baseNumber: BASE_NUMBER,
        seedDate: new Date().toISOString(),
        emojicodedReferences: emojicodedReferences,
        services: SERVICES
      };
      fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
      console.log(`\n📁 Seed output saved to: ${outputPath}`);
      console.log(`   Run carrierBag test: node test-carrier-bag.js ${ENVIRONMENT} ${BASE_NUMBER}\n`);
    }

  } catch (error) {
    console.error('💥 Fatal error during seeding:', error);
    process.exit(1);
  }
};

// Run the seeder
seedEcosystem().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
