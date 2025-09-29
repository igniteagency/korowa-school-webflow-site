/**
 * Injects the BugHerd script only on webflow.io staging domains
 */
function initBugHerd() {
  const siteAPIKey = '8dve1mmxxsxynfkbvgaegq';

  // Only load on webflow.io domains
  if (window.location.hostname.includes('webflow.io')) {
    window
      .loadScript(`https://www.bugherd.com/sidebarv2.js?apikey=${siteAPIKey}`)
      .then(() => {
        console.log('BugHerd script loaded successfully');
      })
      .catch((error) => {
        console.error('Failed to load BugHerd script:', error);
      });
  }
}

window.addEventListener('load', () => {
  initBugHerd();
});
