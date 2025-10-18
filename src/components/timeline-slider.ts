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

  // Curve configuration attributes
  CURVE_INTENSITY_ATTR = 'data-timeline-curve-intensity'; // Default: 80
  CURVE_WIDTH_ATTR = 'data-timeline-curve-width'; // Default: 200
  ROTATION_ENABLED_ATTR = 'data-timeline-rotation'; // Default: true

  swiperComponents: NodeListOf<HTMLElement> | [];
  swiper: Swiper | null;

  constructor() {
    this.swiperComponents = document.querySelectorAll(this.COMPONENT_SELECTOR);
    this.initSliders();
  }

  initSliders() {
    this.swiperComponents.forEach(async (swiperComponent) => {
      const swiperEl = swiperComponent;
      if (!swiperEl) {
        console.error('`.swiper` element not found', swiperComponent);
        return;
      }

      await window.loadCSS('https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.css');

      const navPrevButtonEl = swiperComponent.querySelector(this.NAV_PREV_BUTTON_SELECTOR);
      const navNextButtonEl = swiperComponent.querySelector(this.NAV_NEXT_BUTTON_SELECTOR);

      // Get curve configuration from data attributes
      const curveIntensity = parseInt(
        swiperComponent.getAttribute(this.CURVE_INTENSITY_ATTR) || '80'
      );
      const curveWidth = parseInt(swiperComponent.getAttribute(this.CURVE_WIDTH_ATTR) || '200');
      const rotationEnabled = swiperComponent.getAttribute(this.ROTATION_ENABLED_ATTR) !== 'false';

      const navigationConfig =
        navPrevButtonEl && navNextButtonEl
          ? {
              nextEl: navNextButtonEl,
              prevEl: navPrevButtonEl,
              disabledClass: 'is-disabled',
            }
          : false;

      const swiperConfig: SwiperOptions = {
        slidesPerView: 'auto',
        centeredSlides: true,
        spaceBetween: 60,
        loop: true,
        speed: 800,
        grabCursor: true,
        navigation: navigationConfig,
        slideActiveClass: 'is-active',
        slidePrevClass: 'is-previous',
        slideNextClass: 'is-next',
        a11y: {
          enabled: true,
        },
        breakpoints: {
          320: {
            spaceBetween: 30,
          },
          768: {
            spaceBetween: 40,
          },
          1024: {
            spaceBetween: 60,
          },
        },
        on: {
          init: (swiper) => {
            this.updateSlidePositions(swiper, curveIntensity, curveWidth, rotationEnabled);
          },
          progress: (swiper) => {
            this.updateSlidePositions(swiper, curveIntensity, curveWidth, rotationEnabled);
          },
          setTransition: (swiper, transition) => {
            swiper.slides.forEach((slide) => {
              const slideEl = slide as HTMLElement;
              slideEl.style.transition = `${transition}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            });
          },
        },
      };

      this.swiper = new Swiper(swiperEl, swiperConfig);
    });
  }

  /**
   * Updates slide positions along an elliptical curve
   * @param swiper - Swiper instance
   * @param verticalRadius - Vertical radius of the ellipse (curve height)
   * @param horizontalRadius - Horizontal radius of the ellipse (curve width)
   * @param enableRotation - Whether to rotate slides along the curve
   */
  updateSlidePositions(
    swiper: Swiper,
    verticalRadius: number,
    horizontalRadius: number,
    enableRotation: boolean
  ) {
    swiper.slides.forEach((slide, index) => {
      const slideEl = slide as HTMLElement;
      const slideProgress = (slideEl as any).progress || 0;

      // Elliptical path parameters
      const a = horizontalRadius; // Horizontal radius
      const b = verticalRadius; // Vertical radius

      // Calculate position on ellipse
      // Angle spread controls how much the slides curve (0.4 = moderate curve)
      const angle = slideProgress * 0.4;
      const x = a * Math.sin(angle);
      const y = -b * Math.cos(angle) + b; // Offset to bottom of curve

      // Rotation follows the tangent of the ellipse
      let rotation = 0;
      if (enableRotation) {
        rotation = Math.atan2(a * Math.cos(angle), b * Math.sin(angle)) * (180 / Math.PI) - 90; // -90 to adjust orientation
      }

      // Apply transforms for curve positioning
      slideEl.style.transform = `
        translate3d(${x}px, ${y}px, 0)
        rotate(${rotation}deg)
      `;

      // Scale effect for depth perception
      const scale = 1 - Math.abs(slideProgress) * 0.15;
      const opacity = 1 - Math.abs(slideProgress) * 0.3;

      slideEl.style.opacity = Math.max(opacity, 0.5).toString();

      // Apply scale to inner card if it exists
      const cardEl = slideEl.querySelector('[data-timeline-slider-el="card"]') as HTMLElement;
      if (cardEl) {
        cardEl.style.transform = `scale(${Math.max(scale, 0.85)})`;
        cardEl.style.transition = 'transform 800ms cubic-bezier(0.4, 0, 0.2, 1)';
      }
    });
  }
}

window.loadScript('https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.js', {
  name: 'swiper',
});

document.addEventListener('scriptLoaded:swiper', () => {
  new TimelineSlider();
});
