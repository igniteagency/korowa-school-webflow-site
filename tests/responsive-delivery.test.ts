import { describe, expect, test } from 'bun:test';

import {
  calculateSourceWidth,
  getAssetId,
  isDeliveryEnabled,
  installResponsiveDelivery,
  updateImageSizes,
} from '../src/utils/responsive-delivery';
import { ElementDouble, ObserverDouble } from './dom';

const siteId = '6aebef5cce0ddb61817003de';
const hostname = 'korowa-school-82fb20aabba676dff28b01bd4.webflow.io';

describe('backup opt-in', () => {
  test('requires enabled, the approved host and the exact backup site ID', () => {
    expect(isDeliveryEnabled({ enabled: true, siteId }, siteId, hostname)).toBe(true);
    expect(isDeliveryEnabled(undefined, siteId, hostname)).toBe(false);
    expect(isDeliveryEnabled({ enabled: false, siteId }, siteId, hostname)).toBe(false);
    expect(isDeliveryEnabled({ enabled: true, siteId }, siteId, 'www.korowa.vic.edu.au')).toBe(
      false
    );
    expect(isDeliveryEnabled({ enabled: true, siteId }, '689b9231663a4f08a91a5f03', hostname)).toBe(
      false
    );
    expect(isDeliveryEnabled({ enabled: true, siteId: 'other' }, 'other', hostname)).toBe(false);
  });
});

describe('production opt-in', () => {
  const productionSiteId = '689b9231663a4f08a91a5f03';
  const productionHosts = [
    'www.korowa.vic.edu.au',
    'korowa.vic.edu.au',
    'korowa-school.webflow.io',
  ];

  test.each(productionHosts)('allows the exact production site on %s', (productionHost) => {
    expect(
      isDeliveryEnabled(
        { enabled: true, siteId: productionSiteId },
        productionSiteId,
        productionHost
      )
    ).toBe(true);
  });

  test('requires explicit true and matching config/document site IDs on every approved host', () => {
    for (const [approvedSiteId, approvedHost] of [
      [siteId, hostname],
      ...productionHosts.map((host) => [productionSiteId, host]),
    ]) {
      expect(isDeliveryEnabled(undefined, approvedSiteId, approvedHost)).toBe(false);
      for (const enabled of [false, undefined, null, 1, 'true']) {
        expect(
          isDeliveryEnabled(
            { enabled, siteId: approvedSiteId } as any,
            approvedSiteId,
            approvedHost
          )
        ).toBe(false);
      }
      for (const otherSiteId of [undefined, '', 'other', siteId, productionSiteId]) {
        if (otherSiteId === approvedSiteId) continue;
        expect(
          isDeliveryEnabled({ enabled: true, siteId: approvedSiteId }, otherSiteId, approvedHost)
        ).toBe(false);
        expect(
          isDeliveryEnabled(
            { enabled: true, siteId: otherSiteId } as any,
            approvedSiteId,
            approvedHost
          )
        ).toBe(false);
      }
    }
  });

  test('rejects cross-site and unknown hosts even when config supplies a host list', () => {
    for (const [configSiteId, deniedHosts] of [
      [siteId, productionHosts],
      [productionSiteId, [hostname]],
      ['other', [hostname, ...productionHosts]],
    ] as const) {
      for (const deniedHost of [
        ...deniedHosts,
        '',
        'localhost',
        'other.webflow.io',
        'www.korowa.vic.edu.au.attacker.test',
        'korowa-school.webflow.io.attacker.test',
      ]) {
        const settings = { enabled: true, siteId: configSiteId, hosts: [deniedHost] };
        expect(isDeliveryEnabled(settings, configSiteId, deniedHost)).toBe(false);
      }
    }
  });
});

