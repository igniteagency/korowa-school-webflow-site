/**
 * General Slider component
 * To create standalone sliders on the page, add swiper script and this component script to the page
 */
import type { CardsEffectOptions, SwiperOptions } from 'swiper/types';

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
    this.swiperComponents.forEach(async (swiperComponent) => {
      const swiperEl = swiperComponent.querySelector('.swiper');
      if (!swiperEl) {
        console.error('`.swiper` element not found', swiperComponent);
        return;
      }

      const slideCount = swiperEl.querySelectorAll('.swiper-slide').length;
      const slideWidth = swiperComponent.querySelector('.swiper-slide')?.clientWidth || 0;

      await window.loadCSS('https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.css');

      const navPrevButtonEl = swiperComponent.querySelector(this.NAV_PREV_BUTTON_SELECTOR);
      const navNextButtonEl = swiperComponent.querySelector(this.NAV_NEXT_BUTTON_SELECTOR);
      const paginationEl = swiperComponent.querySelector(this.PAGINATION_SELECTOR);

      let loop = swiperComponent.getAttribute(this.LOOP_ATTR) === 'true' ? true : false;
      const effect = swiperComponent.getAttribute(this.EFFECT_ATTR) || 'slide';

      const isCardsEffect = effect === 'cards';

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

      let extraConfig: Partial<SwiperOptions> = {};

      let cardsEffectConfig: SwiperOptions['cardsEffect'] = undefined;

      if (isCardsEffect) {
        cardsEffectConfig = {
          perSlideOffset: slideWidth * 0.2,
        };

        if (slideCount <= 8) {
          loop = false;
        }

        extraConfig = {
          cardsEffect: cardsEffectConfig,
          loopAddBlankSlides: true,
        };
      }

      this.swiper = new Swiper(swiperEl, {
        loop: loop,
        effect: effect,
        slidesPerView: 'auto',
        spaceBetween: 24,
        navigation: navigationConfig,
        pagination: paginationConfig,
        slideActiveClass: 'is-active',
        slidePrevClass: 'is-previous',
        slideNextClass: 'is-next',
        a11y: {
          enabled: true,
        },
        ...extraConfig,
      });
    });
  }
}

window.loadScript('https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.js', {
  name: 'swiper',
});

document.addEventListener('scriptLoaded:swiper', () => {
  new Slider();
});
