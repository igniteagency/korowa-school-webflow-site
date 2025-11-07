/**
 * Gallery Slider Component
 * Creates a curved arc-based draggable slider using GSAP
 * To use: add GSAP script and this component script to the page
 */
import { horizontalLoop } from '$utils/gsap-draggable-carousel';

class GallerySlider {
  COMPONENT_SELECTOR = '[data-gallery-slider-el="component"]';
  LIST_SELECTOR = '[data-gallery-slider-el="list"]';
  CARD_SELECTOR = '[data-gallery-slider-el="card"]';
  PATH_SELECTOR = '[data-gallery-slider-el="path"]';

  DIALOG_IMAGE_LIST_SELECTOR = '[data-gallery-slider-el="dialog-image-list"]';
  DIALOG_IMAGE_ITEM_SELECTOR = '[data-gallery-slider-el="dialog-image-item"]';
  DIALOG_IMAGE_PREV_BUTTON_SELECTOR = '[data-gallery-slider-el="dialog-image-prev"]';
  DIALOG_IMAGE_NEXT_BUTTON_SELECTOR = '[data-gallery-slider-el="dialog-image-next"]';

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
        curve: {
          yPercent: 35,
          rotation: 12,
        },
        onChange: (element, index) => {
          // when the active element changes, this function gets called.
          activeElement && activeElement.classList.remove(this.ACTIVE_CLASSNAME);
          element.classList.add(this.ACTIVE_CLASSNAME);
          activeElement = element;
        },
      });

      cards.forEach((card) => {
        this.setDialogImageSlider(card);
      });
    });
  }

  setDialogImageSlider(card: HTMLElement) {
    const imageList = card.querySelector(this.DIALOG_IMAGE_LIST_SELECTOR);
    if (!imageList) {
      console.warn('[Gallery Slider] Dialog image list not found', card);
      return;
    }

    const imageItems = Array.from(
      imageList.querySelectorAll(this.DIALOG_IMAGE_ITEM_SELECTOR)
    ) as HTMLElement[];
    const imagesCount = imageItems.length;
    if (imagesCount === 0) {
      return;
    }

    const prevButton = card.querySelector(this.DIALOG_IMAGE_PREV_BUTTON_SELECTOR);
    const nextButton = card.querySelector(this.DIALOG_IMAGE_NEXT_BUTTON_SELECTOR);

    let currentIndex = 0;

    const showImageAtIndex = (index: number) => {
      // fade images in and out using gsap
      imageItems.forEach((item, i) => {
        if (i === index) {
          gsap.to(item, { autoAlpha: 1, duration: 0.3 });
        } else {
          gsap.to(item, { autoAlpha: 0, duration: 0.3 });
        }
      });
    };
    showImageAtIndex(currentIndex);

    prevButton?.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + imagesCount) % imagesCount;
      showImageAtIndex(currentIndex);
    });

    nextButton?.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % imagesCount;
      showImageAtIndex(currentIndex);
    });
  }
}

// Load GSAP and initialize when ready
window.loadScript('https://cdn.prod.website-files.com/gsap/3.13.0/gsap.min.js', {
  name: 'gsap',
});

window.Webflow ||= [];
window.Webflow?.push(() => {
  // document.addEventListener('scriptLoaded:gsap', () => {
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
