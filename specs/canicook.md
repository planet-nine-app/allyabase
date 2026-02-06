# Canicook Specification

**Version**: 1.0.0
**Status**: Draft
**Last Updated**: 2026-02-05

## Overview

**Canicook** is a JSON-based feed specification for sharing recipes across the federated web. It enables distributed recipe publishing, discovery, and sharing while supporting multiple access models and preserving chef/author ownership.

Part of **The Advancement** - rebuilding platforms for communities.

## Design Principles

1. **JSON-based** - Modern, parseable, extensible (not XML/RSS)
2. **Rich metadata** - Ingredients, nutrition, timing, dietary info
3. **Multi-format** - Support text, Markdown, structured data
4. **Flexible access** - Free, premium, subscription-based recipes
5. **Federation-ready** - Cross-site recipe sharing and discovery
6. **Privacy-first** - No tracking, community-owned
7. **Chef ownership** - Creators own their content and audience

## Core Feed Structure

### Feed Object

```json
{
  "version": "1.0",
  "title": "Chef's Recipe Collection",
  "home-page-url": "https://example.wiki/recipes",
  "feed-url": "https://example.wiki/feeds/recipes/user-uuid",
  "description": "A collection of recipes from Chef Name",
  "author": {
    "name": "Chef Name",
    "url": "https://example.wiki/chef",
    "avatar": "https://example.wiki/chef/avatar.jpg"
  },
  "items": [
    // Array of Recipe objects
  ]
}
```

### Recipe Object

```json
{
  "type": "recipe",
  "uid": "recipe_1234567890_abc123",
  "name": "Classic Tomato Basil Pasta",
  "url": "https://example.wiki/recipes/classic-tomato-basil-pasta",
  "summary": "A simple, delicious pasta dish with fresh tomatoes and basil",
  "description": "This recipe brings together the classic flavors of Italy...",

  "authors": [
    {
      "name": "Chef Maria",
      "role": "chef",
      "url": "https://example.wiki/chef/maria"
    }
  ],

  "images": {
    "hero": {
      "url": "https://example.wiki/images/pasta-hero.jpg",
      "width": 1200,
      "height": 800,
      "alt": "Finished tomato basil pasta in white bowl"
    },
    "thumbnail": {
      "url": "https://example.wiki/images/pasta-thumb.jpg",
      "width": 400,
      "height": 300
    },
    "gallery": [
      {
        "url": "https://example.wiki/images/pasta-step1.jpg",
        "caption": "Fresh ingredients"
      }
    ]
  },

  "timing": {
    "prep-time": "PT15M",
    "cook-time": "PT20M",
    "total-time": "PT35M",
    "rest-time": "PT0M"
  },

  "yield": {
    "servings": 4,
    "unit": "servings",
    "description": "4 main course servings"
  },

  "difficulty": "easy",

  "cuisine": ["Italian", "Mediterranean"],
  "course": "main",
  "meal-type": ["lunch", "dinner"],

  "dietary-info": {
    "vegetarian": true,
    "vegan": false,
    "gluten-free": false,
    "dairy-free": false,
    "nut-free": true,
    "tags": ["vegetarian", "quick", "family-friendly"]
  },

  "ingredients": [
    {
      "item": "pasta",
      "quantity": 1,
      "unit": "pound",
      "notes": "spaghetti or linguine",
      "section": "main"
    },
    {
      "item": "tomatoes",
      "quantity": 2,
      "unit": "cups",
      "notes": "fresh, diced",
      "section": "main"
    },
    {
      "item": "basil",
      "quantity": 0.5,
      "unit": "cup",
      "notes": "fresh, chopped",
      "section": "main"
    },
    {
      "item": "garlic",
      "quantity": 4,
      "unit": "cloves",
      "notes": "minced",
      "section": "main"
    },
    {
      "item": "olive oil",
      "quantity": 3,
      "unit": "tablespoons",
      "section": "main"
    },
    {
      "item": "parmesan",
      "quantity": 0.5,
      "unit": "cup",
      "notes": "grated, optional",
      "section": "garnish"
    }
  ],

  "equipment": [
    "Large pot",
    "Colander",
    "Large skillet",
    "Wooden spoon"
  ],

  "instructions": [
    {
      "step": 1,
      "text": "Bring a large pot of salted water to boil",
      "timing": "PT5M"
    },
    {
      "step": 2,
      "text": "Cook pasta according to package directions until al dente",
      "timing": "PT10M"
    },
    {
      "step": 3,
      "text": "While pasta cooks, heat olive oil in a large skillet over medium heat",
      "timing": "PT2M"
    },
    {
      "step": 4,
      "text": "Add garlic and cook until fragrant, about 1 minute",
      "timing": "PT1M"
    },
    {
      "step": 5,
      "text": "Add tomatoes and cook until they start to break down, 5-7 minutes",
      "timing": "PT7M"
    },
    {
      "step": 6,
      "text": "Drain pasta, reserving 1 cup pasta water",
      "timing": "PT1M"
    },
    {
      "step": 7,
      "text": "Add pasta to skillet with tomatoes, toss to combine",
      "timing": "PT2M"
    },
    {
      "step": 8,
      "text": "Add pasta water if needed to create a light sauce",
      "timing": "PT1M"
    },
    {
      "step": 9,
      "text": "Stir in fresh basil and season with salt and pepper",
      "timing": "PT1M"
    },
    {
      "step": 10,
      "text": "Serve immediately with parmesan if desired",
      "timing": "PT1M"
    }
  ],

  "nutrition": {
    "serving-size": "1 serving",
    "calories": 450,
    "fat": "12g",
    "saturated-fat": "2g",
    "carbohydrates": "72g",
    "fiber": "4g",
    "sugar": "5g",
    "protein": "14g",
    "sodium": "200mg"
  },

  "notes": [
    "For a vegan version, omit the parmesan",
    "Fresh tomatoes work best in summer; use canned in winter",
    "Add red pepper flakes for a spicy kick"
  ],

  "tags": ["pasta", "italian", "vegetarian", "quick", "weeknight"],
  "categories": ["Italian", "Pasta", "Vegetarian"],

  "source": {
    "type": "original",
    "attribution": "Original recipe by Chef Maria",
    "url": "https://example.wiki/chef/maria"
  },

  "published-date": "2026-02-05T12:00:00Z",
  "modified-date": "2026-02-05T12:00:00Z",

  "ratings": {
    "average": 4.8,
    "count": 127
  },

  "access": {
    "model": "free",
    "price": 0,
    "currency": "USD"
  },

  "content-formats": {
    "text": "Bring a large pot of salted water to boil...",
    "markdown": "## Ingredients\n\n- 1 lb pasta...",
    "html": "<h2>Ingredients</h2><ul><li>1 lb pasta...</li></ul>",
    "structured": true
  },

  "payees": [
    {
      "pubKey": "02a1b2c3d4e5f6...",
      "addie-url": "https://addie.planetnine.app",
      "percent": 10,
      "signature": "3045022100..."
    },
    {
      "pubKey": "02f6e5d4c3b2a1...",
      "addie-url": "https://addie.planetnine.app",
      "percent": 90,
      "signature": "3046022100..."
    }
  ]
}
```

