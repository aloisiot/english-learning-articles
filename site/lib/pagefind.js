/**
 * Loads the Pagefind runtime in the browser.
 *
 * /pagefind/pagefind.js does not exist while Next builds — it is generated
 * afterwards, by the postbuild step, from the HTML that build produced. A
 * normal `import` would therefore fail at compile time as the bundler tries
 * to resolve a file that isn't there yet.
 *
 * Constructing the import through `new Function` hides it from the bundler
 * entirely, so the path is only resolved by the browser at runtime. This
 * works the same under Webpack and Turbopack.
 */
let pagefindPromise;

export function loadPagefind() {
  if (!pagefindPromise) {
    pagefindPromise = new Function(
      'return import("/pagefind/pagefind.js")',
    )().then(async (pagefind) => {
      await pagefind.options({ excerptLength: 25 });
      await pagefind.init();

      // init() resolves before the filter index has loaded, and a search
      // that beats it back returns an empty `filters` map — indistinguishable
      // from "this site has no filters". The search page reads that map to
      // decide which dropdowns exist, so on a cold load it would render none
      // of them and, having no reason to search again, never correct itself.
      //
      // Awaiting filters() here forces that index in before the first search
      // can run. It also warms the data the first search needs, so it costs
      // little beyond moving the wait earlier.
      await pagefind.filters();

      return pagefind;
    });
  }

  return pagefindPromise;
}
