import confetti from 'canvas-confetti';

type ConfettiTrigger = 'click' | 'scroll';

class ConfettiPop {
  private container: HTMLElement;
  private trigger: ConfettiTrigger;

  private readonly CONFETTI_CONTAINER_SELECTOR = '[data-confetti]';
  private readonly TRIGGER_ATTR = 'data-confetti-trigger';

  constructor() {
    const container = document.querySelector(this.CONFETTI_CONTAINER_SELECTOR);
    if (!container) {
      console.warn('Confetti: No container found with selector', this.CONFETTI_CONTAINER_SELECTOR);
      return;
    }
    this.container = container;

    this.trigger = (container.getAttribute(this.TRIGGER_ATTR) as ConfettiTrigger) || 'scroll';

    this.init();
  }

  private init() {
    if (this.trigger === 'click') {
      this.container.addEventListener('click', () => this.launchConfetti());
    } else if (this.trigger === 'scroll') {
      this.setupScrollListener();
    } else {
      console.warn('Confetti: Unknown trigger type', this.trigger);
    }
  }

  private setupScrollListener() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.launchConfetti();
            observer.unobserve(this.container);
          }
        });
      },
      { threshold: 0.7 }
    );

    observer.observe(this.container);
  }

  private launchConfetti() {
    window.IS_DEBUG_MODE && console.debug('launching confetti');

    confetti({
      particleCount: 200,
      spread: 180,
      origin: { y: 0.6 },
      disableForReducedMotion: true,
      colors: ['#b21e3b', '#31000a', '#293762', '#5ac5c9', '#b487ce', '#8aa1ff', '#f05682'],
    });
  }
}

new ConfettiPop();
