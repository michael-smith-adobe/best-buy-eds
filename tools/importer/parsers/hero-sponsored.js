/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-sponsored. Base block: hero.
 * Source: https://www.bestbuy.com/top-deals (Sponsored ad banner — Surface Laptop / Qualcomm)
 * Generated: 2026-08-20
 *
 * xwalk model (blocks/hero-sponsored/_hero-sponsored.json): image (reference),
 *   imageAlt (collapsed -> img alt), text (richtext).
 * Library structure: 1 column, up to 3 rows -> [block name], [background image], [rich text].
 *
 * The captured DOM is a Google Publisher Tag (GPT) placeholder — the live creative is a single
 * banner image + link injected at runtime. This parser prefers that banner image + link, and
 * degrades gracefully: if no usable creative image exists (empty GPT slot), it emits a minimal
 * hero carrying the available content (e.g. the "Sponsored" label) rather than failing.
 *
 * Field hints (xwalk): image cell -> field:image ; text cell -> field:text.
 * imageAlt is collapsed (Alt suffix) -> lives on the <img alt> attribute, no hint.
 */
export default function parse(element, { document }) {
  // Preferred: a real banner creative image (skip inline data-URI decorations).
  const bannerImage = Array.from(element.querySelectorAll('img')).find(
    (img) => img.getAttribute('src') && !img.getAttribute('src').startsWith('data:'),
  );
  // Wrapping link for the creative, if present.
  const bannerLink = element.querySelector('a[href]');
  // "Sponsored" label (ad-text) as fallback content.
  const sponsoredLabel = element.querySelector('.ad-text, .horizontal-text')
    || Array.from(element.querySelectorAll('span')).find((s) => /sponsored/i.test(s.textContent));

  const cells = [];

  // Row 2: banner image (optional). If the image is wrapped in a link, keep the link.
  if (bannerImage) {
    const imageCell = [document.createComment(' field:image ')];
    if (bannerLink && bannerLink.contains(bannerImage)) {
      imageCell.push(bannerLink);
    } else {
      imageCell.push(bannerImage);
    }
    cells.push([imageCell]);
  }

  // Row 3: rich text. Prefer an explicit banner link; otherwise fall back to the Sponsored label.
  const textCell = [document.createComment(' field:text ')];
  let hasText = false;
  if (bannerLink && !(bannerImage && bannerLink.contains(bannerImage))) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', bannerLink.getAttribute('href'));
    a.textContent = bannerLink.textContent.trim() || 'Sponsored';
    p.appendChild(a);
    textCell.push(p);
    hasText = true;
  } else if (!bannerImage && sponsoredLabel) {
    // Minimal fallback for the empty GPT placeholder: carry the "Sponsored" label.
    const p = document.createElement('p');
    p.textContent = sponsoredLabel.textContent.trim() || 'Sponsored';
    textCell.push(p);
    hasText = true;
  }
  if (hasText) cells.push([textCell]);

  // Empty-block guard: if we produced no rows at all, emit a minimal hero with a Sponsored label
  // rather than failing (empty GPT slot with no discoverable content).
  if (!cells.length) {
    const p = document.createElement('p');
    p.textContent = 'Sponsored';
    cells.push([[document.createComment(' field:text '), p]]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-sponsored', cells });
  element.replaceWith(block);
}
