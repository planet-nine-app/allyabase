#!/usr/bin/env node

/**
 * Sanora Product Seeder
 *
 * Seeds Sanora service with sample products using client SDKs:
 * - Ebook
 * - Course
 * - Membership
 * - Tickets
 *
 * Each product creates both a Sanora product AND a shareable BDO
 * using sanora-js and bdo-js client SDKs.
 *
 * Usage: node seed-sanora.js [environment] [base_number]
 * Environment: 'local' or 'test' (default: test)
 * Base number: 1, 2, or 3 for test environment (default: 1)
 */

import sessionless from 'sessionless-node';
import bdoLib from 'bdo-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import Sanora from 'sanora-js';

// Configuration
const ENVIRONMENT = process.argv[2] || 'test';
const BASE_NUMBER = process.argv[3] || '1';

console.log(`🌱 Sanora Product Seeder`);
console.log(`📍 Environment: ${ENVIRONMENT}`);
console.log(`🏠 Base: ${BASE_NUMBER}`);
console.log('==========================================\n');

// Environment-specific service URLs
const getServiceURLs = (env, baseNum) => {
  if (env === 'local') {
    return {
      sanora: 'http://localhost:7243',
      bdo: 'http://localhost:3003',
      addie: 'http://localhost:3005',
      fount: 'http://localhost:3006'
    };
  } else if (env === 'test') {
    const portBase = 5000 + (parseInt(baseNum) * 100);
    return {
      sanora: `http://localhost:${portBase + 21}`,
      bdo: `http://localhost:${portBase + 14}`,
      addie: `http://localhost:${portBase + 15}`,
      fount: `http://localhost:${portBase + 17}`
    };
  } else {
    // For any other environment, use it as a subdomain prefix
    return {
      sanora: `https://${env}.sanora.allyabase.com`,
      bdo: `https://${env}.bdo.allyabase.com`,
      addie: `https://${env}.addie.allyabase.com`,
      fount: `https://${env}.fount.allyabase.com`
    };
  }
};

const SERVICES = getServiceURLs(ENVIRONMENT, BASE_NUMBER);

// Configure BDO SDK
bdoLib.baseURL = SERVICES.bdo.endsWith('/') ? SERVICES.bdo : `${SERVICES.bdo}/`;

// Track current user keys for sessionless signing
let currentUserKeys = null;

// In-memory key storage for seed script
const saveKeys = (keys) => {
  currentUserKeys = keys;
};

const getKeys = () => {
  return currentUserKeys;
};

// Initialize sessionless
sessionless.generateKeys(saveKeys, getKeys);

// Nineum flavor mapping for product categories
// Flavor format: 12 hex characters
// Bytes 0-1: Charge, 2-3: Direction, 4-5: Rarity, 6-7: Size, 8-9: Texture, 10-11: Shape
const PRODUCT_NINEUM_FLAVORS = {
  'ebook': '010103020101', // Positive, North, Rare, Small, Satin, Sphere (knowledge)
  'course': '010104030202', // Positive, North, Epic, Medium, Velvet, Cube (structured learning)
  'membership': '010205040303', // Positive, South, Legendary, Large, Silk, Pyramid (community)
  'ticket': '020103020404'  // Negative, North, Rare, Small, Wool, Cylinder (time-limited event)
};

