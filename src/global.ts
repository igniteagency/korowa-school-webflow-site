import Accordions from '$components/accordions';
import Dialog from '$components/dialog';
import { generateBreadcrumbGroupParent } from '$components/dynamic-breadcrumbs';
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

window.Webflow = window.Webflow || [];
window.Webflow?.push(() => {
  const WF_IX3_CHECK_MAX_TRIES = 5;
  let wfIx3CheckTries = 0;

  function setWFIX3Global() {
    if (!window.WF_IX && wfIx3CheckTries < WF_IX3_CHECK_MAX_TRIES) {
      setTimeout(() => {
        console.debug(
          'Checking for Webflow IX3 module...',
          `Attempt ${wfIx3CheckTries}`,
          window.Webflow.require('ix3')
        );

        window.WF_IX = window.Webflow.require('ix3');
        if (window.WF_IX) {
          console.debug('Webflow IX3 globalised:', window.WF_IX);
          return;
        }

        setWFIX3Global();
      }, 500);
      wfIx3CheckTries++;
    } else {
      console.error(
        'Webflow IX3 failed to globalise after multiple attempts. Some interactions may not work as expected.'
      );
    }
  }

  setWFIX3Global();

  // Set current year on respective elements
  setCurrentYear();
  addMainElementId();
  handleExternalLinks();

  dataFunctions();

  initComponents();

  UIFunctions();
  webflowOverrides();

  miscUtils();

  loadScrollTimelineCSSPolyfill();
});

function dataFunctions() {
  generateBreadcrumbGroupParent();
}

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
