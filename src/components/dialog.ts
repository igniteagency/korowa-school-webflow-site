/**
 * Popups with dialog HTML element
 * Set `data-dialog-id="{unique-number}"` attribute on the dialog element to target it
 * Set `data-dialog-open="{unique-number}"` attribute on open trigger element(s) to open the dialog
 * Set `data-dialog-close="{unique-number}"` attribute on close trigger element(s) to close the dialog. Close triggers should be inside the dialog element
 *
 * TODO: make it work with the new `command` and `commandfor` libraries with fallback polyfill script
 */
const DATA_ATTR = 'data-dialog-id';
const DATA_ATTR_OPEN = 'data-dialog-open';
const DATA_ATTR_CLOSE = 'data-dialog-close';

const DATA_COMPONENT_SELECTOR = `dialog[${DATA_ATTR}]`;

window.Webflow ||= [];
window.Webflow.push(() => {
  dialogInit();
  handleBackdropClick();
});

function dialogInit() {
  const dialogList = document.querySelectorAll<HTMLDialogElement>(DATA_COMPONENT_SELECTOR);

  dialogList.forEach((dialogEl) => {
    const id = dialogEl.getAttribute(DATA_ATTR);
    if (!id) {
      console.error('No ID found for dialog component', dialogEl);
      return;
    }

    const openTriggersList = document.querySelectorAll(`[${DATA_ATTR_OPEN}="${id}"]`);
    const closeTriggersList = dialogEl.querySelectorAll(`[${DATA_ATTR_CLOSE}="${id}"]`);

    openTriggersList.forEach((openTriggerEl) => {
      openTriggerEl.addEventListener('click', () => {
        dialogEl.showModal();
      });
    });

    closeTriggersList.forEach((closeTriggerEl) => {
      closeTriggerEl.addEventListener('click', () => {
        dialogEl.close();
      });
    });
  });
}

/**
 * Handles backdrop click to close dialog
 * Only closes if the click was directly on the dialog element (backdrop) and not its children
 */
function handleBackdropClick() {
  const dialogEl = document.querySelectorAll<HTMLDialogElement>('dialog');
  dialogEl.forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      const dialogEl = event.target as HTMLDialogElement;
      if (!(dialogEl instanceof HTMLDialogElement)) return;

      // Check if click was directly on the dialog element (backdrop)
      const rect = dialogEl.getBoundingClientRect();
      const clickedInDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (clickedInDialog && event.target === dialogEl) {
        dialogEl.close();
      }
    });
  });
}
