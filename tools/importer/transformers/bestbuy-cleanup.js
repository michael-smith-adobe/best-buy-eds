/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Best Buy site-wide cleanup for the Top Deals migration.
 *
 * Scope for this migration (KEEP, in order): the "Top Deals" <h1>, the promotional
 * hero banner, the "Shop deals by category" scroller, the "Featured deals" section,
 * and the single in-scope Sponsored slot (custom-leaderboard position1). Everything
 * else — site chrome and all out-of-scope body copy/ads below the in-scope sponsored
 * slot — is dropped.
 *
 * All selectors verified against migration-work/cleaned.html.
 *
 * Direct children of <main class="container-v3"> in the captured DOM (in order):
 *   div#1  div.display-ad-wrapper            (line 261)  page-top pencil ad   -> DROP (afterTransform: div#1 precedes the nth-of-type anchors)
 *   h1     .text-style-title-md-500          (line 273)  "Top Deals"          -> KEEP
 *   div#2  div.relative.overflow-hidden      (line 274)  hero-promo banner    -> KEEP  (parser anchor :nth-of-type(2))
 *   div#3  div.deals-by-categories           (line 298)  category scroller    -> KEEP
 *   div#4  div.relative.overflow-hidden      (line 661)  featured deals       -> KEEP  (parser anchor :nth-of-type(4))
 *   div#5  div.flex.flex-row.gap-200.w-full  (line 2052) empty layout row     -> DROP
 *   div#6  div (> #gpt-customleaderboard-position1) (line 2058) Sponsored p1  -> KEEP  (in-scope sponsored)
 *   div#7  div (> #gpt-customleaderboard-position2) (line 2073) Sponsored p2  -> DROP  (out-of-scope ad)
 *   div#8  div.flex.flex-row.gap-200.w-full  (line 2088) empty layout row     -> DROP
 *   div#9  div.w-full                        (line 2094) empty placeholder    -> DROP
 *   div#10 div.wrapperLarge                  (line 2096) "60th Anniversary Sale:"/"Top Deals details:" terms -> DROP
 *   div#11 div.wrapperLarge                  (line 2122) "Scoring top deals..." SEO copy -> DROP
 *   div#12 div (> #gpt-leaderboardfooter-position1) (line 2163) footer ad     -> DROP
 *
 * Chrome that are direct children of <body> (all non-authorable):
 *   #headerFooterIncludes-beforeFirstPaintSet (line 6), .brix.smart-banner (line 9,
 *   the "60th Anniversary Sale Ends Sunday" top strip), the wrapper holding .shop-header
 *   / <header> / <nav> (line 14-251), .atwa-ninja (line 256), the wrapper holding
 *   .shop-footer / <footer id="footer"> (line 2183-2458),
 *   #headerFooterIncludes-afterFirstPaintSet (line 2461), <iframe>, <next>, and the
 *   grecaptcha wrapper (line 2467).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Drop out-of-scope content that follows the in-scope Sponsored slot (position1),
    // plus the empty layout row that precedes it. All of these are main direct-child
    // divs positioned AFTER div#4 (the featured-deals :nth-of-type(4) parser anchor),
    // so removing them here does NOT shift the :nth-of-type(2)/(4) indices the block
    // parsers rely on. Removing position2 here also prevents the sponsored parser's
    // dual-matching `div.display-ad-wrapper:has(.custom-leaderboard)` selector from
    // grabbing the out-of-scope slot.
    WebImporter.DOMUtils.remove(element, [
      // Everything after the in-scope Sponsored slot: position2 ad, empty rows,
      // wrapperLarge terms/SEO copy blocks, and the footer leaderboard ad.
      'main.container-v3 > div:has(#gpt-customleaderboard-position1) ~ div',
      // The empty layout rows (line 2052 sits before position1, so it is not covered
      // by the sibling rule above; line 2088 is redundant but harmless).
      'main.container-v3 > div.flex.flex-row.gap-200.w-full',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Page-top pencil ad. This is main's FIRST div child (div#1), so it must be removed
    // only AFTER block parsing — removing it earlier would renumber div.relative.overflow-hidden
    // and break the :nth-of-type(2)/(4) parser selectors. The child combinator keeps this
    // scoped to the direct main child (the nested .display-ad-wrapper inside the kept
    // position1 slot is a grandchild and is not matched).
    WebImporter.DOMUtils.remove(element, [
      'main.container-v3 > div.display-ad-wrapper',
    ]);

    // Remove all site chrome: every direct child of <body> except <main>. Verified in
    // cleaned.html to be non-authorable only (header/nav, smart-banner promo strip,
    // footer, atwa-ninja, headerFooterIncludes script slots, recaptcha, iframe, next).
    // This does not touch bare <hr> inside <main> (section breaks added by the section
    // transformer live inside main and survive this cleanup).
    WebImporter.DOMUtils.remove(element, [
      'body > *:not(main)',
    ]);
  }
}
