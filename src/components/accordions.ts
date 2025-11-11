class Accordions {
  private readonly ITEM_SELECTOR = 'details:not([data-accordion="false"])';
  private readonly ANIMATION_DURATION = 0.3;
  private readonly CLOSE_OTHER_ACCORDIONS = true;
  private accordionGroups: Map<string, HTMLDetailsElement[]> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    const accordionsList = document.querySelectorAll<HTMLDetailsElement>(this.ITEM_SELECTOR);

    // Group accordions by data-group attribute
    accordionsList.forEach((accordion) => {
      const group = accordion.getAttribute('data-group') || 'default';
      if (!this.accordionGroups.has(group)) {
        this.accordionGroups.set(group, []);
      }
      this.accordionGroups.get(group)?.push(accordion);
    });

    accordionsList.forEach((accordion) => {
      // Extend accordion with methods
      accordion.openAccordion = () => {
        if (!accordion.open) accordion.querySelector('summary')?.click();
      };

      accordion.closeAccordion = () => {
        if (accordion.open) accordion.querySelector('summary')?.click();
      };

      const toggle = accordion.querySelector('summary');
      const content = accordion.querySelector('summary + div');

      if (!toggle || !content) return;

      toggle.addEventListener('click', (event) => {
        event.preventDefault();
        const isOpening = !accordion.open;

        if (isOpening) {
          this.openAccordionInternal(accordion, content);
        } else {
          this.closeAccordionInternal(accordion, content);
        }
      });
    });
  }

  private openAccordionInternal(accordion: HTMLDetailsElement, content: HTMLElement) {
    accordion.open = true;
    const height = content.scrollHeight;
    gsap.fromTo(
      content,
      { height: 0 },
      {
        height,
        duration: this.ANIMATION_DURATION,
        onComplete: () => {
          gsap.set(content, { height: 'auto' });
        },
      }
    );

    accordion.dispatchEvent(new CustomEvent('onAccordionOpen', { detail: { accordion } }));

    if (this.CLOSE_OTHER_ACCORDIONS) {
      // Get the group this accordion belongs to
      const group = accordion.dataset.group || 'default';
      const accordionsInGroup = this.accordionGroups.get(group) || [];

      // Only close other accordions within the same group
      accordionsInGroup.forEach((other) => {
        if (other !== accordion && other.open) {
          other.querySelector('summary')?.click();
        }
      });
    }
  }

  private closeAccordionInternal(accordion: HTMLDetailsElement, content: HTMLElement) {
    const height = content.scrollHeight;
    gsap.fromTo(
      content,
      { height },
      {
        height: 0,
        duration: this.ANIMATION_DURATION,
        onComplete: () => {
          accordion.open = false;
          gsap.set(content, { height: '' });
          accordion.dispatchEvent(new CustomEvent('onAccordionClose'));
        },
      }
    );
  }
}

export default Accordions;
