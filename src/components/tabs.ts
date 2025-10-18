export class AutoRotatingTabs {
  private component: HTMLElement;
  private tabs: HTMLDetailsElement[];
  private currentTabIndex: number = 0;
  private intervalId: number | null = null;
  private autoplayTimer: number;
  private intersectionObserver: IntersectionObserver;
  private isInView: boolean = false;

  private readonly AUTOPLAY_TIMER_CSS_VAR = '--autoplay-timer';
  private readonly OUT_OF_VIEW_CLASS = 'is-out-of-view';

  constructor(component: HTMLElement) {
    this.component = component;
    this.tabs = Array.from(component.querySelectorAll<HTMLDetailsElement>('details'));

    const timerValue = getComputedStyle(component)
      .getPropertyValue(this.AUTOPLAY_TIMER_CSS_VAR)
      .trim();

    if (timerValue.endsWith('ms')) {
      this.autoplayTimer = parseFloat(timerValue);
    } else {
      // Assume seconds (e.g., "6s" or just "6")
      this.autoplayTimer = parseFloat(timerValue) * 1000;
    }

    if (!component || this.tabs.length === 0) {
      console.warn('AutoRotatingTabs: No valid component or tabs found.');
      return;
    }

    this.init();
  }

  private init(): void {
    this.ensureOneTabOpen();
    this.setupEventListeners();
    this.setupIntersectionObserver();
  }

  private ensureOneTabOpen(): void {
    const openTabIndex = this.tabs.findIndex((tab) => tab.open);

    if (openTabIndex === -1) {
      // No tabs open, open the first one
      this.tabs[0].openAccordion();
      this.currentTabIndex = 0;
    } else {
      // Close all except the first open tab
      this.tabs.forEach((tab, index) => {
        if (index !== openTabIndex && tab.open) {
          tab.closeAccordion();
        }
      });
      this.currentTabIndex = openTabIndex;
    }
  }

  private setupEventListeners(): void {
    this.tabs.forEach((tab, index) => {
      tab.addEventListener('toggle', (event) => {
        if (index === this.currentTabIndex) {
          event.preventDefault();
          return;
        }
        if (tab.open) {
          this.handleTabOpen(index);
        }
      });
    });
  }

  private setupIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === this.component) {
            this.isInView = entry.isIntersecting;

            if (this.isInView) {
              this.startAutoRotation();
            } else {
              this.pauseAutoRotation();
            }
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of component is visible
      }
    );

    this.intersectionObserver.observe(this.component);
  }

  private handleTabOpen(index: number): void {
    // Close other tabs
    this.tabs.forEach((tab, i) => {
      if (i !== index && tab.open) {
        tab.closeAccordion();
      }
    });

    this.currentTabIndex = index;
    this.startAutoRotation();
  }

  private startAutoRotation(): void {
    if (!this.isInView) return;

    this.pauseAutoRotation();
    this.component.classList.remove(this.OUT_OF_VIEW_CLASS);

    this.intervalId = window.setInterval(() => {
      this.rotateToNext();
    }, this.autoplayTimer);
  }

  private pauseAutoRotation(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.component.classList.add(this.OUT_OF_VIEW_CLASS);
  }

  private rotateToNext(): void {
    this.tabs[this.currentTabIndex]?.closeAccordion();
    this.currentTabIndex = (this.currentTabIndex + 1) % this.tabs.length;
    this.tabs[this.currentTabIndex]?.openAccordion();
  }

  public destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}

// Initialize all auto-rotating tabs components on the page
export function initAutoRotatingTabs(): void {
  const tabsComponents = document.querySelectorAll('[data-el="tabs-component"]');

  tabsComponents.forEach((component) => {
    new AutoRotatingTabs(component);
  });
}

window.Webflow = window.Webflow || [];
window.Webflow?.push(() => {
  initAutoRotatingTabs();
});