test('uses the file ID at the start of the decoded basename, never a folder ID', () => {
  const file = '1234567890abcdef12345678';
  expect(getAssetId(`https://cdn.test/${siteId}/${file}_photo-p-800.webp?x=1`)).toBe(file);
  expect(getAssetId(`https://cdn.test/${siteId}/%31${file.slice(1)}_photo.jpg`)).toBe(file);
  expect(getAssetId(`https://cdn.test/${siteId}/photo_${file}.jpg`)).toBeNull();
  expect(getAssetId(`https://cdn.test/${siteId}/${file}a_photo.jpg`)).toBeNull();
  expect(getAssetId('data:image/png;base64,anything')).toBeNull();
  expect(getAssetId('https://cdn.test/%ZZ')).toBeNull();
});

test('cover sizing uses source ratio, unscaled client size, transformed bounds and maximum zoom once', () => {
  expect(calculateSourceWidth(300, 300, 270, 270, 2, 1.1)).toBe(660);
  expect(calculateSourceWidth(300, 200, 330, 220, 1, 1.1)).toBe(330);
  expect(calculateSourceWidth(300, 200, 450, 300, 2, 1.1)).toBe(600);
  expect(calculateSourceWidth(300, 100, 300, 100, 0.5, 1)).toBe(300);
  expect(calculateSourceWidth(0, 300, 0, 300, 2, 1)).toBeNull();
  expect(calculateSourceWidth(300, 300, 0, 0, 2, 1)).toBeNull();
  expect(calculateSourceWidth(300, 300, 300, 300, 0, 1)).toBeNull();
  expect(calculateSourceWidth(300, 300, 300, 300, NaN, 1)).toBeNull();
});

const fileId = '1234567890abcdef12345678';
const source = `https://cdn.test/${siteId}/${fileId}_photo.jpg`;
const config = {
  enabled: true,
  siteId,
  assetDimensions: { [fileId]: { width: 2400, height: 1200 } },
};
function photo(className = 'next-pages_card_image', parent?: string) {
  const img = new ElementDouble('IMG', {
    class: className,
    src: source,
    srcset: `${source} 2400w`,
    sizes: '100vw',
    loading: 'lazy',
    alt: 'Original art',
  });
  if (parent) new ElementDouble('DIV', { class: parent }).appendChild(img);
  return img;
}
test('uses explicitly supplied verified candidates for source-only eligible photos without capping the original', () => {
  const img = photo('news_card_image');
  img.removeAttribute('srcset');
  const settings = {
    ...config,
    generatedCandidates: {
      [fileId]: [
        { url: source.replace('photo.jpg', 'verified-500.webp'), width: 500 },
        { url: source.replace('photo.jpg', 'verified-800.webp'), width: 800 },
        { url: source, width: 2400 },
      ],
    },
  };
  expect(update(img, settings)).toBe(true);
  expect(img.getAttribute('sizes')).toBe('400px');
  expect(img.getAttribute('srcset')).toBe(
    `${source.replace('photo.jpg', 'verified-500.webp')} 500w, ${source.replace('photo.jpg', 'verified-800.webp')} 800w, ${source} 2400w`
  );
  expect(img.getAttribute('src')).toBe(source);
});

test('restores an originally absent srcset when generated delivery is stopped', () => {
  ObserverDouble.instances = [];
  const root = new ElementDouble('HTML');
  const img = photo('news_card_image');
  img.removeAttribute('srcset');
  root.appendChild(img);
  const win = {
    KOROWA_IMAGE_DELIVERY: {
      ...config,
      generatedCandidates: {
        [fileId]: [{ url: source, width: 2400 }],
      },
    },
    location: { hostname },
    MutationObserver: ObserverDouble,
    ResizeObserver: ObserverDouble,
  };
  (root as any).dataset = { wfSite: siteId };
  const stop = installResponsiveDelivery(win as any, { documentElement: root } as any);
  expect(img.hasAttribute('srcset')).toBe(true);
  stop?.();
  expect(img.hasAttribute('srcset')).toBe(false);
  expect(img.getAttribute('sizes')).toBe('100vw');
});

const update = (img: ElementDouble, settings = config) =>
  updateImageSizes(img as unknown as HTMLImageElement, settings);

