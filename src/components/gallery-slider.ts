/**
 * Gallery Slider Component
 * Creates a curved arc-based draggable slider using GSAP
 * To use: add GSAP script and this component script to the page
 */
import type { Draggable } from 'gsap/Draggable';
import type { InertiaPlugin } from 'gsap/InertiaPlugin';
import type { MotionPathPlugin } from 'gsap/MotionPathPlugin';

import { horizontalLoop } from '$utils/gsap-draggable-carousel';

class GallerySlider {
  COMPONENT_SELECTOR = '[data-gallery-slider-el="component"]';
  LIST_SELECTOR = '[data-gallery-slider-el="list"]';
  CARD_SELECTOR = '[data-gallery-slider-el="card"]';
  PATH_SELECTOR = '[data-gallery-slider-el="path"]';

  ACTIVE_CLASSNAME = 'is-active';

  components: NodeListOf<HTMLElement> | [];
  carousels: Map<HTMLElement, ReturnType<typeof this.createArcCarousel>>;

  constructor() {
    this.components = document.querySelectorAll(this.COMPONENT_SELECTOR);
    this.carousels = new Map();
    this.initSliders();
  }

  initSliders() {
    this.components.forEach(async (component) => {
      const listEl = component.querySelector(this.LIST_SELECTOR);
      const cards = Array.from(component.querySelectorAll(this.CARD_SELECTOR));

      if (!listEl) {
        console.error('[Gallery Slider] List element not found', component);
        return;
      }

      if (cards.length === 0) {
        console.error('[Gallery Slider] No card elements found', component);
        return;
      }
      let activeElement;
      const loop = horizontalLoop(cards, {
        paused: true,
        draggable: true,
        center: true,
        onChange: (element, index) => {
          // when the active element changes, this function gets called.
          activeElement && activeElement.classList.remove(this.ACTIVE_CLASSNAME);
          element.classList.add(this.ACTIVE_CLASSNAME);
          activeElement = element;
        },
      });
    });
  }
}

// Load GSAP and initialize when ready
window.loadScript('https://cdn.prod.website-files.com/gsap/3.13.0/gsap.min.js', {
  name: 'gsap',
});

document.addEventListener('scriptLoaded:gsap', () => {
  // Load GSAP plugins
  Promise.all([
    window.loadScript('https://cdn.prod.website-files.com/gsap/3.13.0/MotionPathPlugin.min.js', {
      name: 'gsap-motionpath',
    }),
    window.loadScript('https://cdn.prod.website-files.com/gsap/3.13.0/Draggable.min.js', {
      name: 'gsap-draggable',
    }),
    window.loadScript('https://cdn.prod.website-files.com/gsap/3.13.0/InertiaPlugin.min.js', {
      name: 'gsap-inertia',
    }),
  ]).then(() => {
    new GallerySlider();
  });
});
