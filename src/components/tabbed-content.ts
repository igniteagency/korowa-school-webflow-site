/**
 * Simple initializer for tabbed-content components.
 * Sets a randomized `name` attribute on the component and applies
 * the same `name` to each child `details` (and any radio inputs inside)
 */

export class TabbedContent {
  private component: HTMLElement;
  private details: HTMLDetailsElement[];

  constructor(component: HTMLElement) {
    this.component = component;
    this.details = Array.from(component.querySelectorAll<HTMLDetailsElement>('details'));

    if (!this.component) return;

    this.applyNameAttributeToDetails();
    this.keepCurrentDetailsOpen();
  }

  private generateRandomName(): string {
    return `tabbed-${Math.random().toString(36).slice(2, 9)}`;
  }

  private applyNameAttributeToDetails(): void {
    const existing = this.component.getAttribute('name');
    const name = existing || this.generateRandomName();

    this.details.forEach((detail) => {
      detail.setAttribute('name', name);
    });
  }

  private keepCurrentDetailsOpen(): void {
    this.details.forEach((detail) => {
      const summary = detail.querySelector<HTMLElement>('summary');
      if (!summary) return;

      summary.addEventListener('click', (event) => {
        // If the clicked detail is already open, prevent it from closing.
        if (detail.open) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
      });
    });
  }
}

export function initTabbedContent(): void {
  const components = document.querySelectorAll('[data-el="tabbed-content"]');

  components.forEach((c) => {
    new TabbedContent(c as HTMLElement);
  });
}

window.Webflow = window.Webflow || [];
window.Webflow?.push(() => {
  initTabbedContent();
});
