/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-promo. Base block: hero.
 * Source: https://www.bestbuy.com/top-deals (rc8 promotional banner)
 * Generated: 2026-08-20
 *
 * xwalk model (blocks/hero-promo/_hero-promo.json): image (reference), imageAlt (collapsed -> img alt), text (richtext).
 * Library structure: 1 column, up to 3 rows -> [block name], [background image], [rich text].
 *
 * Field hints (xwalk): image cell -> field:image ; text cell -> field:text.
 * imageAlt is a collapsed field (Alt suffix) -> lives on the <img alt> attribute, no hint.
 */
export default function parse(element, { document }) {
  // INPUT extraction (selectors validated against block-context/hero-promo/source.html)
  // Main promotional graphic (60th Anniversary). First real (non data-URI) image in the banner.
  const images = Array.from(element.querySelectorAll('img')).filter(
    (img) => img.getAttribute('src') && !img.getAttribute('src').startsWith('data:'),
  );
  const mainImage = images[0] || null;

  // Headline + supporting copy. The text lives beside the graphic; fall back to broad selectors.
  const heading = element.querySelector('h1, h2, [class*="headline"]');
  const textWrap = element.querySelector('.ml-1200, .pt-150') || element;
  let paras = Array.from(textWrap.querySelectorAll(':scope > p'));
  if (!paras.length) paras = Array.from(element.querySelectorAll('p'));

  // Empty-block guard: nothing meaningful to place.
  if (!mainImage && !heading && !paras.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background/main image (optional)
  if (mainImage) {
    cells.push([[document.createComment(' field:image '), mainImage]]);
  }

  // Row 3: rich text (heading + subheading + disclaimer/CTA)
  // Strip decorative inline images (e.g. the clock icon beside "Ends Sunday").
  // md2jcr's richtext field is greedy but STOPS consuming at an inline image, which
  // would strand the trailing paragraphs with no field to map to and throw
  // "content isn't mapping to the model correctly". Only the main banner graphic
  // (handled above as field:image) belongs to this hero; text is icon-free.
  paras.forEach((p) => {
    p.querySelectorAll('img, picture').forEach((img) => img.remove());
  });
  // Drop paragraphs that are now empty after removing their icon.
  paras = paras.filter((p) => p.textContent.trim().length > 0);

  const textCell = [document.createComment(' field:text ')];
  if (heading) textCell.push(heading);
  paras.forEach((p) => textCell.push(p));
  if (textCell.length > 1) cells.push([textCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-promo', cells });
  element.replaceWith(block);
}