// Sample products data
const PRODUCTS = [
  {
    title: "Planet Nine Development Guide",
    description: "Complete guide to building on the Planet Nine ecosystem. Learn about sessionless authentication, MAGIC protocol, and decentralized architecture. Includes code examples, best practices, and real-world implementations.",
    price: 2999, // $29.99
    category: "ebook",
    contentType: "ebook",
    tags: ["development", "programming", "planet-nine", "guide"],
    metadata: {
      author: "Planet Nine Team",
      pages: 350,
      language: "English",
      isbn: "978-1-234567-89-0"
    },
    nineumFlavor: PRODUCT_NINEUM_FLAVORS['ebook']
  },
  {
    title: "MAGIC Protocol Masterclass",
    description: "Master the MAGIC spell system with this comprehensive course. Learn spell casting, gateway management, experience granting, and building spell-powered applications. Includes 8 weeks of lessons, video tutorials, and hands-on projects.",
    price: 9999, // $99.99
    category: "course",
    contentType: "course",
    tags: ["course", "magic-protocol", "spells", "advanced"],
    metadata: {
      instructor: "Planet Nine Academy",
      duration: "8 weeks",
      certificate: true,
      modules: 24
    },
    nineumFlavor: PRODUCT_NINEUM_FLAVORS['course']
  },
  {
    title: "Planet Nine Pro Membership",
    description: "Annual membership with access to all Planet Nine services, exclusive features, priority support, and early access to new releases. Join the community of builders and creators on Planet Nine.",
    price: 19999, // $199.99 annual
    category: "membership",
    contentType: "membership",
    tags: ["membership", "subscription", "pro", "annual"],
    metadata: {
      organization: "Planet Nine",
      billingCycle: "annual",
      perks: [
        "Access to all services",
        "Priority support",
        "Early access to features",
        "Community access"
      ]
    },
    nineumFlavor: PRODUCT_NINEUM_FLAVORS['membership']
  },
  {
    title: "Allyabase Conference 2025",
    description: "Join us for the annual Planet Nine Allyabase Conference! Two days of talks, workshops, and networking with the Planet Nine community. Learn about the latest developments, meet the team, and connect with fellow builders.",
    price: 29999, // $299.99
    category: "ticket",
    contentType: "event",
    tags: ["event", "conference", "ticket", "2025"],
    metadata: {
      organizer: "Planet Nine Events",
      venue: "San Francisco Convention Center",
      eventDate: "2025-10-15T09:00:00Z",
      maxAttendees: 500
    },
    nineumFlavor: PRODUCT_NINEUM_FLAVORS['ticket']
  }
];

/**
 * Generate SVG content for a product BDO
 */
const generateProductSVG = ({ title, price, productId, category, emojicode }) => {
  const priceFormatted = `$${(price / 100).toFixed(2)}`;
  const categoryEmojis = {
    'ebook': '📚',
    'course': '🎓',
    'membership': '👥',
    'ticket': '🎟️',
    'event': '🎟️',
    'physical': '📦',
    'digital': '💻'
  };
  const categoryEmoji = categoryEmojis[category] || '🎁';

  // Include emojicode if provided
  const emojicodeLine = emojicode
    ? `<text x="400" y="350" class="emojicode" text-anchor="middle" font-size="14">${emojicode}</text>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="buttonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#45a049;stop-opacity:1" />
    </linearGradient>
    <style>
      .product-card { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .title { font-size: 32px; font-weight: 700; fill: white; }
      .price { font-size: 48px; font-weight: 700; fill: #4CAF50; }
      .category { font-size: 18px; fill: white; opacity: 0.9; }
      .emoji { font-size: 80px; }
      .emojicode { fill: white; opacity: 0.8; }
      .purchase-button { cursor: pointer; }
      .purchase-button:hover rect { fill: url(#buttonGradient); opacity: 0.9; }
      .button-text { font-size: 24px; font-weight: 600; fill: white; pointer-events: none; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="800" height="500" fill="url(#bgGradient)"/>

  <!-- Category Emoji -->
  <text x="400" y="100" class="emoji" text-anchor="middle">${categoryEmoji}</text>

  <!-- Product Title -->
  <text x="400" y="160" class="title" text-anchor="middle">${title.substring(0, 40)}</text>

  <!-- Category -->
  <text x="400" y="190" class="category" text-anchor="middle">${category}</text>

  <!-- Price -->
  <text x="400" y="260" class="price" text-anchor="middle">${priceFormatted}</text>

  <!-- Product ID -->
  <text x="400" y="300" class="category" text-anchor="middle" font-size="14">ID: ${productId}</text>

  <!-- Emojicode -->
  ${emojicodeLine}

  <!-- Purchase Button -->
  <g class="purchase-button" onclick="window.purchaseProduct && window.purchaseProduct('${productId}', '${emojicode || ''}')">
    <rect x="250" y="360" width="300" height="60" rx="30" fill="url(#buttonGradient)" />
    <text x="330" y="397" class="button-text">💳 Purchase</text>
  </g>

  <!-- Footer -->
  <text x="400" y="475" class="category" text-anchor="middle" font-size="16">🌌 Powered by Planet Nine</text>
</svg>`;
};

