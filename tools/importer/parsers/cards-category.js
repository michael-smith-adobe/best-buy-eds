/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-category. Base block: cards (container).
 * Source: https://www.bestbuy.com/top-deals (rc9 "Shop deals by category" scroller)
 * Generated: 2026-08-20
 *
 * xwalk model (blocks/cards-category/_cards-category.json -> item model "card"):
 *   image (reference), text (richtext). Each carousel tile becomes one card row.
 * Library structure: container of N card rows; each row = 2 cells [image | rich text].
 *
 * Field hints (xwalk): cell 1 -> field:image ; cell 2 -> field:text.
 */
export default function parse(element, { document }) {
  // Each tile is a carousel <li>. Fallback to the inner .carousel-item if list markup varies.
  let items = Array.from(element.querySelectorAll('li.c-carousel-item'));
  if (!items.length) items = Array.from(element.querySelectorAll('.carousel-item'));

  const cells = [];

  items.forEach((li) => {
    // Round icon image (skip inline data-URI arrow/decoration images).
    const image = Array.from(li.querySelectorAll('.carousel-item-image-wrapper img, img')).find(
      (img) => img.getAttribute('src') && !img.getAttribute('src').startsWith('data:'),
    );

    // Linked label -> preserve the anchor so the destination href survives.
    const anchor = li.querySelector('a[href]');
    const label = li.querySelector('p.carousel-item-cta');
    let textNode = null;
    if (anchor && label) {
      const link = document.createElement('a');
      link.setAttribute('href', anchor.getAttribute('href'));
      link.textContent = label.textContent.trim();
      textNode = link;
    } else if (label) {
      textNode = label;
    } else if (anchor) {
      textNode = anchor;
    }

    // Skip empty tiles entirely.
    if (!image && !textNode) return;

    const imageCell = [];
    if (image) {
      imageCell.push(document.createComment(' field:image '));
      imageCell.push(image);
    }

    const textCell = [];
    if (textNode) {
      textCell.push(document.createComment(' field:text '));
      textCell.push(textNode);
    }

    cells.push([imageCell, textCell]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-category', cells });

  // Preserve the section heading ("Shop deals by category") as default content
  // before the block — it lives inside .deals-by-categories, which this parser replaces.
  const heading = element.querySelector('h1, h2, h3');
  if (heading) {
    const kept = document.createElement(heading.tagName.toLowerCase());
    kept.textContent = heading.textContent.trim();
    element.replaceWith(kept, block);
  } else {
    element.replaceWith(block);
  }
}