test('retains native portrait delivery after cold-request evidence showed duplicate downloads', () => {
  const portrait = photo('team-member_image');
  const before = Object.fromEntries(portrait.attrs);
  expect(update(portrait)).toBe(false);
  expect(Object.fromEntries(portrait.attrs)).toEqual(before);
  // A shared asset may still be eligible in a separately measured news-card role.
  expect(update(photo('news_card_image'))).toBe(true);
});

test('changes only sizes for visible lazy approved roles with metadata and real candidates; repeated updates are inert', () => {
  for (const [role, parent, expected] of [
    ['next-pages_card_image', '', '440px'],
    ['image', 'info-block_image_component', '400px'],
    ['image', 'image-cloud_image-wrap', '400px'],

    ['gallery-slider_image', '', '400px'],
    ['news_card_image', '', '400px'],
  ]) {
    const img = photo(role, parent);
    expect(update(img)).toBe(true);
    expect(img.getAttribute('sizes')).toBe(expected);
    expect(img.getAttribute('data-korowa-original-sizes')).toBe('100vw');
    const writes = [...img.writes];
    update(img);
    expect(img.writes).toEqual(writes);
    expect(img.src).toBe(source);
    expect(img.getAttribute('srcset')).toBe(`${source} 2400w`);
    expect(img.getAttribute('alt')).toBe('Original art');
  }
  const excluded = [
    photo('image'),
    photo('image', 'info-block_image_component is-parallax'),
    photo('image image-cloud_center-image', 'image-cloud_image-wrap'),
    photo('news_card_image', 'featured-news'),
    photo('next-pages_card_image', 'hero-special'),
    photo('team-member_image', 'header_component'),
    photo('image', 'info-block_image_component is-full'),
    photo('image', 'info-block_image_component explore-cta'),
  ];
  const dialogImage = photo('gallery-slider_image');
  new ElementDouble('DIALOG', { open: '' }).appendChild(dialogImage);
  excluded.push(dialogImage);
  for (const ext of ['svg', 'avif']) {
    const img = photo();
    img.setAttribute('src', source.replace('.jpg', `.${ext}`));
    excluded.push(img);
  }
  const diagram = photo();
  diagram.setAttribute('src', source.replace('photo', 'framework-diagram'));
  excluded.push(diagram);
  const missing = photo();
  missing.removeAttribute('srcset');
  excluded.push(missing);
  const blank = photo();
  blank.setAttribute('srcset', '   ');
  excluded.push(blank);
  const malformed = photo();
  malformed.setAttribute('srcset', 'not a candidate');
  excluded.push(malformed);
  const eager = photo();
  eager.setAttribute('loading', 'eager');
  excluded.push(eager);
  const hidden = photo();
  hidden.visible = false;
  excluded.push(hidden);
  const zero = photo();
  zero.clientWidth = 0;
  excluded.push(zero);
  const unknown = photo();
  unknown.setAttribute('src', source.replace(fileId, '999999999999999999999999'));
  excluded.push(unknown);
  for (const img of excluded) {
    const before = Object.fromEntries(img.attrs);
    expect(update(img)).toBe(false);
    expect(Object.fromEntries(img.attrs)).toEqual(before);
  }
});

test('a changed source with missing metadata restores the native hint instead of retaining stale sizing', () => {
  const img = photo();
  update(img);
  img.setAttribute('src', source.replace(fileId, '999999999999999999999999'));
  expect(update(img)).toBe(false);
  expect(img.getAttribute('sizes')).toBe('100vw');
  expect(img.hasAttribute('data-korowa-original-sizes')).toBe(false);
});

test('browsers without visibility inspection preserve native attributes conservatively', () => {
  const img = photo();
  (img as any).checkVisibility = undefined;
  expect(update(img)).toBe(false);
  expect(img.getAttribute('sizes')).toBe('100vw');
});

