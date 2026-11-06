export interface DeliveryConfig {
  enabled: boolean;
  siteId: string;
  assetDimensions?: Record<string, { width: number; height: number }>;
  generatedCandidates?: Record<string, { url: string; width: number }[]>;
}

export function getAssetId(source: string): string | null {
  try {
    const url = new URL(source);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const basename = decodeURIComponent(url.pathname.split('/').pop() || '');
    return basename.match(/^([a-f\d]{24})(?=[_.-])/i)?.[1]?.toLowerCase() || null;
  } catch {
    return null;
  }
}

/** CSS pixels at 1x; srcset selection supplies DPR. Do not multiply by DPR here. */
export function calculateSourceWidth(
  clientWidth: number,
  clientHeight: number,
  boundsWidth: number,
  boundsHeight: number,
  sourceAspectRatio: number,
  zoom = 1
): number | null {
  if (
    ![clientWidth, clientHeight, boundsWidth, boundsHeight, sourceAspectRatio, zoom].every(
      (value) => Number.isFinite(value) && value > 0
    )
  )
    return null;
  const width = Math.max(clientWidth * zoom, boundsWidth);
  const height = Math.max(clientHeight * zoom, boundsHeight);
  // Avoid an extra pixel caused solely by floating point multiplication (300 * 1.1).
  return Math.ceil(Math.max(width, height * sourceAspectRatio) - 1e-9);
}

export function isDeliveryEnabled(
  config: DeliveryConfig | undefined,
  siteId: string | undefined,
  hostname: string
): config is DeliveryConfig {
  return (
    config?.enabled === true &&
    config.siteId === siteId &&
    ((siteId === '6aebef5cce0ddb61817003de' &&
      hostname === 'korowa-school-82fb20aabba676dff28b01bd4.webflow.io') ||
      (siteId === '689b9231663a4f08a91a5f03' &&
        ['www.korowa.vic.edu.au', 'korowa.vic.edu.au', 'korowa-school.webflow.io'].includes(
          hostname
        )))
  );
}

export const DELIVERY_SELECTOR = [
  'img.next-pages_card_image',
  '.info-block_image_component img.image',
  '.image-cloud_image-wrap img.image',

  'img.gallery-slider_image',
  'img.news_card_image',
].join(',');

const discoveryClasses = new Set([
  'next-pages_card_image',
  'info-block_image_component',
  'image-cloud_image-wrap',
  'image',
  'gallery-slider_image',
  'news_card_image',
]);

const originalSizes = new WeakMap<HTMLImageElement, string | null>();
const originalSrcsets = new WeakMap<
  HTMLImageElement,
  { original: string | null; supplied: string; source: string }
>();
const preparedImages = new WeakMap<
  HTMLImageElement,
  {
    config: DeliveryConfig;
    source: string;
    srcset: string | null;
    dimensions: { width: number; height: number } | undefined;
    candidates: string;
    valid: boolean;
  }
>();

function restoreImageSizes(img: HTMLImageElement): false {
  if (originalSrcsets.has(img)) {
    const saved = originalSrcsets.get(img)!;
    // An external native replacement belongs to the page, not to the helper.
    if (img.getAttribute('srcset') === saved.supplied) {
      if (saved.original === null) img.removeAttribute('srcset');
      else img.setAttribute('srcset', saved.original);
    }
    originalSrcsets.delete(img);
  }
  if (originalSizes.has(img)) {
    const original = originalSizes.get(img);
    if (original === null) img.removeAttribute('sizes');
    else if (original !== undefined) img.setAttribute('sizes', original);
    img.removeAttribute('data-korowa-original-sizes');
    originalSizes.delete(img);
  }
  return false;
}