/**
 * Create a product with its companion BDO using client SDKs
 */
const createProductWithBDO = async (sanora, userUuid, productData) => {
  try {
    const productId = `${productData.category}_${Date.now()}`;

    console.log(`  📦 Creating product: ${productData.title}`);
    console.log(`     📦 Product ID: ${productId}`);

    // 1. Generate initial SVG for BDO (without emojicode yet)
    const initialSvg = generateProductSVG({
      title: productData.title,
      price: productData.price,
      productId: productId,
      category: productData.category
    });

    // 4. Create signed payee for product creator (100% revenue)
    const creatorPubKey = currentUserKeys.pubKey;
    const creatorAddieURL = SERVICES.addie; // Creator's Addie base
    const creatorPercent = 100;
    const payeeMessage = creatorPubKey + creatorAddieURL + creatorPercent;
    const payeeSignature = await sessionless.sign(payeeMessage, currentUserKeys.privateKey);

    const creatorPayee = {
      pubKey: creatorPubKey,
      addieURL: creatorAddieURL,
      percent: creatorPercent,
      signature: payeeSignature
    };

    // 5. Create BDO with product information and signed payee
    const bdoData = {
      title: `${productData.title} - Product BDO`,
      type: 'product',
      productId: productId,
      price: productData.price,
      svgContent: initialSvg,
      category: productData.category,
      contentType: productData.contentType,
      payees: [creatorPayee], // Creator gets 100%, affiliates will modify this
      metadata: {
        ...productData.metadata,
        sanoraUUID: userUuid,
        productTitle: productData.title,
        priceFormatted: `$${(productData.price / 100).toFixed(2)}`,
        createdViaSDK: true
      },
      description: productData.description || `Product listing for ${productData.title}`
    };

    // 6. Create separate keys for the companion BDO
    // Save the original keys first
    const originalKeys = currentUserKeys;

    // Create new keys for the companion BDO
    const bdoKeys = await sessionless.generateKeys(
      (keys) => { currentUserKeys = keys; }, // Temporarily save BDO keys
      () => currentUserKeys     // Use current keys
    );

    const hash = '';
    const bdoUUID = await bdoLib.createUser(hash, bdoData,
      (keys) => { currentUserKeys = keys; },
      () => currentUserKeys
    );

    // Now update the BDO to make it public (this generates the emojicode)
    const updatedBDO = await bdoLib.updateBDO(bdoUUID, hash, bdoData, true);

    // Restore original user keys and re-initialize sessionless with them
    currentUserKeys = originalKeys;
    sessionless.getKeys = getKeys;

    console.log(`  ✅ BDO created and made public`);
    console.log(`     🔑 BDO PubKey: ${bdoKeys.pubKey.substring(0, 16)}...`);
    if (updatedBDO && updatedBDO.emojiShortcode) {
      console.log(`     🎨 Emojicode: ${updatedBDO.emojiShortcode}`);
    }

    // Regenerate SVG with emojicode
    let finalSvg = initialSvg;
    if (updatedBDO && updatedBDO.emojiShortcode) {
      finalSvg = generateProductSVG({
        title: productData.title,
        price: productData.price,
        productId: productId,
        category: productData.category,
        emojicode: updatedBDO.emojiShortcode
      });
      console.log(`  ✅ Generated final SVG with emojicode`);
    }

    // Now create the product once with all data including emojicode
    const product = await sanora.addProduct(userUuid, {
      title: productData.title,
      description: productData.description,
      price: productData.price,
      tags: productData.tags || [],
      category: productData.category,
      contentType: productData.contentType,
      productId: productId,
      nineumFlavor: productData.nineumFlavor, // Nineum flavor for this product type
      metadata: {
        ...(productData.metadata || {}),
        svgContent: finalSvg,
        bdoPubKey: bdoKeys.pubKey,
        bdoUUID: bdoUUID,
        emojicode: updatedBDO?.emojiShortcode,
        nineumFlavor: productData.nineumFlavor // Also store in metadata for easy access
      }
    });

    console.log(`  ✅ Product created: ${productData.title}`);

    return {
      success: true,
      product: {
        uuid: userUuid,
        title: product.title,
        productId: productId,
        price: product.price
      },
      bdo: {
        uuid: bdoUUID,
        pubKey: bdoKeys.pubKey,
        emojiShortcode: updatedBDO?.emojiShortcode
      }
    };

  } catch (error) {
    console.error(`  ❌ Failed to create product:`, error.message);
    console.error(`     Stack: ${error.stack}`);
    return { success: false, error: error.message };
  }
};

