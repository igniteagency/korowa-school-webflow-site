class NavMenu {
  private detailsElements!: NodeListOf<HTMLDetailsElement>;

  constructor() {
    this.init();
  }

  init() {
    this.detailsElements = document.querySelectorAll('[data-el="nav-group-list"] details');

    if (this.detailsElements.length === 0) return;

    this.setupAccordionBehavior();
    this.ensureOneIsOpen();
  }

  private setupAccordionBehavior() {
    this.detailsElements.forEach((details) => {
      details.addEventListener('toggle', () => {
        if (details.open) {
          this.closeOthers(details);
          this.emitOpenEvent(details);
        } else {
          this.ensureOneIsOpen();
        }
      });
    });
  }

  private closeOthers(openDetails: HTMLDetailsElement) {
    this.detailsElements.forEach((details) => {
      if (details !== openDetails && details.open) {
        details.open = false;
      }
    });
  }

  private ensureOneIsOpen() {
    const hasOpenDetails = Array.from(this.detailsElements).some((details) => details.open);

    if (!hasOpenDetails && this.detailsElements.length > 0) {
      this.detailsElements[0].open = true;
      this.emitOpenEvent(this.detailsElements[0]);
    }
  }

  private emitOpenEvent(details: HTMLDetailsElement) {
    window.WF_IX.emit('onNavDetailsOpen', {}, details);
  }
}

export default NavMenu;
