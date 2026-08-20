/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: rewrite external Best Buy CDN image URLs to same-origin /media/ paths.
 *
 * The scraped content references product/promo imagery on pisces.bbystatic.com. EDS'
 * createOptimizedPicture() keeps only the URL pathname (dropping the external host),
 * so those images resolve same-origin and 404 in preview/delivery. To fix this, the
 * 46 in-scope images were uploaded to the site's content library (Document Authoring)
 * under /media/top-deals/<file>. This transformer rewrites each <img src> (and any
 * <source srcset>) from the original CDN URL to its same-origin /media/ path so the
 * optimizer resolves them correctly.
 *
 * The URL→media map is embedded below (generated from migration-work/image-upload-plan.json).
 * Keys are the CDN base URL (no ;query / ?query suffix); source values may carry
 * ;maxHeight=...;format=webp suffixes, so matching is done on the base.
 */

const IMAGE_MAP = {
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/bbee6c09-2e1d-4c85-b3e4-19c3269a5c25.jpg': '/content/dam/best-buy-eds/top-deals/c067b45f08420772430cc1c040537a7d.jpg',
  'https://pisces.bbystatic.com/image2/BestBuy_US/dam/2874172-flx-bts-k12-deals-250927-39ef507c-16b0-4306-82e6-e77dfdab7abf.png': '/content/dam/best-buy-eds/top-deals/f96e0a0c12f7710b2131fd3f7d2297b3.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/dam/MyBestBuy_Secondary-d5346fd6-3a16-475b-8501-0e99ae530aba.png': '/content/dam/best-buy-eds/top-deals/fbb7408131efe2c11d93d448f5ce49e1.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/dam/cope-t-re5865131-hisense_der-6ac5f84c-a957-4a9e-80a1-1cac7d329ebb.png': '/content/dam/best-buy-eds/top-deals/daca680d7cf7f12d741d4f7f59f0f69d.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/dam/ghp-top100-custom-icon-3492838a-12e0-4fd3-8b2d-d76830d0c135.png': '/content/dam/best-buy-eds/top-deals/f5d2df8b42d6529d87574b748b40f4bd.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/dam/pol-REF-6226019-260713_DER-5563888f-3622-4b9a-ae5a-fa6587caed17.png': '/content/dam/best-buy-eds/top-deals/16b7ae04f4f35c5839256f01b010ab64.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/dam/pol_neo-starbucks-v2-ref-6493303-0816-der-853e55c7-469b-4bd8-8481-679775c89c37.png': '/content/dam/best-buy-eds/top-deals/a8c2fbe126e09862d93622a72af13315.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/dam/pol_windows-ref-6492778-0719-der-6d588486-42af-45ca-b27a-022845c46f2c.png': '/content/dam/best-buy-eds/top-deals/56c843255a11d0a8f7a241287157eced.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/dam/ref-6094900-salepagelogo-172fef4e-6bb6-44d6-bae9-4e46a513ca3c.png': '/content/dam/best-buy-eds/top-deals/cdbd3a487079f651c53844252e62c549.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/0e949216-263c-4aed-b5f0-3a26b51175e1.png': '/content/dam/best-buy-eds/top-deals/af0cdd7bba1f2623ac290e9f9bf4607e.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/216de0c9-f0f7-46a3-930f-dff58c53bef4.png': '/content/dam/best-buy-eds/top-deals/4cc5e6aeaa178ef28a7acc96fc20b66f.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/3909cb40-136f-4a58-b500-4f79b55a0f44.jpg': '/content/dam/best-buy-eds/top-deals/4151ee2ea380448964d555731630cc0e.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/40fe96ed-f138-4704-b037-24ae789770eb.jpg': '/content/dam/best-buy-eds/top-deals/499c241ad47ac51d75057c9d02f1ae56.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/4c89b4f9-1257-457c-88c1-a6cb240288d5.jpg': '/content/dam/best-buy-eds/top-deals/5379c94819ffd2bf650a0d85d70edab0.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/4dc64937-0e24-48cc-91de-1bd9dbc52eac.png': '/content/dam/best-buy-eds/top-deals/b6e50976f6cb981bb3699384bcb757a1.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6494/6494617_sd.jpg': '/content/dam/best-buy-eds/top-deals/96bb82d0f178464712546bbc43b2885d.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6526/6526125_sd.jpg': '/content/dam/best-buy-eds/top-deals/744ebc5f95a1a46b461b4815220ccd59.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6569/6569841_sd.jpg': '/content/dam/best-buy-eds/top-deals/b959ca7b192eff1bf0a66c07dd78d88e.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6570/6570527_sd.jpg': '/content/dam/best-buy-eds/top-deals/1c0cdfe01e9817968deaa830a980e162.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6582/6582065_sd.jpg': '/content/dam/best-buy-eds/top-deals/6cd757cf163c77b00712c1e5d523bedd.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6d3e8343-2ce5-4f41-82bd-cba7a67655ee.jpg': '/content/dam/best-buy-eds/top-deals/c29bf26f487b92ed0b91fa80ff5de72b.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/7065c957-b994-40f0-8697-9d6ce0689508.jpg': '/content/dam/best-buy-eds/top-deals/b012f572becdccd9f8f8bc7130602412.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/7e9e4c9b-d2af-48f0-a93f-68e325a330e8.jpg': '/content/dam/best-buy-eds/top-deals/677cf6a040036ba28084444b201148e6.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/7f4ab98f-7332-4e52-a474-70cb1c990d27.jpg': '/content/dam/best-buy-eds/top-deals/20f8afc5e4eefe1c19b49cef3f6789ee.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/a17317de-2efa-4f54-9793-87e1888cceea.jpg': '/content/dam/best-buy-eds/top-deals/49ff3dbba143ded41c5fa24a882dd63e.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/a69588e3-2c25-4d64-bed1-e855f4fed90d.jpg': '/content/dam/best-buy-eds/top-deals/b51584827a412f223ab3b7d1299758c9.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/a8655114-667c-488e-9650-bd74ee5fe2d6.jpg': '/content/dam/best-buy-eds/top-deals/0e7221cac1ef514f268a133fef39e33e.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/c3abe0d2-3129-4e47-8904-aadaf47eb4af.jpg': '/content/dam/best-buy-eds/top-deals/e6c5d218f40ffdc40ef1b4f0d1b8ac24.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/d29d8849-34ca-4b31-937a-bed7e9f5234c.jpg': '/content/dam/best-buy-eds/top-deals/980db552ef28c1ed19eff502d50acd2e.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/eb95fd00-a9ed-4b12-a129-33104e029329.jpg': '/content/dam/best-buy-eds/top-deals/71f5babcb91b7de8420034aebf16c42b.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/f63724ce-bb62-4c80-8b2f-cf81fb948a99.jpg': '/content/dam/best-buy-eds/top-deals/00565d6c2a314080cfc996e69b884f36.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/dam/REF-5811500-gift-card-icon-4afb6c25-94ad-4830-97ae-87420b265e5b.png': '/content/dam/best-buy-eds/top-deals/232968af6a636515fb29822022fb119f.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/dam/ghp-shopall-custom-icon-e0fec54d-41f1-4876-8d90-233e853535fe.png': '/content/dam/best-buy-eds/top-deals/d1251a37cad1077e8a2c682b01831fa3.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/dam/ref-3478951-2025gi-outlet_der-a0d671e6-08ac-4497-a564-ed90ad2ed0e4.jpg': '/content/dam/best-buy-eds/top-deals/2f3f7e4a24540ba87ba2d0f275a29089.jpg',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/0d8ae78a-c3df-4034-80ba-eaa92c9013a7.jpg': '/content/dam/best-buy-eds/top-deals/16665caa5be0a445ac53bf2d453eb588.jpg',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/43c81c30-fe0e-4da3-bf20-d9d25480def0.png': '/content/dam/best-buy-eds/top-deals/3f6e8c39da93caca5e98c34b0c89f017.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/4a21cc58-99e6-4b46-86e6-94bbd11c24b6.jpg': '/content/dam/best-buy-eds/top-deals/b1310dd9f99ab6595954767899b8b24a.jpg',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/4abf40bb-3ad7-4356-8d29-ce019d126808.jpg': '/content/dam/best-buy-eds/top-deals/9e5ca721317211bb920b8842bd9185a4.jpg',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/52e18cb7-ba0c-48fc-ab41-7750c1d77501.jpg': '/content/dam/best-buy-eds/top-deals/6037cdfed7a3023293fa761be955add7.jpg',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/5a15dbe3-3095-42b4-8558-7f52ca659ccf.png': '/content/dam/best-buy-eds/top-deals/dbeb7a1b4819cb944a80b61662a3c7a8.png',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6546/6546239cv23d.jpg': '/content/dam/best-buy-eds/top-deals/47fd84aa80d226917d9f7704dc4d942e.jpg',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/7218d7af-36f1-4cc1-b8e0-271e27dacaa2.jpg': '/content/dam/best-buy-eds/top-deals/1b8843226b45e55597249db1f243f890.jpg',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/9317c780-7739-4d12-a344-2939b0bcae66.jpg': '/content/dam/best-buy-eds/top-deals/ccd82573f4f38b8b13d15ad1e0da7467.jpg',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/b0ea8e3a-408c-4c69-b5a9-0812194a8f51.jpg': '/content/dam/best-buy-eds/top-deals/fcd6b17827d7aaa4e27fdb0aaaade7c6.jpg',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/b87a16c2-7d36-48ae-8b2c-4f4e6c818bf8.jpg': '/content/dam/best-buy-eds/top-deals/c0fd8aecabce08e5737ad45256183a03.jpg',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/c046c239-8303-40fd-a967-984f0447c011.jpg': '/content/dam/best-buy-eds/top-deals/ba38cdf9833b6e9986882fe12f61bc4d.jpg',
  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/eeab4c06-d0b6-424e-81f2-df8984b8e181.jpg': '/content/dam/best-buy-eds/top-deals/d19798c1081de026626ef7b6410456e2.jpg',
};

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

function baseUrl(u) {
  if (!u) return u;
  return u.split(';')[0].split('?')[0];
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  // Rewrite <img src>
  element.querySelectorAll('img[src]').forEach((img) => {
    const media = IMAGE_MAP[baseUrl(img.getAttribute('src'))];
    if (media) img.setAttribute('src', media);
  });

  // Rewrite any <source srcset> that points at the CDN (defensive; parsers emit <img>)
  element.querySelectorAll('source[srcset]').forEach((src) => {
    const media = IMAGE_MAP[baseUrl(src.getAttribute('srcset'))];
    if (media) src.setAttribute('srcset', media);
  });
}
