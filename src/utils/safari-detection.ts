function isSafariBrowser() {
  const ua = navigator.userAgent;
  const vendor = navigator.vendor;
  // Safari’s userAgent includes “Safari” but not “Chrome” or “Chromium”
  return (
    vendor &&
    vendor.includes('Apple') &&
    ua.includes('Safari') &&
    !ua.includes('Chrome') &&
    !ua.includes('CriOS') && // iOS Chrome
    !ua.includes('FxiOS') && // iOS Firefox
    !ua.includes('Edg')
  ); // Edge
}

export function addSafariBrowserClass() {
  if (isSafariBrowser()) {
    document.documentElement.classList.add('safari-browser');
  }
}
