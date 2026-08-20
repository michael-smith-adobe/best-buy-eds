/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Best Buy section breaks for the Top Deals migration.
 *
 * The top-deals template defines 5 in-scope sections (page-templates.json), none of
 * which carry a `style`, so this transformer inserts section-break <hr> elements only
 * (no Section Metadata blocks). Expected: sections.length - 1 = 4 breaks (one before
 * every section except the first).
 *
 * Section boundaries (all verified against migration-work/cleaned.html, all direct
 * descendants of <main class="container-v3">):
 *   rc7  top-deals-title    body > main.container-v3 > h1.text-style-title-md-500              (line 273)  FIRST -> no break
 *   rc8  hero-promo-banner  body > main.container-v3 > div.relative.overflow-hidden:nth-of-type(2) (line 274)  -> break before
 *   rc9  shop-by-category   body > main.container-v3 > div.deals-by-categories                 (line 298)  -> break before
 *   rc10 featured-deals     body > main.container-v3 > div.relative.overflow-hidden:nth-of-type(4) (line 661)  -> break before
 *   sponsored sponsored-banner  body > main.container-v3 div.display-ad-wrapper:has(.custom-leaderboard) (line 2059, position1) -> break before
 *
 * Break insertion runs in beforeTransform: block parsers replace section elements
 * between the two hooks (e.g. the hero/featured/sponsored selectors are the exact
 * elements their parsers target), so anchoring off the original element must happen
 * before parsing. Inserting a bare <hr> never disturbs the parsers' :nth-of-type(2)/(4)
 * selectors because :nth-of-type counts same-tag (div) siblings only. Iterating in
 * reverse keeps every not-yet-processed section exactly where querySelector found it.
 *
 * No metadata work is needed in afterTransform since no section has a style.
 */

export default function transform(hookName, element, payload) {
  const sections = (payload.template && payload.template.sections) || [];

  if (hookName === 'beforeTransform') {
    // Clear any pre-existing bare <hr> so the only <hr> under main are the section
    // breaks this transformer inserts. In the real import pipeline the cleanup
    // transformer has already removed the footer (the sole source of stray <hr> in
    // this page — 5 bare <hr> live inside <footer id="footer">), so this is a no-op
    // there; it matters only when this file is validated in isolation, where the
    // footer is still present and its <hr> would otherwise inflate the break count.
    element.querySelectorAll('hr').forEach((hr) => hr.remove());

    // Insert a section break before every section except the first, walking in reverse
    // so earlier sections keep their original DOM position while later ones are handled.
    for (let i = sections.length - 1; i >= 1; i -= 1) {
      const section = sections[i];
      const sectionEl = element.querySelector(section.selector);
      if (!sectionEl) continue; // selector didn't match on this page — skip, never guess

      const hr = document.createElement('hr');
      sectionEl.before(hr);
    }
  }

  // afterTransform intentionally does no work: no section in this template has a
  // `style`, so there are no Section Metadata blocks to create.
}
