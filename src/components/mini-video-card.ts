import { convertVideoToEmbedUrl } from '$utils/video-url-converter';

export function miniVideoCardLightbox() {
  const componentList = document.querySelectorAll('[data-el="mini-video-card"]');

  componentList.forEach((componentEl) => {
    const dialogEl = componentEl?.querySelector('dialog');
    const iframeWrapperEl = componentEl?.querySelector('[data-video-src]');
    const iframeEl = iframeWrapperEl?.querySelector<HTMLIFrameElement>('iframe');

    if (!dialogEl || !iframeWrapperEl || !iframeEl) return;

    const videoSrc = iframeWrapperEl.getAttribute('data-video-src');
    if (!videoSrc) return;

    const embedUrl = convertVideoToEmbedUrl(videoSrc);

    const isYoutube = embedUrl.includes('youtube.com');
    const isVimeo = embedUrl.includes('vimeo.com');

    // Load video after page is fully loaded to avoid impacting performance
    window.addEventListener('load', () => {
      let videoSrcWithApi: string;
      if (embedUrl.includes('youtube.com')) {
        // Minimal YouTube: no related videos, no branding, custom controls
        videoSrcWithApi = `${embedUrl}?enablejsapi=1&controls=0&rel=0&modestbranding=1&showinfo=0&fs=1`;
      } else if (embedUrl.includes('vimeo.com')) {
        // Minimal Vimeo: clean player with only play/pause and fullscreen
        videoSrcWithApi = `${embedUrl}?api=1&controls=0&byline=0&portrait=0&title=0&background=1`;
      } else {
        videoSrcWithApi = embedUrl;
      }

      iframeEl.setAttribute('src', videoSrcWithApi);
    });

    dialogEl.addEventListener('dialogOpen', () => {
      // Play video programmatically
      if (isYoutube) {
        iframeEl.contentWindow?.postMessage(
          '{"event":"command","func":"playVideo","args":""}',
          '*'
        );
      } else if (isVimeo) {
        iframeEl.contentWindow?.postMessage('{"method":"play"}', '*');
      }
    });

    dialogEl.addEventListener('dialogClose', () => {
      // Pause video programmatically
      if (isYoutube) {
        iframeEl.contentWindow?.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}',
          '*'
        );
      } else if (isVimeo) {
        iframeEl.contentWindow?.postMessage('{"method":"pause"}', '*');
      }
    });
  });
}
