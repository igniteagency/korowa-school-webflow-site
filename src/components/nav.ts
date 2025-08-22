class NavMenu {
  private dialogEl!: HTMLDialogElement | null;
  private readonly DIALOG_ID = 'nav-menu';
  private readonly MENU_OPEN_IX3_EVENT = 'onNavMenuOpen';

  private detailsElements!: NodeListOf<HTMLDetailsElement>;
  private readonly GROUP_LINK_SELECTOR = '[data-el="nav-group-link"]';

  constructor() {
    this.init();
  }

  init() {
    this.dialogEl = document.querySelector<HTMLDialogElement>(
      `dialog[data-dialog-id="${this.DIALOG_ID}"]`
    );
    this.detailsElements = document.querySelectorAll('[data-el="nav-group-list"] details');

    if (this.detailsElements.length === 0) return;

    this.onNavMenuOpen();
    this.setupAccordionBehavior();
    this.ensureOneIsOpen();
  }

  private onNavMenuOpen() {
    // Listen for the custom event to trigger IX3 animations
    this.dialogEl?.addEventListener('dialogOpen', () => {
      window.WF_IX.emit(this.MENU_OPEN_IX3_EVENT, {}, this.dialogEl);
    });
  }

  private setupAccordionBehavior() {
    this.detailsElements.forEach((details) => {
      details.addEventListener('toggle', () => {
        if (details.open) {
          this.closeOthersManually(details);
          this.emitOpenEvent(details);
        } else {
          this.resetClosingStyles(details);
          this.ensureOneIsOpen();
        }
      });
    });
  }

  /**
   * Fallback for older browsers - close other accordions manually
   */
  private closeOthersManually(openDetails: HTMLDetailsElement) {
    //
    this.detailsElements.forEach((details) => {
      if (details !== openDetails && details.open) {
        details.open = false;
      }
    });
  }

  /**
   * Reset styles for sub-links in the closing accordion
   */
  private resetClosingStyles(closingDetails: HTMLDetailsElement) {
    const subLinks = closingDetails.querySelectorAll(this.GROUP_LINK_SELECTOR);
    gsap.set(subLinks, { yPercent: 0, opacity: 0 });
  }

  private ensureOneIsOpen() {
    const hasOpenDetails = Array.from(this.detailsElements).some((details) => details.open);

    if (!hasOpenDetails && this.detailsElements.length > 0) {
      this.detailsElements[0].open = true;
    }
  }

  private emitOpenEvent(details: HTMLDetailsElement) {
    // Unable to target just the currently opened details content wrapper, so skipping Webflow native IX3
    // window.WF_IX.emit('onNavDetailsOpen', {}, details);

    const targets = details?.querySelectorAll(this.GROUP_LINK_SELECTOR);
    gsap.fromTo(
      targets,
      {
        opacity: 0,
        yPercent: 30,
      },
      {
        opacity: 1,
        yPercent: 0,
        duration: 0.35,
        ease: 'power1.in',
        stagger: 0.05,
      }
    );
  }
}

export default NavMenu;