test('parser-time install scans inserted roles, resizes without self-observation and can restore absent/original sizes', () => {
  ObserverDouble.instances = [];
  const root = new ElementDouble('HTML');
  const img = photo();
  root.appendChild(img);
  const { win, stop, flush } = installed(root);
  const doc = { documentElement: root };
  expect(img.getAttribute('sizes')).toBe('440px');
  expect(ObserverDouble.instances).toHaveLength(2);
  const mutation = ObserverDouble.instances.find((observer) =>
    observer.targets.some((target) => target.options?.subtree)
  )!;
  const resize = ObserverDouble.instances.find((observer) => observer !== mutation)!;
  expect(mutation.targets[0].options.attributeFilter).not.toContain('sizes');
  expect(mutation.targets[0].options.attributeFilter).not.toContain('data-korowa-original-sizes');
  const inserted = photo('gallery-slider_image');
  inserted.removeAttribute('sizes');
  root.appendChild(inserted);
  mutation.callback([{ type: 'childList', addedNodes: [inserted], removedNodes: [] }]);
  expect(inserted.getAttribute('sizes')).toBe('400px');
  inserted.clientHeight = 400;
  inserted.bounds.height = 400;
  resize.callback([{ target: inserted }]);
  flush();
  expect(inserted.getAttribute('sizes')).toBe('800px');
  stop?.();
  expect(inserted.hasAttribute('sizes')).toBe(false);
  expect(img.getAttribute('sizes')).toBe('100vw');
  expect(ObserverDouble.instances.every((observer) => !observer.targets.length)).toBe(true);
  win.KOROWA_IMAGE_DELIVERY = { ...config, enabled: false };
  expect(installResponsiveDelivery(win as any, doc as any)).toBeUndefined();
});

function installed(root: ElementDouble, settings = config) {
  ObserverDouble.instances = [];
  (root as any).dataset = { wfSite: siteId };
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  const win = {
    KOROWA_IMAGE_DELIVERY: settings,
    location: { hostname },
    MutationObserver: ObserverDouble,
    ResizeObserver: ObserverDouble,
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      frames.set(++nextFrame, callback);
      return nextFrame;
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
  };
  const stop = installResponsiveDelivery(win as any, { documentElement: root } as any);
  const [resize, mutation] = ObserverDouble.instances;
  const flush = () => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(0));
  };
  return { win, stop, resize, mutation, frames, flush };
}

function countWork(element: ElementDouble) {
  const counts = { selectors: 0, scans: 0, geometry: 0 };
  for (const [method, counter] of [
    ['matches', 'selectors'],
    ['querySelectorAll', 'scans'],
    ['getBoundingClientRect', 'geometry'],
  ] as const) {
    const original = element[method].bind(element) as (...args: any[]) => any;
    (element as any)[method] = (...args: any[]) => {
      counts[counter]++;
      return original(...args);
    };
  }
  return counts;
}

test('unrelated animation attributes do zero selector scans or image work', () => {
  const root = new ElementDouble('HTML');
  const img = root.appendChild(photo());
  const animated = root.appendChild(new ElementDouble('DIV'));
  const { mutation, frames } = installed(root);
  const imageWork = countWork(img);
  const unrelatedWork = countWork(animated);
  mutation.callback([{ type: 'attributes', target: animated, attributeName: 'style' }]);
  expect(imageWork).toEqual({ selectors: 0, scans: 0, geometry: 0 });
  expect(unrelatedWork).toEqual({ selectors: 0, scans: 0, geometry: 0 });
  expect(frames.size).toBe(0);
});

