import { animatedDetailsAccordions } from '$components/accordions';
import '$components/dialog';
import { setCurrentYear } from '$utils/current-year';
import '$utils/disable-webflow-scroll';
import { disableWebflowAnchorSmoothScroll } from '$utils/disable-webflow-scroll';
import handleExternalLinks from '$utils/external-link';
import addMainElementId from '$utils/main-element-id';
import { duplicateMarqueeList } from '$utils/marquee-list';

gsap.registerPlugin(ScrollTrigger);

window.Webflow = window.Webflow || [];
window.Webflow?.push(() => {
  window.WF_IX = window.Webflow?.require('ix3');

  // Set current year on respective elements
  setCurrentYear();
  addMainElementId();
  handleExternalLinks();

  UIFunctions();
  webflowOverrides();
});

function UIFunctions() {
  duplicateMarqueeList();
  animatedDetailsAccordions();
}

function webflowOverrides() {
  disableWebflowAnchorSmoothScroll();
}