// Main seeding function
const seedSanoraProducts = async () => {
  console.log('🛍️ Starting Sanora product seeding...\n');

  try {
    // 1. Initialize Sanora SDK
    console.log('🔧 Initializing Sanora SDK...');
    const sanora = new Sanora(SERVICES.sanora, sessionless);
    console.log(`✅ Sanora SDK initialized: ${SERVICES.sanora}\n`);

    // 2. Create Sanora user
    console.log('👤 Creating Sanora user...');
    const user = await sanora.createUser();
    console.log(`✅ Sanora user created: ${user.uuid}\n`);

    // 3. Create products using client SDKs
    console.log('📦 Creating products with client SDKs...\n');

    const createdProducts = [];

    for (const productData of PRODUCTS) {
      const result = await createProductWithBDO(sanora, user.uuid, productData);

      if (result && result.success) {
        const product = {
          ...productData,
          productId: result.product?.productId,
          bdoPubKey: result.bdo?.pubKey,
          bdoUUID: result.bdo?.uuid,
          emojicode: result.bdo?.emojiShortcode
        };
        createdProducts.push(product);
        console.log(`  💾 Saved: ${product.title}${product.emojicode ? ' | ' + product.emojicode : ''}\n`);
      } else {
        console.error(`  ⚠️ Skipping ${productData.title} - creation failed\n`);
      }

      // Small delay between products
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n📊 Sanora seeding complete!`);
    console.log(`✅ ${createdProducts.length}/${PRODUCTS.length} products created\n`);

    // 3. Print summary
    if (createdProducts.length > 0) {
      console.log('✨ CREATED PRODUCTS SUMMARY ✨');
      console.log('='.repeat(80));

      createdProducts.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.title}`);
        console.log(`   Category: ${product.category}`);
        console.log(`   Price: $${(product.price / 100).toFixed(2)}`);
        if (product.emojicode) {
          console.log(`   🎨 Emojicode: ${product.emojicode}`);
        }
        if (product.productId) {
          console.log(`   📦 ID: ${product.productId}`);
        }
        if (product.bdoPubKey) {
          console.log(`   🔑 BDO PubKey: ${product.bdoPubKey.substring(0, 16)}...`);
        }
        if (product.bdoUUID) {
          console.log(`   🆔 BDO UUID: ${product.bdoUUID}`);
        }
      });

      console.log(`\n${'='.repeat(80)}`);
      console.log('\n💡 TIP: Products are now available with shareable BDOs!\n');
      console.log('💡 Visit the products page to view and share them.\n');
    }

  } catch (error) {
    console.error('💥 Fatal error during seeding:', error);
    process.exit(1);
  }
};

// Run the seeder
seedSanoraProducts().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