test('caches unchanged metadata and candidate preparation and invalidates source or native srcset', () => {
  const img = photo('news_card_image');
  img.removeAttribute('srcset');
  let metadataReads = 0;
  let candidateReads = 0;
  const candidates = Object.freeze([
    Object.freeze({ url: source, width: 2400 }),
    Object.freeze({ url: 'https://cdn.test/verified.webp', width: 500 }),
  ]);
  const settings = {
    ...config,
    assetDimensions: {
      get [fileId]() {
        metadataReads++;
        return { width: 2400, height: 1200 };
      },
    },
    generatedCandidates: {
      get [fileId]() {
        candidateReads++;
        return candidates as unknown as { url: string; width: number }[];
      },
    },
  };
  expect(update(img, settings)).toBe(true);
  expect(img.getAttribute('srcset')).toBe(`https://cdn.test/verified.webp 500w, ${source} 2400w`);
  const firstReads = [metadataReads, candidateReads];
  img.clientHeight = 300;
  update(img, settings);
  expect(img.getAttribute('sizes')).toBe('600px');
  expect([metadataReads, candidateReads]).toEqual(firstReads);
  const native = 'https://cdn.test/native.webp 800w';
  img.setAttribute('srcset', native);
  update(img, settings);
  expect(metadataReads).toBe(firstReads[0] + 1);
  expect(img.getAttribute('srcset')).toBe(native);
  img.setAttribute('src', source.replace(fileId, '999999999999999999999999'));
  expect(update(img, settings)).toBe(false);
  expect(img.getAttribute('sizes')).toBe('100vw');
  expect(img.getAttribute('srcset')).toBe(native);
  expect(candidates[0].width).toBe(2400);
});

test('one gate deduplicates subsequent mutation and resize work with reads before writes', () => {
  const root = new ElementDouble('HTML');
  const parent = root.appendChild(new ElementDouble('DIV'));
  const first = parent.appendChild(photo());
  const second = parent.appendChild(photo());
  const { mutation, resize, frames, flush } = installed(root);
  const work = [countWork(first), countWork(second)];
  const events: string[] = [];
  for (const [index, img] of [first, second].entries()) {
    const read = img.getBoundingClientRect.bind(img);
    img.getBoundingClientRect = () => {
      events.push(`read${index}`);
      return read();
    };
    const write = img.setAttribute.bind(img);
    img.setAttribute = (name, value) => {
      if (name === 'sizes') events.push(`write${index}`);
      write(name, value);
    };
    img.clientHeight = 400;
  }
  mutation.callback([
    { type: 'attributes', target: parent, attributeName: 'style' },
    { type: 'attributes', target: first, attributeName: 'style' },
    { type: 'attributes', target: parent, attributeName: 'class' },
  ]);
  resize.callback([{ target: first }, { target: second }, { target: first }]);
  expect(work.map((value) => value.geometry)).toEqual([0, 0]);
  expect(frames.size).toBe(1);
  flush();
  expect(work.map((value) => value.geometry)).toEqual([1, 1]);
  expect(events).toEqual(['read0', 'read1', 'write0', 'write1']);
  expect(first.getAttribute('sizes')).toBe('880px');
  expect(second.getAttribute('sizes')).toBe('880px');
  expect(frames.size).toBe(0);
});

test('OFF installs nothing and STOP restores exact attributes, cancels work and rejects stale callbacks', () => {
  const root = new ElementDouble('HTML');
  const native = root.appendChild(photo());
  const absent = root.appendChild(photo('news_card_image'));
  absent.removeAttribute('srcset');
  absent.removeAttribute('sizes');
  const empty = root.appendChild(photo('news_card_image'));
  empty.setAttribute('srcset', '');
  empty.setAttribute('sizes', '');
  const snapshots = [native, absent, empty].map((img) => Object.fromEntries(img.attrs));
  const disabled = installed(root, { ...config, enabled: false });
  expect(disabled.stop).toBeUndefined();
  expect(ObserverDouble.instances).toHaveLength(0);
  expect(disabled.frames.size).toBe(0);
  expect([native, absent, empty].map((img) => Object.fromEntries(img.attrs))).toEqual(snapshots);
  const settings = { ...config, generatedCandidates: { [fileId]: [{ url: source, width: 2400 }] } };
  const { win, stop, mutation, resize, frames } = installed(root, settings);
  expect((win as any).KOROWA_IMAGE_DELIVERY_STOP).toBe(stop);
  expect(absent.getAttribute('srcset')).toBe(`${source} 2400w`);
  resize.callback([{ target: native }, { target: absent }]);
  const staleFrame = [...frames.values()][0];
  stop?.();
  expect(frames.size).toBe(0);
  expect([native, absent, empty].map((img) => Object.fromEntries(img.attrs))).toEqual(snapshots);
  const writes = [native, absent, empty].map((img) => img.writes.length);
  stop?.();
  staleFrame(0);
  resize.callback([{ target: native }]);
  mutation.callback([{ type: 'attributes', target: native, attributeName: 'class' }]);
  expect([native, absent, empty].map((img) => img.writes.length)).toEqual(writes);
  expect([native, absent, empty].map((img) => Object.fromEntries(img.attrs))).toEqual(snapshots);
  expect(ObserverDouble.instances.every((observer) => !observer.targets.length)).toBe(true);
  expect(frames.size).toBe(0);
});

