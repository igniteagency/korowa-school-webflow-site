class Accordions {
  private readonly ITEM_SELECTOR = 'details:not([data-accordion="false"])';
  private readonly ANIMATION_DURATION = 0.3;
  private readonly CLOSE_OTHER_ACCORDIONS = true;

  constructor() {
    this.init();
  }

  private init() {
    const accordionsList = document.querySelectorAll<HTMLDetailsElement>(this.ITEM_SELECTOR);
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
          this.openAccordionInternal(accordion, content, accordionsList);
        } else {
          this.closeAccordionInternal(accordion, content);
        }
      });
    });
  }

  private openAccordionInternal(
    accordion: HTMLDetailsElement,
    content: HTMLElement,
    accordionsList: NodeListOf<HTMLDetailsElement>
  ) {
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
      accordionsList.forEach((other) => {
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
