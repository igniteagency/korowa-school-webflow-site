function videoLightboxAutoplay() {
  const triggerList = document.querySelectorAll('[data-video-lightbox-trigger]');

  triggerList.forEach((triggerEl) => {
    const scriptEl = triggerEl.querySelector('script.w-json[type="application/json"]');
    if (!scriptEl) return console.warn('Lightbox JSON script not found');

    const data = JSON.parse(scriptEl.textContent || '{}');
    if (!data.items) return;

    for (const item of data.items) {
      for (const key in item) {
        if (!['url', 'html'].includes(key)) continue; // only apply to these two
        let val = item[key];
        if (typeof val !== 'string') continue;

        // add autoplay=1 to URLs
        if (/(https?:)?\/\//.test(val) && !val.includes('autoplay=')) {
          val += (val.includes('?') ? '&' : '?') + 'autoplay=1';
        }

        // also patch iframe src inside HTML strings
        val = val.replace(/(<iframe[^>]+src="[^"]+)/g, (m) =>
          m.includes('autoplay=') ? m : m + (m.includes('?') ? '&' : '?') + 'autoplay=1'
        );

        item[key] = val;
      }
    }
    scriptEl.textContent = JSON.stringify(data);
  });
}

export function initVideoLightbox() {
  videoLightboxAutoplay();
}