test('detached or moved nodes cannot receive stale queued hints and can be rediscovered', () => {
  const root = new ElementDouble('HTML');
  const wrap = root.appendChild(new ElementDouble('DIV'));
  const img = wrap.appendChild(photo());
  const { resize, mutation, flush, frames } = installed(root);
  resize.callback([{ target: img }]);
  img.isConnected = false;
  // A frame can run after detachment, before a removal record is delivered.
  flush();
  expect(img.getAttribute('sizes')).toBe('100vw');
  expect(img.hasAttribute('data-korowa-original-sizes')).toBe(false);
  expect(resize.targets.some(({ target }) => target === img)).toBe(false);
  const work = countWork(img);
  resize.callback([{ target: img }]);
  mutation.callback([{ type: 'childList', addedNodes: [], removedNodes: [wrap] }]);
  flush();
  expect(work.geometry).toBe(0);
  img.isConnected = true;
  const protectedParent = root.appendChild(new ElementDouble('DIV', { class: 'is-parallax' }));
  protectedParent.appendChild(wrap);
  mutation.callback([{ type: 'childList', addedNodes: [wrap], removedNodes: [wrap] }]);
  expect(img.getAttribute('sizes')).toBe('100vw');
  root.appendChild(wrap);
  mutation.callback([{ type: 'childList', addedNodes: [wrap], removedNodes: [wrap] }]);
  flush();
  expect(img.getAttribute('sizes')).toBe('440px');
  const dialog = root.appendChild(new ElementDouble('DIALOG'));
  dialog.appendChild(wrap);
  mutation.callback([{ type: 'childList', addedNodes: [wrap], removedNodes: [wrap] }]);
  flush();
  expect(img.getAttribute('sizes')).toBe('100vw');
  expect(img.hasAttribute('data-korowa-original-sizes')).toBe(false);
  expect(frames.size).toBe(0);
});

test('the entire team-member portrait role stays native even when approved roles overlap', () => {
  for (const img of [
    photo('team-member_image news_card_image'),
    photo('image team-member_image', 'info-block_image_component'),
    photo('image', 'info-block_image_component team-member_image'),
  ]) {
    const before = Object.fromEntries(img.attrs);
    expect(update(img)).toBe(false);
    expect(Object.fromEntries(img.attrs)).toEqual(before);
  }
});

test('inserted source-only hints are synchronous, sizes precede srcset, and helper srcset records are inert', () => {
  const root = new ElementDouble('HTML');
  const settings = { ...config, generatedCandidates: { [fileId]: [{ url: source, width: 2400 }] } };
  const { mutation, frames, flush } = installed(root, settings);
  const img = photo('news_card_image');
  img.removeAttribute('srcset');
  root.appendChild(img);
  const work = countWork(img);
  img.writes = [];
  mutation.callback([
    { type: 'childList', addedNodes: [img], removedNodes: [] },
    { type: 'attributes', target: img, attributeName: 'src' },
    { type: 'childList', addedNodes: [img], removedNodes: [] },
  ]);
  expect(img.getAttribute('sizes')).toBe('400px');
  expect(img.getAttribute('srcset')).toBe(`${source} 2400w`);
  expect(img.writes.indexOf('sizes')).toBeLessThan(img.writes.indexOf('srcset'));
  expect(work.geometry).toBe(1);
  expect(frames.size).toBe(0);
  mutation.callback([{ type: 'attributes', target: img, attributeName: 'srcset' }]);
  expect(frames.size).toBe(0);
  flush();
  expect(work.geometry).toBe(1);
});

