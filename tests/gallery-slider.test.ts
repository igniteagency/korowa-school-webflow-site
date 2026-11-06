import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

import { ElementDouble, ObserverDouble } from './dom';

// Execute the actual component, including its old clone path, without loading GSAP/network.
function setup() {
  ObserverDouble.instances = [];
  const code = readFileSync(
    new URL('../src/components/gallery-slider.ts', import.meta.url),
    'utf8'
  ).replace(/import \{ horizontalLoop \} from '[^']+';/, '');
  const context = vm.createContext({
    window: { loadScript: () => Promise.resolve(), Webflow: [] },
    document: { querySelectorAll: () => [] },
    MutationObserver: ObserverDouble,
    gsap: { to: () => {} },
    console,
  });
  vm.runInContext(
    new Bun.Transpiler({ loader: 'ts' }).transformSync(
      `${code}\nglobalThis.Slider = GallerySlider;`
    ),
    context
  );
  const slider = new context.Slider();
  const card = new ElementDouble('DIV');
  const originals = card.appendChild(
    new ElementDouble('DIV', { 'data-gallery-slider-el': 'image-list' })
  );
  const dialog = card.appendChild(new ElementDouble('DIALOG'));
  const list = dialog.appendChild(
    new ElementDouble('DIV', { 'data-gallery-slider-el': 'dialog-image-list' })
  );
  const prev = dialog.appendChild(
    new ElementDouble('BUTTON', { 'data-gallery-slider-el': 'dialog-image-prev' })
  );
  const next = dialog.appendChild(
    new ElementDouble('BUTTON', { 'data-gallery-slider-el': 'dialog-image-next' })
  );
  const add = (attrs: Record<string, string>) =>
    originals.appendChild(new ElementDouble('IMG', attrs));
  add({
    src: 'https://cdn.test/original-a.jpg',
    srcset: 'https://cdn.test/a-small.jpg 400w, https://cdn.test/original-a.jpg 2400w',
    sizes: '200px',
    alt: 'A',
    style: 'object-position: 20% 30%',
    'data-art': 'a',
  });
  add({ src: 'https://cdn.test/small-original.jpg', alt: 'B' });
  add({ class: 'w-dyn-bind-empty', src: '' });
  add({ src: '   ' });
  return { slider, card, dialog, list, next, prev };
}

test('old clone regression: hidden dialog has no fetchable sources/card hint, retains original art and skips empty CMS images', () => {
  const { slider, card, list } = setup();
  slider.populateDialogImageSlider(card);
  const [first, second] = list.children;
  expect(first.getAttribute('src')).toBeNull();
  expect(list.children).toHaveLength(2);
  expect(first.getAttribute('srcset')).toBeNull();
  expect(first.getAttribute('sizes')).toBe('100vw');
  expect(first.getAttribute('data-gallery-dialog-src')).toBe('https://cdn.test/original-a.jpg');
  expect(first.getAttribute('data-gallery-dialog-srcset')).toContain('2400w');
  expect(first.getAttribute('alt')).toBe('A');
  expect(first.getAttribute('style')).toBe('object-position: 20% 30%');
  expect(first.getAttribute('data-art')).toBe('a');
  expect(second.getAttribute('data-gallery-dialog-src')).toBe(
    'https://cdn.test/small-original.jpg'
  );
});

test('native open and navigation hydrate only selected images; wrapping, close and reopen preserve index', () => {
  const { slider, card, dialog, list, next, prev } = setup();
  slider.populateDialogImageSlider(card);
  slider.setDialogImageSlider(card);
  const [first, second] = list.children;
  expect(first.getAttribute('src')).toBeNull();
  expect(second.getAttribute('src')).toBeNull();
  const observer = ObserverDouble.instances.find((item) =>
    item.targets.some(({ target }) => target === dialog)
  );
  expect(observer).toBeDefined();
  expect(observer!.targets[0].options.attributeFilter).toEqual(['open']);
  dialog.open = true;
  observer!.callback([{ type: 'attributes', target: dialog, attributeName: 'open' }]);
  expect(first.getAttribute('src')).toBe('https://cdn.test/original-a.jpg');
  expect(first.getAttribute('srcset')).toContain('2400w');
  expect(first.getAttribute('sizes')).toBe('100vw');
  expect(second.getAttribute('src')).toBeNull();
  const writes = [...first.writes];
  dialog.emit('toggle');
  expect(first.writes).toEqual(writes);
  prev.emit('click');
  expect(second.getAttribute('src')).toBe('https://cdn.test/small-original.jpg');
  expect(second.getAttribute('srcset')).toBeNull();
  dialog.open = false;
  observer!.callback([]);
  // A source stays cached after viewing. Reopening does not reload or reset selection.
  const secondWrites = [...second.writes];
  dialog.open = true;
  dialog.emit('toggle');
  expect(second.writes).toEqual(secondWrites);
  next.emit('click');
  expect(first.writes).toEqual(writes);
});

test('already-open native dialog hydrates its current image during initialization', () => {
  const { slider, card, dialog, list } = setup();
  slider.populateDialogImageSlider(card);
  dialog.open = true;
  slider.setDialogImageSlider(card);
  expect(list.children[0].getAttribute('src')).toBe('https://cdn.test/original-a.jpg');
  expect(list.children[1].getAttribute('src')).toBeNull();
});
