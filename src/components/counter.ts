import { CountUp } from 'countup.js';

const calculateDuration = (value: number): number => {
  const absValue = Math.abs(value);
  const baseDuration = Math.log10(absValue + 1) * 0.5 + 0.5;
  return Math.min(baseDuration, 3);
};

const initCounters = (): void => {
  const counterElements = document.querySelectorAll('[data-el="counter"]');

  counterElements.forEach((element) => {
    const textContent = element.textContent?.trim() || '0';
    const endValue = parseFloat(textContent.replace(/[^\d.-]/g, '')) || 0;
    const duration = calculateDuration(Math.abs(endValue));

    const countUp = new CountUp(element, endValue, {
      startVal: 0,
      duration,
      enableScrollSpy: true,
    });

    if (!countUp.error) {
      countUp.start();
    } else {
      console.error('CountUp error:', countUp.error);
    }
  });
};

initCounters();
