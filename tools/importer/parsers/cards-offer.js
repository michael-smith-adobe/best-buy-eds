/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-offer. Base block: cards (container).
 * Source: https://www.bestbuy.com/top-deals (rc10 "Featured deals" promo tiles)
 * Generated: 2026-08-20
 *
 * xwalk model (blocks/cards-offer/_cards-offer.json -> item model "card"):
 *   image (reference), text (richtext). Each promo tile becomes one card row.
 * Library structure: container of N card rows; each row = 2 cells [image | rich text].
 *
 * Each source tile: .offerHeadline + product image (.flex.grow img) + .bodyCopy + "Shop now" CTA (.footer a).
 * Note: the section-level banner <img> (a direct child of the block root, before the tiles) is NOT a card
 * image — cards are keyed off .offerHeadline, so that banner is naturally excluded.
 *
 * Field hints (xwalk): cell 1 -> field:image ; cell 2 -> field:text.
 */
export default function parse(element, { document }) {
  // One card per offer headline; derive the card container from it.
  const headlines = Array.from(element.querySelectorAll('.offerHeadline'));

  const cells = [];

  headlines.forEach((headline) => {
    const card = headline.closest('div.rounded-lg') || headline.parentElement;

    // Product/promo image (skip data-URI info icons).
    const image = Array.from(
      (card || headline).querySelectorAll('.flex.grow img, img'),
    ).find((img) => img.getAttribute('src') && !img.getAttribute('src').startsWith('data:'));

    const body = card && card.querySelector('.bodyCopy');
    const ctaAnchor = card && card.querySelector('.footer a[href]');

    const imageCell = [];
    if (image) {
      imageCell.push(document.createComment(' field:image '));
      imageCell.push(image);
    }

    // Rich text cell: headline + body copy + CTA link.
    const textCell = [document.createComment(' field:text ')];
    // Headline (offer amount) as a heading.
    const h = document.createElement('h3');
    h.innerHTML = headline.innerHTML;
    textCell.push(h);
    if (body) {
      const p = document.createElement('p');
      p.innerHTML = body.innerHTML;
      textCell.push(p);
    }
    if (ctaAnchor) {
      const link = document.createElement('a');
      link.setAttribute('href', ctaAnchor.getAttribute('href'));
      const ctaText = ctaAnchor.textContent.trim() || 'Shop now';
      link.textContent = ctaText;
      const p = document.createElement('p');
      p.appendChild(link);
      textCell.push(p);
    }

    cells.push([imageCell, textCell]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-offer', cells });
  element.replaceWith(block);
}
