/**
 * Timeline Slider Component
 * Creates a curved elliptical timeline slider for historical events
 * To use: add swiper script and this component script to the page
 */
import type { SwiperOptions } from 'swiper/types';

class TimelineSlider {
  COMPONENT_SELECTOR = '[data-timeline-slider-el="component"]';
  NAV_PREV_BUTTON_SELECTOR = '[data-slider-el="nav-prev"]';
  NAV_NEXT_BUTTON_SELECTOR = '[data-slider-el="nav-next"]';
  CARD_SELECTOR = '[data-timeline-slider-el="card"]';

  swiperComponents: NodeListOf<HTMLElement> | [];
  swiper!: Swiper;
  rafId: number | null = null;

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

      await window.loadCSS('https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.css');

      const navPrevButtonEl = swiperComponent.querySelector(this.NAV_PREV_BUTTON_SELECTOR);
      const navNextButtonEl = swiperComponent.querySelector(this.NAV_NEXT_BUTTON_SELECTOR);

      const navigationConfig =
        navPrevButtonEl && navNextButtonEl
          ? {
              nextEl: navNextButtonEl,
              prevEl: navPrevButtonEl,
              disabledClass: 'is-disabled',
            }
          : false;

      const slideCount = swiperEl.querySelectorAll('.swiper-slide').length;

      // Triple the slides for efficient looping if 8 or less slides
      const slidesWrapper = swiperEl.querySelector('.swiper-wrapper');
      if (slidesWrapper) {
        const originalSlides = slidesWrapper.innerHTML;
        if (slideCount <= 5) {
          slidesWrapper.innerHTML = originalSlides.repeat(3);
        } else if (slideCount <= 8) {
          slidesWrapper.innerHTML = originalSlides.repeat(2);
        }
      }

      const swiperConfig: SwiperOptions = {
        slidesPerView: 'auto',
        centeredSlides: true,
        spaceBetween: 0,
        loop: slideCount > 1,
        speed: 800,
        grabCursor: true,
        navigation: navigationConfig,
        slideActiveClass: 'is-active',
        slidePrevClass: 'is-previous',
        slideNextClass: 'is-next',
        watchSlidesProgress: true,
        a11y: {
          enabled: true,
        },
        on: {
          init: (swiper) => {
            this.updateSlidePositions(swiper);
          },
          transitionStart: (swiper) => {
            this.startRAF(swiper);
          },
          progress: (swiper) => {
            this.updateSlidePositions(swiper);
          },
          transitionEnd: (swiper) => {
            this.stopRAF();
            this.updateSlidePositions(swiper);
          },
        },
      };

      this.swiper = new Swiper(swiperEl, swiperConfig);
    });
  }

  startRAF(swiper: any) {
    // Cancel any existing RAF loop
    this.stopRAF();

    // Start new RAF loop
    const animate = () => {
      this.updateSlidePositions(swiper);
      this.rafId = requestAnimationFrame(animate);
    };

    this.rafId = requestAnimationFrame(animate);
  }

  stopRAF() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Updates slide positions along a circular curve
   * @param swiper - Swiper instance
   */
  updateSlidePositions(swiper: any) {
    const { slides } = swiper;

    // Circle geometry: 350vw diameter = 175vw radius
    const radius = window.innerWidth * 1.75;
    const centerX = window.innerWidth * 0.5;

    slides.forEach((slide: any) => {
      const slideEl = slide as HTMLElement;
      const cardEl = slideEl.querySelector(this.CARD_SELECTOR) as HTMLElement;
      if (!cardEl) return;

      const rect = slideEl.getBoundingClientRect();
      const slideCenterX = rect.left + rect.width * 0.5;

      // Horizontal distance from viewport center
      const x = slideCenterX - centerX;

      // Circle equation: y = radius - sqrt(radius² - x²)
      // This gives us the vertical drop from the top of the circle
      const radiusSquared = radius * radius;
      const xSquared = x * x;
      const translateY = radius - Math.sqrt(radiusSquared - xSquared);

      // Rotation: tangent to the circle at this point
      // angle = arcsin(x / radius), convert to degrees
      // Flip the sign to match your design
      const angleRad = Math.asin(x / radius);
      const rotationDeg = (angleRad * 180) / Math.PI;

      // Apply transform (disable transitions for immediate updates)
      cardEl.style.transform = `translate3d(0, ${translateY}px, 0) rotate(${rotationDeg}deg)`;
    });
  }
}

window.loadScript('https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.js', {
  name: 'swiper',
});

document.addEventListener('scriptLoaded:swiper', () => {
  new TimelineSlider();
});
