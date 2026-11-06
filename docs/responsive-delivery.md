# Korowa responsive image delivery

## Scope
The standalone `src/components/responsive-delivery.ts` entry is built separately and runs synchronously from site head custom code, with its configuration assigned first. Do not move it into Webflow ready or global.ts: early hints must precede eligible lazy-image requests.

The release allow-list requires exact document/config site IDs and approved hosts. Production site `689b9231663a4f08a91a5f03` supports www/apex Korowa and `korowa-school.webflow.io`. The isolated backup retains its own site/host pair. Other combinations fail closed.

`config/responsive-delivery.production.json` contains verified metadata for current live source IDs and explicit variants. Unknown new images retain native delivery. Metadata is static for a page lifetime; update the saved registry/config and reload rather than editing dimensions in place. Never invent width-suffix URLs or replace originals to optimize a card.

The helper targets only approved lazy image roles, with cover-crop, transform and Next Pages hover protection. Heroes/headers, the expanding cloud centre, portraits, full/parallax/Explore images, diagrams, featured news and gallery dialogs remain native. DPR selection remains the browser's responsibility. Subsequent affected-image work is batched; the first pass stays synchronous.

## Off controls
- Persistent: change the site-head config's clearly separated `"enabled": true` to `"enabled": false`, save and publish the intended site targets. This affects future page loads. Re-enable with true and publish again.
- Current page: `window.KOROWA_IMAGE_DELIVERY_STOP?.();` cancels queued work, disconnects observers, restores native hints and removes markers. It is idempotent and does not persist across reloads. Requests already sent cannot be undone. Changing the enabled property after installation is not a live switch.

## Gallery fix
The independent gallery component keeps hidden dialog clones source-free, hydrates selected images on native open/navigation, preserves original art rather than currentSrc, and uses a full-dialog hint. Keep the Webflow `JS / Gallery Slider Embed` loader pointed at the exact verified release SHA, not a development branch. Disabling the helper does not disable this independent fix.

## Release checks
Run Bun tests, production build, formatting and runtime checks. Verify current production HTML and staging before publishing: first candidate requests, no new duplicate families, crop/hover geometry, protected images, native stop/disabled reload, and actual gallery open/next/previous/reopen. Read back exact head/embed and verify delivered CDN bytes. Preserve analytics, originals, CMS values, layout and unrelated scripts. A backup prototype must never replace the current site.

This is not a field INP/Core Web Vitals guarantee. Real-device Safari remains a separate QA requirement; source-resolution limits can remain even with correct sizing.
