import Accordions from '$components/accordions';
import Dialog from '$components/dialog';
import NavMenu from '$components/nav/menu';
import { navbarScrollToggle } from '$components/nav/scroll';
import { initVideoLightbox } from '$components/video-lightbox';
import { setCurrentYear } from '$utils/current-year';
import '$utils/disable-webflow-scroll';
import { disableWebflowAnchorSmoothScroll } from '$utils/disable-webflow-scroll';
import handleExternalLinks from '$utils/external-link';
import addMainElementId from '$utils/main-element-id';
import { duplicateMarqueeList } from '$utils/marquee-list';
import { addSafariBrowserClass } from '$utils/safari-detection';

gsap.registerPlugin(ScrollTrigger);

window.Webflow = window.Webflow || [];
window.Webflow?.push(() => {
  setTimeout(() => {
    window.WF_IX = Webflow.require('ix3');
    console.debug('Webflow IX3 globalised:', window.WF_IX);
  }, 100);

  // Set current year on respective elements
  setCurrentYear();
  addMainElementId();
  handleExternalLinks();

  initComponents();

  UIFunctions();
  webflowOverrides();

  miscUtils();

  loadScrollTimelineCSSPolyfill();
});

function initComponents() {
  new NavMenu();
  new Dialog();
}

function UIFunctions() {
  navbarScrollToggle();

  duplicateMarqueeList();
  new Accordions();

  initVideoLightbox();

  // Counter Loader
  window.conditionalLoadScript('[data-el="counter"]', 'components/counter.js');
}

function webflowOverrides() {
  disableWebflowAnchorSmoothScroll();
}

function miscUtils() {
  addSafariBrowserClass();
}

function loadScrollTimelineCSSPolyfill() {
  window.loadScript('https://flackr.github.io/scroll-timeline/dist/scroll-timeline.js');
}