function prepareImageUpdate(img: HTMLImageElement, config: DeliveryConfig): () => boolean {
  // Webflow responsive candidates use width descriptors. Density-only/malformed lists
  // cannot benefit from a sizes hint, so leave them alone.
  const source = img.getAttribute('src') || '';
  const saved = originalSrcsets.get(img);
  const currentSrcset = img.getAttribute('srcset');
  const retireSupplied = saved && (saved.source !== source || saved.supplied !== currentSrcset);
  // Prepare against the original fallback without writing during the read phase.
  const nativeSrcset =
    retireSupplied && currentSrcset === saved.supplied ? saved.original : currentSrcset;
  let prepared = preparedImages.get(img);
  if (
    !prepared ||
    prepared.config !== config ||
    prepared.source !== source ||
    prepared.srcset !== nativeSrcset
  ) {
    const id = getAssetId(source);
    const dimensions = id && config.assetDimensions?.[id];
    let candidates = nativeSrcset || '';
    const supplied = id && config.generatedCandidates?.[id];
    // Only use a parent-verified explicit list for a source-only image. Never invent
    // CDN suffixes or replace a native srcset, and retain an original-width option.
    if (
      !candidates.trim() &&
      dimensions &&
      supplied &&
      supplied.some((candidate) => candidate.width === dimensions.width) &&
      supplied.every(
        (candidate) =>
          Number.isInteger(candidate.width) &&
          candidate.width > 0 &&
          candidate.width <= dimensions.width &&
          /^https?:\/\/\S+$/.test(candidate.url)
      )
    ) {
      candidates = supplied
        .slice()
        .sort((a, b) => a.width - b.width)
        .map((candidate) => `${candidate.url} ${candidate.width}w`)
        .join(', ');
    }
    const valid =
      candidates
        .split(',')
        .every((candidate) => /^\s*https?:\/\/\S+\s+[1-9]\d*w\s*$/.test(candidate)) &&
      !/\.(?:avif|svg)(?:[?\s,#]|$)/i.test(candidates) &&
      !/\.(?:avif|svg)(?:[?#]|$)/i.test(source) &&
      !/framework|diagram/i.test(source) &&
      !!dimensions &&
      Number.isFinite(dimensions.width) &&
      Number.isFinite(dimensions.height) &&
      dimensions.width > 0 &&
      dimensions.height > 0;
    prepared = {
      config,
      source,
      srcset: nativeSrcset,
      dimensions: dimensions || undefined,
      candidates,
      valid,
    };
    preparedImages.set(img, prepared);
  }
  const { dimensions, candidates, valid } = prepared;
  const suppliedCandidates = !nativeSrcset?.trim() && candidates ? candidates : undefined;
  if (
    !img.matches(DELIVERY_SELECTOR) ||
    img.getAttribute('loading') !== 'lazy' ||
    !valid ||
    img.closest(
      'dialog, [hidden], [aria-hidden="true"], .image-cloud_center-image, .is-parallax, .team-member_image'
    ) ||
    (img.matches('img.news_card_image') && img.closest('.featured-news')) ||
    !img.getClientRects().length ||
    typeof img.checkVisibility !== 'function' ||
    !img.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
  )
    return () => restoreImageSizes(img);

  // Positive roles are necessary but not sufficient: reject special/animated ancestors.
  for (let element: HTMLElement | null = img; element; element = element.parentElement) {
    if (
      element.tagName === 'HEADER' ||
      /(?:^|[\s_-])(hero|header|parallax|framework|diagram|explore|full)(?:$|[\s_-])/i.test(
        element.className
      )
    )
      return () => restoreImageSizes(img);
  }
  if (!dimensions) return () => restoreImageSizes(img);
  const bounds = img.getBoundingClientRect();
  const width = calculateSourceWidth(
    img.clientWidth,
    img.clientHeight,
    bounds.width,
    bounds.height,
    dimensions.width / dimensions.height,
    img.matches('img.next-pages_card_image') ? 1.1 : 1
  );
  if (width === null) return () => restoreImageSizes(img);
  const sizes = `${width}px`;
  if (img.getAttribute('sizes') === sizes && !suppliedCandidates && !retireSupplied)
    return () => true;
  return () => {
    if (retireSupplied) originalSrcsets.delete(img);
    if (!originalSizes.has(img)) {
      const original = img.getAttribute('sizes');
      originalSizes.set(img, original);
      img.setAttribute('data-korowa-original-sizes', original ?? '(absent)');
    }
    img.setAttribute('sizes', sizes);
    // Set the slot hint first so adding candidates cannot initiate a full-width fetch.
    if (suppliedCandidates) {
      originalSrcsets.set(img, { original: nativeSrcset, supplied: suppliedCandidates, source });
      prepared.srcset = suppliedCandidates;
      img.setAttribute('srcset', suppliedCandidates);
    }
    return true;
  };
}

export function updateImageSizes(img: HTMLImageElement, config: DeliveryConfig): boolean {
  return prepareImageUpdate(img, config)();
}

type DeliveryWindow = Window &
  Pick<typeof globalThis, 'MutationObserver' | 'ResizeObserver'> & {
    KOROWA_IMAGE_DELIVERY?: DeliveryConfig;
    KOROWA_IMAGE_DELIVERY_STOP?: () => void;
  };

/** Call synchronously from the head, before Webflow ready/DOMContentLoaded. */
export function installResponsiveDelivery(
  win: DeliveryWindow,
  doc: Document
): (() => void) | undefined {
  const config = win.KOROWA_IMAGE_DELIVERY;
  if (
    !isDeliveryEnabled(config, doc.documentElement.dataset.wfSite, win.location.hostname) ||
    !win.MutationObserver ||
    !win.ResizeObserver
  )
    return;
  if (win.KOROWA_IMAGE_DELIVERY_STOP) return win.KOROWA_IMAGE_DELIVERY_STOP;
  const images = new Set<HTMLImageElement>();
  const dirty = new Set<HTMLImageElement>();
  let frame: number | undefined;
  let stopped = false;
  const applyBatch = (batch: Set<HTMLImageElement>) => {
    const updates = [...batch].map((img) => {
      if (!img.isConnected) {
        images.delete(img);
        dirty.delete(img);
        resize.unobserve(img);
        return () => restoreImageSizes(img);
      }
      return prepareImageUpdate(img, config);
    });
    updates.forEach((apply) => apply());
  };
  const schedule = () => {
    if (stopped || !dirty.size || frame !== undefined) return;
    frame = win.requestAnimationFrame(() => {
      if (stopped) return;
      frame = undefined;
      const batch = new Set(dirty);
      dirty.clear();
      applyBatch(batch);
    });
  };
  const resize = new win.ResizeObserver((entries) => {
    if (stopped) return;
    entries.forEach(({ target }) => {
      if (images.has(target as HTMLImageElement)) dirty.add(target as HTMLImageElement);
    });
    schedule();
  });
  const markAffected = (target: Node) => {
    images.forEach((img) => {
      for (let node: Node | null = img; node; node = node.parentElement) {
        if (node === target) {
          dirty.add(img);
          break;
        }
      }
    });
  };
  const scan = (node: Node, first: Set<HTMLImageElement>) => {
    if (node.nodeType !== 1) return;
    const element = node as HTMLElement;
    markAffected(node);
    const candidates = Array.from(element.querySelectorAll<HTMLImageElement>(DELIVERY_SELECTOR));
    if (element.matches(DELIVERY_SELECTOR) || images.has(element as HTMLImageElement))
      candidates.unshift(element as HTMLImageElement);
    candidates.forEach((img) => {
      if (img.closest('dialog')) {
        restoreImageSizes(img);
        return;
      }
      if (!images.has(img)) {
        images.add(img);
        resize.observe(img);
        first.add(img);
      } else dirty.add(img);
    });
  };
  const mutation = new win.MutationObserver((records) => {
    if (stopped) return;
    const first = new Set<HTMLImageElement>();
    const discoveryRoots = new Set<Node>();
    let changedChildren = false;
    records.forEach((record) => {
      if (record.type === 'childList') {
        changedChildren = true;
        record.addedNodes.forEach((node) => discoveryRoots.add(node));
      } else {
        const target = record.target as HTMLImageElement;
        const supplied = originalSrcsets.get(target);
        if (
          record.attributeName === 'srcset' &&
          supplied &&
          target.getAttribute('srcset') === supplied.supplied &&
          target.getAttribute('src') === supplied.source
        )
          return;
        // Class changes can introduce a new approved role. Other attributes cannot.
        if (record.attributeName === 'class') {
          const oldClasses = new Set((record.oldValue || '').split(/\s+/));
          if (
            (target.getAttribute('class') || '')
              .split(/\s+/)
              .some((name) => discoveryClasses.has(name) && !oldClasses.has(name))
          )
            discoveryRoots.add(target);
        }
        markAffected(record.target);
      }
    });
    discoveryRoots.forEach((node) => {
      for (let parent = node.parentElement; parent; parent = parent.parentElement) {
        if (discoveryRoots.has(parent)) return;
      }
      scan(node, first);
    });
    if (changedChildren)
      images.forEach((img) => {
        if (!img.isConnected) {
          restoreImageSizes(img);
          resize.unobserve(img);
          images.delete(img);
          dirty.delete(img);
          first.delete(img);
        }
      });
    // First candidates must be supplied in this observer turn, before the next paint.
    first.forEach((img) => dirty.delete(img));
    applyBatch(first);
    schedule();
  });
  // sizes/debug writes are deliberately absent, preventing observer feedback loops.
  mutation.observe(doc.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ['src', 'srcset', 'loading', 'class', 'hidden', 'style', 'aria-hidden'],
  });
  const first = new Set<HTMLImageElement>();
  scan(doc.documentElement, first);
  applyBatch(first);
  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (frame !== undefined) win.cancelAnimationFrame(frame);
    frame = undefined;
    dirty.clear();
    mutation.disconnect();
    resize.disconnect();
    images.forEach(restoreImageSizes);
    images.clear();
    // Keep the idempotent command installed. Reload to start a new page lifetime.
  };
  win.KOROWA_IMAGE_DELIVERY_STOP = stop;
  return stop;
}
