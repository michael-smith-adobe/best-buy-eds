/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroPromoParser from './parsers/hero-promo.js';
import cardsCategoryParser from './parsers/cards-category.js';
import cardsOfferParser from './parsers/cards-offer.js';
import cardsProductParser from './parsers/cards-product.js';
import heroSponsoredParser from './parsers/hero-sponsored.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/bestbuy-cleanup.js';
import sectionsTransformer from './transformers/bestbuy-sections.js';
import imagesTransformer from './transformers/bestbuy-images.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'top-deals',
  description: "Best Buy Top Deals landing page (partial scope): Top Deals H1 with intro copy, promotional hero banner, 'Shop deals by category' carousel, 'Featured deals' section (promo tiles + product carousel), and a Sponsored ad banner. Scope stops before the 'Deals for every budget' section.",
  urls: [
    'https://www.bestbuy.com/top-deals',
  ],
  blocks: [
    {
      name: 'hero-promo',
      instances: [
        'body > main.container-v3 > div.relative.overflow-hidden:nth-of-type(2)',
      ],
    },
    {
      name: 'cards-category',
      instances: [
        'body > main.container-v3 > div.deals-by-categories',
      ],
    },
    {
      name: 'cards-offer',
      instances: [
        'body > main.container-v3 > div.relative.overflow-hidden:nth-of-type(4) div.grid.gap-200.mx-200',
      ],
    },
    {
      name: 'cards-product',
      instances: [
        'body > main.container-v3 > div.relative.overflow-hidden:nth-of-type(4) div.pl-flex-carousel-container.deals-carousel',
      ],
    },
    {
      name: 'hero-sponsored',
      instances: [
        'body > main.container-v3 div.display-ad-wrapper:has(.custom-leaderboard)',
        'body > main.container-v3 > div:has(> .display-ad-wrapper .custom-leaderboard)',
      ],
    },
  ],
  sections: [
    {
      id: 'rc7',
      name: 'top-deals-title',
      selector: 'body > main.container-v3 > h1.text-style-title-md-500',
      style: null,
      blocks: [],
      defaultContent: ['body > main.container-v3 > h1.text-style-title-md-500'],
    },
    {
      id: 'rc8',
      name: 'hero-promo-banner',
      selector: 'body > main.container-v3 > div.relative.overflow-hidden:nth-of-type(2)',
      style: null,
      blocks: ['hero-promo'],
      defaultContent: [],
    },
    {
      id: 'rc9',
      name: 'shop-by-category',
      selector: 'body > main.container-v3 > div.deals-by-categories',
      style: null,
      blocks: ['cards-category'],
      defaultContent: [],
    },
    {
      id: 'rc10',
      name: 'featured-deals',
      selector: 'body > main.container-v3 > div.relative.overflow-hidden:nth-of-type(4)',
      style: null,
      blocks: ['cards-offer', 'cards-product'],
      defaultContent: [],
    },
    {
      id: 'sponsored',
      name: 'sponsored-banner',
      selector: 'body > main.container-v3 div.display-ad-wrapper:has(.custom-leaderboard)',
      style: null,
      blocks: ['hero-sponsored'],
      defaultContent: [],
    },
  ],
};

// PARSER REGISTRY - Map parser names to functions
const parsers = {
  'hero-promo': heroPromoParser,
  'cards-category': cardsCategoryParser,
  'cards-offer': cardsOfferParser,
  'cards-product': cardsProductParser,
  'hero-sponsored': heroSponsoredParser,
};

// TRANSFORMER REGISTRY - cleanup first, then section breaks, then image URL rewrite
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
  imagesTransformer,
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform (typically document.body or main)
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements;
      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        console.warn(`Invalid selector for "${blockDef.name}": ${selector}`, e);
        return;
      }
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        // Avoid double-registering the same element (e.g. hero-sponsored's two fallback selectors)
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup + section breaks are handled by transformers per their hooks)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // Already replaced by an earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized document path
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
