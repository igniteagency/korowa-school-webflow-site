export class AutoRotatingTabs {
  private component: HTMLElement;
  private tabs: HTMLDetailsElement[];
  private currentTabIndex: number = 0;
  private intervalId: number | null = null;
  private progressAnimations: Map<HTMLDetailsElement, gsap.core.Tween> = new Map();
  private autoplayTimer: number;
  private intersectionObserver: IntersectionObserver;
  private isInView: boolean = false;

  private readonly AUTOPLAY_TIMER_CSS_VAR = '--autoplay-timer';
  private readonly PROGRESS_BAR_CSS_VAR = '--progress-scale';

  constructor(component: HTMLElement) {
    this.component = component;
    this.tabs = Array.from(component.querySelectorAll<HTMLDetailsElement>('details'));

    const timerValue = getComputedStyle(component)
      .getPropertyValue(this.AUTOPLAY_TIMER_CSS_VAR)
      .trim();
    this.autoplayTimer = parseFloat(timerValue) * 1000; // Convert to milliseconds

    if (!component || this.tabs.length === 0) {
      console.warn('AutoRotatingTabs: No valid component or tabs found.');
      return;
    }

    this.init();
  }

  private init(): void {
    this.setupProgressAnimations();
    this.setupEventListeners();
    this.setupIntersectionObserver();
  }

  private setupProgressAnimations(): void {
    this.tabs.forEach((tab) => {
      // Initialize progress to 0
      gsap.set(tab, { [this.PROGRESS_BAR_CSS_VAR]: 0 });
    });
  }

  private setupEventListeners(): void {
    this.tabs.forEach((tab, index) => {
      tab.addEventListener('toggle', () => {
        if (tab.open) {
          this.handleTabOpen(index);
        } else {
          this.handleTabClose(tab);
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
              this.resumeAutoRotation();
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
    // Cancel any existing progress animations and close other tabs
    this.tabs.forEach((tab, i) => {
      const animation = this.progressAnimations.get(tab);
      if (animation) {
        animation.kill();
      }

      if (i !== index && tab.open) {
        tab.closeAccordion();
        this.resetProgress(tab);
      }
    });

    this.currentTabIndex = index;
    if (this.isInView) {
      this.restartAutoRotation();
    }
  }

  private handleTabClose(tab: HTMLDetailsElement): void {
    this.resetProgress(tab);
  }

  private resetProgress(tab: HTMLDetailsElement): void {
    const animation = this.progressAnimations.get(tab);
    if (animation) {
      animation.kill();
    }
    gsap.set(tab, { [this.PROGRESS_BAR_CSS_VAR]: 0 });
  }

  private startAutoRotation(): void {
    if (!this.isInView) return;

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Find currently open tab or open first tab
    const openTabIndex = this.tabs.findIndex((tab) => tab.open);
    if (openTabIndex !== -1) {
      this.currentTabIndex = openTabIndex;
    } else {
      this.tabs[0].openAccordion();
      this.currentTabIndex = 0;
    }

    // Start progress animation for current tab
    const currentTab = this.tabs[this.currentTabIndex];
    if (currentTab && currentTab.open) {
      this.startProgressAnimation(currentTab);
    }

    this.intervalId = window.setInterval(() => {
      this.rotateToNext();
    }, this.autoplayTimer);
  }

  private pauseAutoRotation(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Pause current progress animation
    const currentTab = this.tabs[this.currentTabIndex];
    if (currentTab) {
      const animation = this.progressAnimations.get(currentTab);
      if (animation) {
        animation.pause();
      }
    }
  }

  private resumeAutoRotation(): void {
    // Resume current progress animation
    const currentTab = this.tabs[this.currentTabIndex];
    if (currentTab) {
      const animation = this.progressAnimations.get(currentTab);
      if (animation) {
        animation.resume();
      }
    }

    // Start interval if not already running
    if (!this.intervalId) {
      this.intervalId = window.setInterval(() => {
        this.rotateToNext();
      }, this.autoplayTimer);
    }
  }

  private restartAutoRotation(): void {
    this.startAutoRotation();
  }

  private rotateToNext(): void {
    // Close current tab and reset its progress
    const currentTab = this.tabs[this.currentTabIndex];
    if (currentTab) {
      currentTab.closeAccordion();
      this.resetProgress(currentTab);
    }

    // Move to next tab
    this.currentTabIndex = (this.currentTabIndex + 1) % this.tabs.length;

    // Open next tab
    const nextTab = this.tabs[this.currentTabIndex];
    if (nextTab) {
      nextTab.openAccordion();

      // Start progress animation for new tab
      this.startProgressAnimation(nextTab);
    }
  }

  private startProgressAnimation(tab: HTMLDetailsElement): void {
    const animation = gsap.to(tab, {
      [this.PROGRESS_BAR_CSS_VAR]: 1,
      duration: this.autoplayTimer / 1000,
      ease: 'none',
    });
    this.progressAnimations.set(tab, animation);
  }

  public destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    this.tabs.forEach((tab) => {
      const animation = this.progressAnimations.get(tab);
      if (animation) {
        animation.kill();
      }
      this.resetProgress(tab);
    });

    this.progressAnimations.clear();
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