## Field Definitions

### Required Fields

- **type**: Always "recipe"
- **uid**: Unique identifier for the recipe
- **name**: Recipe title
- **ingredients**: Array of ingredient objects
- **instructions**: Array of instruction step objects

### Recommended Fields

- **url**: Canonical URL for the recipe
- **summary**: Brief description (1-2 sentences)
- **authors**: Recipe creator(s)
- **images**: At least a hero image
- **timing**: Prep, cook, and total time
- **yield**: How many servings
- **difficulty**: "easy", "medium", "hard", or "expert"

### Optional Fields

- **description**: Longer narrative about the recipe
- **cuisine**: Cuisine type(s)
- **course**: "appetizer", "main", "side", "dessert", "snack", "beverage"
- **meal-type**: "breakfast", "lunch", "dinner", "snack"
- **dietary-info**: Dietary tags and restrictions
- **equipment**: Tools needed
- **nutrition**: Nutritional information
- **notes**: Chef's tips and variations
- **tags**: Searchable keywords
- **categories**: Recipe categories
- **source**: Attribution if adapted
- **ratings**: Aggregate ratings
- **access**: Pricing and access model

## Time Format

Uses ISO 8601 duration format (PT#H#M#S):

- PT15M = 15 minutes
- PT1H30M = 1 hour 30 minutes
- PT2H = 2 hours
- P1D = 1 day (for recipes requiring overnight rest)

## Difficulty Levels

- **easy**: Beginner-friendly, basic techniques
- **medium**: Some cooking experience helpful
- **hard**: Advanced techniques, precise timing
- **expert**: Professional-level, complex preparations

## Access Models

### Free Recipe
```json
{
  "access": {
    "model": "free",
    "price": 0
  }
}
```

### Premium Recipe (One-time Purchase)
```json
{
  "access": {
    "model": "purchase",
    "price": 2.99,
    "currency": "USD"
  }
}
```

### Subscription Required
```json
{
  "access": {
    "model": "subscription",
    "price": 9.99,
    "currency": "USD",
    "billing-period": "monthly",
    "requiresSubscription": true
  }
}
```

### Recipe Book Bundle
```json
{
  "access": {
    "model": "bundle",
    "price": 19.99,
    "currency": "USD",
    "bundle-id": "italian-classics",
    "bundle-name": "Italian Classics Collection"
  }
}
```

### Donation-Based
```json
{
  "access": {
    "model": "donation",
    "suggested-amount": 1.00,
    "currency": "USD"
  }
}
```

## Ingredient Object

```json
{
  "item": "flour",
  "quantity": 2.5,
  "unit": "cups",
  "notes": "all-purpose, sifted",
  "section": "dry ingredients",
  "optional": false,
  "alternatives": ["gluten-free flour", "whole wheat flour"]
}
```

**Units**: Use standard cooking units (cup, tablespoon, teaspoon, ounce, pound, gram, liter, etc.)

**Sections**: Group ingredients (e.g., "dough", "filling", "sauce", "garnish")

## Instruction Step Object

```json
{
  "step": 1,
  "text": "Detailed instruction for this step",
  "timing": "PT5M",
  "temperature": {
    "value": 350,
    "unit": "F"
  },
  "image": "https://example.wiki/images/step1.jpg",
  "video": "https://example.wiki/videos/step1.mp4"
}
```

## Source Attribution

### Original Recipe
```json
{
  "source": {
    "type": "original",
    "attribution": "Original recipe by Chef Maria"
  }
}
```

### Adapted Recipe
```json
{
  "source": {
    "type": "adapted",
    "attribution": "Adapted from The Joy of Cooking",
    "original-author": "Irma S. Rombauer",
    "url": "https://example.com/original",
    "changes": "Modified to be vegetarian, reduced salt"
  }
}
```

### Family Recipe
```json
{
  "source": {
    "type": "family",
    "attribution": "Grandmother's recipe, circa 1950"
  }
}
```

## Recipe Collections

Group related recipes:

```json
{
  "type": "collection",
  "uid": "collection_italian_basics",
  "name": "Italian Basics",
  "description": "Essential Italian recipes for home cooks",
  "recipes": [
    "recipe_1234567890_abc123",
    "recipe_9876543210_xyz789"
  ],
  "image": "https://example.wiki/collections/italian.jpg",
  "author": {
    "name": "Chef Maria"
  }
}
```

## Meal Plans

Weekly or monthly meal planning:

```json
{
  "type": "meal-plan",
  "uid": "mealplan_week1",
  "name": "Week 1 - Mediterranean",
  "duration": "P7D",
  "meals": [
    {
      "day": "monday",
      "meal": "dinner",
      "recipe-uid": "recipe_1234567890_abc123"
    },
    {
      "day": "tuesday",
      "meal": "dinner",
      "recipe-uid": "recipe_9876543210_xyz789"
    }
  ]
}
```

## Discovery and Search

Feeds should support filtering:

- **By cuisine**: `?cuisine=italian`
- **By course**: `?course=main`
- **By dietary**: `?vegetarian=true`
- **By difficulty**: `?difficulty=easy`
- **By time**: `?max-time=30` (minutes)

Example:
```
GET /feeds/recipes/user-uuid?vegetarian=true&max-time=30
```

## Federation Support

### Recipe References

Reference recipes across sites:

```json
{
  "type": "recipe-reference",
  "recipe-uid": "recipe_1234567890_abc123",
  "source-feed": "https://other-wiki.example/feeds/recipes/other-uuid",
  "cached-name": "Classic Tomato Basil Pasta",
  "cached-image": "https://other-wiki.example/images/pasta.jpg"
}
```

### Chef Discovery

```json
{
  "type": "chef",
  "uid": "chef_uuid",
  "name": "Chef Maria",
  "bio": "Specializing in Italian and Mediterranean cuisine",
  "avatar": "https://example.wiki/chef/avatar.jpg",
  "website": "https://example.wiki/chef",
  "recipes-feed": "https://example.wiki/feeds/recipes/chef_uuid",
  "specialties": ["Italian", "Mediterranean", "Pasta"],
  "verified": true
}
```

## Implementation Examples

### Publishing a Recipe to Sanora

```javascript
PUT /user/:uuid/product/:recipeName

{
  "timestamp": "1234567890",
  "pubKey": "chef-public-key",
  "signature": "signature",
  "description": "A simple, delicious pasta dish",
  "price": 0,
  "category": "recipe",
  "tags": "recipe,italian,pasta,vegetarian,quick",
  "metadata": {
    "name": "Classic Tomato Basil Pasta",
    "servings": 4,
    "prepTime": "PT15M",
    "cookTime": "PT20M",
    "totalTime": "PT35M",
    "difficulty": "easy",
    "cuisine": ["Italian"],
    "course": "main",
    "ingredients": [...],
    "instructions": [...],
    "nutrition": {...},
    "dietary": {
      "vegetarian": true,
      "vegan": false
    }
  }
}
```

### Querying Recipe Feed

```javascript
GET /feeds/recipes/:uuid

Returns:
{
  "version": "1.0",
  "title": "Chef's Recipes",
  "items": [
    { /* Recipe object */ },
    { /* Recipe object */ }
  ]
}
```

## Comparison with Existing Standards

### vs Schema.org Recipe

Canicook is inspired by Schema.org's Recipe schema but:
- Uses JSON feeds instead of embedded JSON-LD
- Designed for federated distribution
- Includes access models and pricing
- Federation-ready with cross-site references
- Privacy-first, no tracking

### vs RecipeML / Recipe JSON

- More modern JSON structure
- Better support for images and media
- Federation and discovery built-in
- Flexible access models
- Integrated with federated wiki ecosystem

## Migration Guides

### From Schema.org Recipe

```javascript
// Schema.org
{
  "@type": "Recipe",
  "name": "...",
  "recipeIngredient": ["1 lb pasta", "2 cups tomatoes"],
  "recipeInstructions": "Step 1..."
}

// Canicook
{
  "type": "recipe",
  "name": "...",
  "ingredients": [
    {"item": "pasta", "quantity": 1, "unit": "pound"},
    {"item": "tomatoes", "quantity": 2, "unit": "cups"}
  ],
  "instructions": [
    {"step": 1, "text": "..."}
  ]
}
```

### From RecipeML

Parse XML to JSON, restructure ingredients as objects, add metadata fields.

### From Recipe Blog Posts

- Extract title → `name`
- Parse ingredient list → `ingredients` array
- Parse instructions → `instructions` array
- Extract images → `images` object
- Estimate times → `timing` object
- Add dietary tags → `dietary-info`

## Payee Structure (Optional)

Recipes can include an optional `payees` array for revenue distribution. Each payee is defined by the Addie four-tuple:

```json
{
  "payees": [
    {
      "pubKey": "02a1b2c3d4e5f6...",
      "addie-url": "https://addie.planetnine.app",
      "percent": 10,
      "signature": "3045022100..."
    },
    {
      "pubKey": "02f6e5d4c3b2a1...",
      "addie-url": "https://addie.planetnine.app",
      "percent": 90,
      "signature": "3046022100..."
    }
  ]
}
```

### Payee Fields

- **pubKey**: Creator's Sessionless public key (secp256k1)
- **addie-url**: Addie payment service URL for processing payments
- **percent**: Percentage of revenue (0-100)
- **signature**: Cryptographic signature of `(pubKey + addie-url + percent)` to verify payee authenticity

### Use Cases

- **Chef royalties**: Original chef 100%
- **Recipe collaborations**: Chef 1 gets 60%, Chef 2 gets 40%
- **Platform splits**: Chef 85%, platform 15%
- **Ingredient supplier affiliate**: Chef 95%, supplier 5%
- **Recipe collection splits**: Multiple chefs sharing cookbook revenue

Payees are processed when payment is triggered (premium recipe purchase, subscription charge, cookbook purchase) via Addie's payment infrastructure.

## Security Considerations

1. **HTML Sanitization**: Sanitize any HTML in recipe descriptions
2. **Image Validation**: Verify image URLs and file types
3. **Input Validation**: Validate quantities, units, times
4. **XSS Prevention**: Escape user-generated content
5. **Content Moderation**: Community standards for shared recipes
6. **Payee Signature Verification**: Validate all payee signatures to prevent tampering

## Future Enhancements

### Phase 2: Enhanced Features
- Video instructions support
- Step-by-step photos
- Ingredient substitutions AI
- Nutrition calculation
- Shopping list generation

### Phase 3: Social Features
- Recipe reviews and comments
- Star ratings and favorites
- Recipe forking and variations
- Chef following
- Recipe recommendations

### Phase 4: Advanced Features
- Recipe scaling (adjust servings)
- Unit conversion (metric ↔ imperial)
- Meal planning calendar
- Grocery delivery integration
- Cooking mode (voice-guided)

## Reference Implementation

- **Sanora**: Storage backend (product API)
- **wiki-plugin-recipes**: Publishing platform
- **Port**: 6060 (following The Advancement standardization)

## Related Specifications

- [Canimus](./canimus.md) - Music feed spec
- [Canipub](./canipub.md) - Book feed spec
- [Caniblog](./caniblog.md) - Blog post feed spec

## License

This specification is open and free to implement.

---

**Built with 💚 for The Advancement**

Making recipe sharing open, federated, and community-owned.
