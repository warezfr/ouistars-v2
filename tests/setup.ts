/** Setup commun — polyfills jsdom pour les composants (no-op en env node). */
if (typeof window !== 'undefined') {
  // IntersectionObserver (composant Reveal) : tout est immédiatement visible.
  class IO {
    private cb: IntersectionObserverCallback;
    constructor(cb: IntersectionObserverCallback) { this.cb = cb; }
    observe(el: Element) {
      this.cb([{ isIntersecting: true, target: el } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    unobserve() {} disconnect() {} takeRecords() { return []; }
    root = null; rootMargin = ''; thresholds = [];
  }
  // @ts-expect-error polyfill jsdom
  window.IntersectionObserver = window.IntersectionObserver ?? IO;

  // matchMedia (useAutoScroll, prefers-reduced-motion) : réduit les animations
  // en test → les rails auto ne défilent pas, rendu déterministe.
  window.matchMedia = window.matchMedia ?? ((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {},
    dispatchEvent() { return false; },
  } as MediaQueryList));

  window.scrollTo = window.scrollTo ?? (() => {});
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});
}
