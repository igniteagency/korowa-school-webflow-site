import { installResponsiveDelivery } from '$utils/responsive-delivery';

// Independent head component: intentionally not queued on Webflow or imported by global.ts.
installResponsiveDelivery(window, document);
