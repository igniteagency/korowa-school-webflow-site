// Deliberately small, server-free DOM double. It does not model browser fetching/layout.
export class ElementDouble {
  nodeType = 1;
  attrs = new Map<string, string>();
  children: ElementDouble[] = [];
  parentElement: ElementDouble | null = null;
  listeners = new Map<string, (() => void)[]>();
  writes: string[] = [];
  clientWidth = 300;
  clientHeight = 200;
  bounds = { width: 300, height: 200 };
  isConnected = true;
  visible = true;
  constructor(
    public tagName = 'IMG',
    attrs: Record<string, string> = {}
  ) {
    Object.entries(attrs).forEach(([key, value]) => this.attrs.set(key, value));
  }
  get className() {
    return this.getAttribute('class') || '';
  }
  set className(value: string) {
    this.setAttribute('class', value);
  }
  get classList() {
    return {
      contains: (value: string) => this.className.split(/\s+/).includes(value),
      add: (value: string) => {
        this.className += ` ${value}`;
      },
      remove: (value: string) => {
        this.className = this.className
          .split(/\s+/)
          .filter((v) => v !== value)
          .join(' ');
      },
    };
  }
  get src() {
    return this.getAttribute('src') || '';
  }
  get open() {
    return this.hasAttribute('open');
  }
  set open(value: boolean) {
    value ? this.setAttribute('open', '') : this.removeAttribute('open');
  }
  get innerHTML() {
    return '';
  }
  set innerHTML(_value: string) {
    this.children = [];
  }
  getAttribute(name: string) {
    return this.attrs.get(name) ?? null;
  }
  hasAttribute(name: string) {
    return this.attrs.has(name);
  }
  setAttribute(name: string, value: string) {
    this.attrs.set(name, String(value));
    this.writes.push(name);
  }
  removeAttribute(name: string) {
    this.attrs.delete(name);
    this.writes.push(name);
  }
  getBoundingClientRect() {
    return this.bounds;
  }
  getClientRects() {
    return this.visible ? [this.bounds] : [];
  }
  checkVisibility() {
    return this.visible;
  }
  matches(selector: string): boolean {
    return selector.split(',').some((part) => {
      const pieces = part.trim().split(/\s+/);
      const last = pieces.pop()!;
      const tag = last.match(/^[a-z]+/i)?.[0];
      if (tag && tag.toUpperCase() !== this.tagName) return false;
      for (const [, name] of last.matchAll(/\.([\w-]+)/g))
        if (!this.classList.contains(name)) return false;
      for (const [, name, value] of last.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)) {
        if (!this.hasAttribute(name) || (value !== undefined && this.getAttribute(name) !== value))
          return false;
      }
      return !pieces.length || !!this.parentElement?.closest(pieces.join(' '));
    });
  }
  closest(selector: string): ElementDouble | null {
    return this.matches(selector) ? this : this.parentElement?.closest(selector) || null;
  }
  querySelectorAll(selector: string): ElementDouble[] {
    return this.children.flatMap((child) => [
      ...(child.matches(selector) ? [child] : []),
      ...child.querySelectorAll(selector),
    ]);
  }
  querySelector(selector: string) {
    return this.querySelectorAll(selector)[0] || null;
  }
  appendChild(child: ElementDouble) {
    if (child.parentElement)
      child.parentElement.children = child.parentElement.children.filter((node) => node !== child);
    child.parentElement = this;
    this.children.push(child);
    return child;
  }
  remove() {
    if (this.parentElement)
      this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
  }
  cloneNode() {
    return new ElementDouble(this.tagName, Object.fromEntries(this.attrs));
  }
  addEventListener(name: string, callback: () => void) {
    this.listeners.set(name, [...(this.listeners.get(name) || []), callback]);
  }
  emit(name: string) {
    this.listeners.get(name)?.forEach((callback) => callback());
  }
}

export class ObserverDouble {
  static instances: ObserverDouble[] = [];
  targets: { target: unknown; options: any }[] = [];
  constructor(public callback: (records: any[]) => void) {
    ObserverDouble.instances.push(this);
  }
  observe(target: unknown, options?: any) {
    this.targets.push({ target, options });
  }
  unobserve(target: unknown) {
    this.targets = this.targets.filter((entry) => entry.target !== target);
  }
  disconnect() {
    this.targets = [];
  }
}
