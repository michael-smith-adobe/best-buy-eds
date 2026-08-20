/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-product. Base block: cards (container).
 * Source: https://www.bestbuy.com/top-deals (rc10 "Featured deals" product carousel)
 * Generated: 2026-08-20
 *
 * xwalk model (blocks/cards-product/_cards-product.json -> item model "card"):
 *   image (reference), text (richtext). Each product card becomes one card row.
 * Library structure: container of N card rows; each row = 2 cells [image | rich text].
 *
 * Each source card (li.c-carousel-item):
 *   - "% off" badge (span)
 *   - product image (a img)
 *   - product title link (a.relative -> span[title]/span.line-clamp-2)
 *   - "60th Anniversary Deal" price label + current price (span.font-500) + was price (.priceBlockWrapper)
 *   - "Unavailable" availability button -> SKIPPED (interactive/stateful, not content).
 *
 * Field hints (xwalk): cell 1 -> field:image ; cell 2 -> field:text.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('li.c-carousel-item'));

  const cells = [];

  items.forEach((li) => {
    // Product image: first non-data-URI <img> inside an anchor.
    const image = Array.from(li.querySelectorAll('a img, img')).find(
      (img) => img.getAttribute('src') && !img.getAttribute('src').startsWith('data:'),
    );

    // "% off" badge.
    const badge = Array.from(li.querySelectorAll('span')).find((s) => /%\s*off/i.test(s.textContent));

    // Title link.
    const titleLink = li.querySelector('a.relative[href], a[href] span[title]')
      ? li.querySelector('a.relative[href]') || li.querySelector('a[href]')
      : null;
    const titleSpan = li.querySelector('span[title], span.line-clamp-2');

    // Price label ("60th Anniversary Deal").
    const priceLabel = Array.from(li.querySelectorAll('span')).find((s) => /Anniversary Deal/i.test(s.textContent));
    // Current price: the visible font-500 price span (avoids the sr-only duplicate).
    const currentPrice = Array.from(li.querySelectorAll('span')).find((s) => /font-500/.test(s.className) && /\$/.test(s.textContent));
    // Was price: inside the nested "The price was" group; take the innermost $ span.
    let wasPrice = null;
    const wasLabel = Array.from(li.querySelectorAll('span')).find((s) => /the price was/i.test(s.textContent));
    if (wasLabel && wasLabel.parentElement) {
      wasPrice = Array.from(wasLabel.parentElement.querySelectorAll('span')).find(
        (s) => /\$/.test(s.textContent) && !/sr-only/.test(s.className) && !s.querySelector('span'),
      );
    }

    // Skip cards with no meaningful content.
    if (!image && !titleSpan && !badge) return;

    const imageCell = [];
    if (image) {
      imageCell.push(document.createComment(' field:image '));
      imageCell.push(image);
    }

    // Rich text cell: badge + title link + price label + current/was price.
    const textCell = [document.createComment(' field:text ')];
    if (badge) {
      const p = document.createElement('p');
      p.textContent = badge.textContent.trim();
      textCell.push(p);
    }
    if (titleSpan) {
      const titleText = (titleSpan.getAttribute('title') || titleSpan.textContent).trim();
      const href = titleLink && titleLink.getAttribute('href');
      const heading = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = titleText;
        heading.appendChild(a);
      } else {
        heading.textContent = titleText;
      }
      textCell.push(heading);
    }
    const priceParts = [];
    if (priceLabel) priceParts.push(priceLabel.textContent.trim());
    if (currentPrice) priceParts.push(currentPrice.textContent.trim());
    if (wasPrice) priceParts.push(`was ${wasPrice.textContent.trim()}`);
    if (priceParts.length) {
      const p = document.createElement('p');
      p.textContent = priceParts.join(' ');
      textCell.push(p);
    }

    cells.push([imageCell, textCell]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-product', cells });
  element.replaceWith(block);
}
