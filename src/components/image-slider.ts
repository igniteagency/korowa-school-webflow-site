/**
 * Image Slider Component
 * Creates a curved arc-based draggable slider using GSAP
 * To use: add GSAP script and this component script to the page
 */
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(MotionPathPlugin, Draggable);

interface ImageSliderOptions {
  path: string | SVGPathElement;
  stage: HTMLElement;
  cards: HTMLElement[];
  spacingPx?: number;
  keepUpright?: boolean;
  clampEnds?: boolean;
}

class ImageSlider {
  COMPONENT_SELECTOR = '[data-image-slider-el="component"]';
  STAGE_SELECTOR = '[data-image-slider-el="stage"]';
  CARD_SELECTOR = '[data-image-slider-el="card"]';
  PATH_SELECTOR = '[data-image-slider-el="path"]';

  components: NodeListOf<HTMLElement> | [];
  carousels: Map<HTMLElement, ReturnType<typeof this.createArcCarousel>>;

  constructor() {
    this.components = document.querySelectorAll(this.COMPONENT_SELECTOR);
    this.carousels = new Map();
    this.initSliders();
  }

  initSliders() {
    this.components.forEach(async (component) => {
      const stage = component.querySelector<HTMLElement>(this.STAGE_SELECTOR);
      const pathEl = component.querySelector<SVGPathElement>(this.PATH_SELECTOR);
      const cards = Array.from(component.querySelectorAll<HTMLElement>(this.CARD_SELECTOR));

      if (!stage) {
        console.error('Stage element not found', component);
        return;
      }

      if (!pathEl) {
        console.error('Path element not found', component);
        return;
      }

      if (cards.length === 0) {
        console.error('No card elements found', component);
        return;
      }

      // Create the carousel
      const carousel = this.createArcCarousel({
        path: pathEl,
        stage,
        cards,
        spacingPx: 360,
        keepUpright: true,
        clampEnds: true,
      });

      this.carousels.set(component, carousel);

      // Handle resize
      let resizeTimeout: number;
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = window.setTimeout(() => {
          carousel.relayout();
        }, 50);
      };

      window.addEventListener('resize', handleResize);
    });
  }

  createArcCarousel({
    path,
    stage,
    cards,
    spacingPx = 320,
    keepUpright = true,
    clampEnds = true,
  }: ImageSliderOptions) {
    const pathEl = typeof path === 'string' ? document.querySelector<SVGPathElement>(path)! : path;
    const totalLen = pathEl.getTotalLength();

    // Start at 35% along the path
    let progressPx = totalLen * 0.35;

    // Snapping helpers
    const snapPx = gsap.utils.snap(spacingPx);
    const indexToPx = (i: number) => progressPx + i * spacingPx;

    /**
     * Position a single card along the path at a given length
     */
    const placeCard = (card: HTMLElement, arcLength: number) => {
      // Clamp or wrap
      let s = clampEnds ? gsap.utils.clamp(0, totalLen, arcLength) : arcLength;
      // Convert arc length to normalized progress for MotionPath
      const progress = gsap.utils.clamp(0, 1, s / totalLen);

      gsap.set(card, {
        motionPath: {
          path: pathEl,
          align: pathEl,
          alignOrigin: [0.5, 0.5],
          start: progress,
        },
        rotation: keepUpright ? 0 : undefined,
      });

      if (keepUpright) {
        // Counter-rotate to cancel the tangent rotation applied by align
        const pt = pathEl.getPointAtLength(s);
        const ptAhead = pathEl.getPointAtLength(Math.min(totalLen, s + 1));
        const tangent = (Math.atan2(ptAhead.y - pt.y, ptAhead.x - pt.x) * 180) / Math.PI;
        gsap.set(card, { rotate: -tangent });
      }
    };

    /**
     * Layout all cards for the current progress
     */
    const layout = () => {
      cards.forEach((card, i) => {
        const L = indexToPx(i);
        placeCard(card, L);

        // // Fade/scale at ends
        // const dist = Math.abs(i);
        // gsap.set(card, {
        //   opacity: 1 - Math.max(0, dist - 1) * 0.25,
        //   scale: 1 - Math.min(1, Math.abs(i) * 0.06),
        //   zIndex: 1000 - Math.round(Math.abs(i) * 10),
        // });

        // A11y: hide very distant cards from screen readers
        card.setAttribute('aria-hidden', Math.abs(i) > 5 ? 'true' : 'false');
      });
    };

    // Initial layout
    layout();

    // Draggable proxy: drag an invisible element's x property
    const proxy = document.createElement('div');
    gsap.set(proxy, { x: progressPx });

    const updateFromProxy = () => {
      progressPx = gsap.getProperty(proxy, 'x') as number;
      layout();
    };

    const snapToNearest = () => {
      const snapped = snapPx(progressPx);
      gsap.to(proxy, {
        duration: 0.35,
        x: snapped,
        onUpdate: updateFromProxy,
        ease: 'power2.out',
      });
    };

    Draggable.create(proxy, {
      type: 'x',
      trigger: stage,
      bounds: clampEnds ? { minX: 0, maxX: totalLen } : undefined,
      onDrag: updateFromProxy,
      onThrowUpdate: updateFromProxy,
      onRelease: snapToNearest,
      onThrowComplete: snapToNearest,
    });

    // Navigation helpers
    const step = () => spacingPx;

    const next = () =>
      gsap.to(proxy, {
        x: `+=${step()}`,
        duration: 0.35,
        ease: 'power2.out',
        onUpdate: updateFromProxy,
      });

    const prev = () =>
      gsap.to(proxy, {
        x: `-=${step()}`,
        duration: 0.35,
        ease: 'power2.out',
        onUpdate: updateFromProxy,
      });

    return { next, prev, relayout: layout };
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
  ]).then(() => {
    new ImageSlider();
  });
});