test('class animations avoid discovery scans while new ancestor roles and hiding remain effective', () => {
  const root = new ElementDouble('HTML');
  const unrelated = root.appendChild(new ElementDouble('DIV', { class: 'animation-active' }));
  const wrapper = root.appendChild(new ElementDouble('DIV'));
  const img = wrapper.appendChild(photo('image'));
  const { mutation, flush } = installed(root);
  const unrelatedWork = countWork(unrelated);
  mutation.callback([
    { type: 'attributes', target: unrelated, attributeName: 'class', oldValue: '' },
  ]);
  expect(unrelatedWork).toEqual({ selectors: 0, scans: 0, geometry: 0 });
  wrapper.className = 'info-block_image_component';
  mutation.callback([
    { type: 'attributes', target: wrapper, attributeName: 'class', oldValue: '' },
  ]);
  expect(img.getAttribute('sizes')).toBe('400px');
  const scans = countWork(wrapper);
  wrapper.className += ' animation-active';
  mutation.callback([
    {
      type: 'attributes',
      target: wrapper,
      attributeName: 'class',
      oldValue: 'info-block_image_component',
    },
  ]);
  flush();
  expect(scans.scans).toBe(0);
  wrapper.setAttribute('hidden', '');
  mutation.callback([{ type: 'attributes', target: wrapper, attributeName: 'hidden' }]);
  flush();
  expect(img.getAttribute('sizes')).toBe('100vw');
  wrapper.removeAttribute('hidden');
  mutation.callback([{ type: 'attributes', target: wrapper, attributeName: 'hidden' }]);
  flush();
  expect(img.getAttribute('sizes')).toBe('400px');
  wrapper.className = '';
  mutation.callback([
    {
      type: 'attributes',
      target: wrapper,
      attributeName: 'class',
      oldValue: 'info-block_image_component animation-active',
    },
  ]);
  flush();
  expect(img.getAttribute('sizes')).toBe('100vw');
});

test('source changes retire stale generated candidates without writes between batch layout reads', () => {
  const root = new ElementDouble('HTML');
  const first = root.appendChild(photo('news_card_image'));
  const second = root.appendChild(photo('news_card_image'));
  first.removeAttribute('srcset');
  second.removeAttribute('srcset');
  const nextId = 'abcdef1234567890abcdef12';
  const nextSource = source.replace(fileId, nextId);
  const settings = {
    ...config,
    assetDimensions: { ...config.assetDimensions, [nextId]: { width: 1600, height: 1600 } },
    generatedCandidates: {
      [fileId]: [{ url: source, width: 2400 }],
      [nextId]: [{ url: nextSource, width: 1600 }],
    },
  };
  const { mutation, flush, stop } = installed(root, settings);
  const events: string[] = [];
  for (const img of [first, second]) {
    img.setAttribute('src', nextSource);
    const read = img.getBoundingClientRect.bind(img);
    img.getBoundingClientRect = () => {
      events.push('read');
      return read();
    };
    const write = img.setAttribute.bind(img);
    img.setAttribute = (name, value) => {
      events.push('write');
      write(name, value);
    };
    const remove = img.removeAttribute.bind(img);
    img.removeAttribute = (name) => {
      events.push('write');
      remove(name);
    };
  }
  mutation.callback(
    [first, second].map((target) => ({ type: 'attributes', target, attributeName: 'src' }))
  );
  flush();
  expect(events.slice(0, 2)).toEqual(['read', 'read']);
  for (const img of [first, second]) {
    expect(img.getAttribute('sizes')).toBe('300px');
    expect(img.getAttribute('srcset')).toBe(`${nextSource} 1600w`);
  }
  first.setAttribute('src', source.replace(fileId, '999999999999999999999999'));
  mutation.callback([{ type: 'attributes', target: first, attributeName: 'src' }]);
  flush();
  expect(first.getAttribute('srcset')).toBeNull();
  expect(first.getAttribute('sizes')).toBe('100vw');
  stop?.();
  expect(second.getAttribute('srcset')).toBeNull();
  expect(second.getAttribute('sizes')).toBe('100vw');
});

