/**
 * General Slider component
 * To create standalone sliders on the page, add swiper script and this component script to the page
 */

class Slider {
  COMPONENT_SELECTOR = '[data-slider-el="component"]';
  NAV_PREV_BUTTON_SELECTOR = '[data-slider-el="nav-prev"]';
  NAV_NEXT_BUTTON_SELECTOR = '[data-slider-el="nav-next"]';
  PAGINATION_SELECTOR = '[data-slider-el="pagination"]';

  LOOP_ATTR = 'data-slider-loop';
  EFFECT_ATTR = 'data-slider-effect';

  swiperComponents: NodeListOf<HTMLElement> | [];
  swiper: Swiper | null;

  constructor() {
    this.swiperComponents = document.querySelectorAll(this.COMPONENT_SELECTOR);
    this.initSliders();
  }

  initSliders() {
    this.swiperComponents.forEach((swiperComponent) => {
      const swiperEl = swiperComponent.querySelector('.swiper');
      if (!swiperEl) {
        console.error('`.swiper` element not found', swiperComponent);
        return;
      }

      const navPrevButtonEl = swiperComponent.querySelector(this.NAV_PREV_BUTTON_SELECTOR);
      const navNextButtonEl = swiperComponent.querySelector(this.NAV_NEXT_BUTTON_SELECTOR);
      const paginationEl = swiperComponent.querySelector(this.PAGINATION_SELECTOR);

      const loop = swiperComponent.getAttribute(this.LOOP_ATTR) === 'true' ? true : false;
      const effect = swiperComponent.getAttribute(this.EFFECT_ATTR) || 'slide';

      const navigationConfig =
        navPrevButtonEl && navNextButtonEl
          ? {
              nextEl: navNextButtonEl,
              prevEl: navPrevButtonEl,
              disabledClass: 'is-disabled',
            }
          : false;

      const paginationConfig = paginationEl
        ? {
            el: paginationEl,
            clickable: true,
            bulletClass: 'slider_pagination-bullet',
            bulletActiveClass: 'is-active',
            renderBullet: (index: number, className: string) => {
              return `<button class="${className}" aria-label="Go to slide ${index + 1}"></button>`;
            },
          }
        : false;

      let cardsEffectConfig = {};
      if (effect === 'cards') {
        const cardWidth = swiperComponent.querySelector('.swiper-slide')?.clientWidth || 0;
        const perSlideOffset = cardWidth * 0.7;

        cardsEffectConfig = {
          perSlideOffset: perSlideOffset,
        };
      }

      this.swiper = new Swiper(swiperEl, {
        loop: loop,
        effect: effect,
        spaceBetween: 24,
        slidesPerView: 'auto',
        navigation: navigationConfig,
        pagination: paginationConfig,
        slideActiveClass: 'is-active',
        slidePrevClass: 'is-previous',
        slideNextClass: 'is-next',
        a11y: {
          enabled: true,
        },
      });
    });
  }

  loadStyle(effect: string) {
    if ('cards' === effect) {
      this.loadCSS('https://cdn.jsdelivr.net/npm/swiper@12.0.2/modules/effect-cards.min.css');
    }
  }

  loadCSS(href: string) {
    if (document.querySelector(`link[href="${href}"]`)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
}

document.addEventListener('scriptLoaded:swiper', () => {
  new Slider();
});