test('moving a tracked subtree out of its approved ancestor restores the original hint', () => {
  const root = new ElementDouble('HTML');
  const approved = root.appendChild(
    new ElementDouble('DIV', { class: 'info-block_image_component' })
  );
  const wrapper = approved.appendChild(new ElementDouble('DIV'));
  const img = wrapper.appendChild(photo('image'));
  const { mutation, flush } = installed(root);
  expect(img.getAttribute('sizes')).toBe('400px');
  root.appendChild(wrapper);
  mutation.callback([{ type: 'childList', addedNodes: [wrapper], removedNodes: [wrapper] }]);
  flush();
  expect(img.getAttribute('sizes')).toBe('100vw');
  expect(img.hasAttribute('data-korowa-original-sizes')).toBe(false);
  approved.appendChild(wrapper);
  mutation.callback([{ type: 'childList', addedNodes: [wrapper], removedNodes: [wrapper] }]);
  flush();
  expect(img.getAttribute('sizes')).toBe('400px');
});

test('SVG class animations do not interrupt image mutation processing', () => {
  const root = new ElementDouble('HTML');
  const svg = root.appendChild(new ElementDouble('SVG', { class: 'animation-active' }));
  Object.defineProperty(svg, 'className', { value: { baseVal: 'animation-active' } });
  const img = root.appendChild(photo());
  const { mutation, flush } = installed(root);
  img.setAttribute('loading', 'eager');
  expect(() =>
    mutation.callback([
      { type: 'attributes', target: svg, attributeName: 'class', oldValue: '' },
      { type: 'attributes', target: img, attributeName: 'loading' },
    ])
  ).not.toThrow();
  flush();
  expect(img.getAttribute('sizes')).toBe('100vw');
});

test('overlapping discovery records scan each inserted subtree only once', () => {
  const root = new ElementDouble('HTML');
  const { mutation, frames } = installed(root);
  const wrapper = root.appendChild(
    new ElementDouble('DIV', { class: 'info-block_image_component' })
  );
  const img = wrapper.appendChild(photo('image'));
  const parentWork = countWork(wrapper);
  const imageWork = countWork(img);
  mutation.callback([
    { type: 'childList', addedNodes: [wrapper], removedNodes: [] },
    { type: 'childList', addedNodes: [img, wrapper], removedNodes: [] },
    { type: 'attributes', target: wrapper, attributeName: 'class', oldValue: '' },
  ]);
  expect(parentWork.scans).toBe(1);
  expect(imageWork.scans).toBe(1);
  expect(imageWork.geometry).toBe(1);
  expect(img.getAttribute('sizes')).toBe('400px');
  expect(frames.size).toBe(0);
});

test('the global STOP command remains callable and repeated installation cannot restart a stopped page', () => {
  const root = new ElementDouble('HTML');
  const img = root.appendChild(photo());
  const { win, stop, frames } = installed(root);
  (win as any).KOROWA_IMAGE_DELIVERY_STOP();
  const writes = [...img.writes];
  expect(() => (win as any).KOROWA_IMAGE_DELIVERY_STOP()).not.toThrow();
  expect(installResponsiveDelivery(win as any, { documentElement: root } as any)).toBe(stop);
  expect(ObserverDouble.instances).toHaveLength(2);
  expect(ObserverDouble.instances.every((observer) => !observer.targets.length)).toBe(true);
  expect(img.writes).toEqual(writes);
  expect(img.getAttribute('sizes')).toBe('100vw');
  expect(frames.size).toBe(0);
});
