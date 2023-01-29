export class EventBus extends EventTarget {
  subscribe<T>(type: string, callback: (ev: CustomEvent<T>) => void) {
    this.addEventListener(type, callback as any);
    return () => this.removeEventListener(type, callback as any);
  }

  trigger<T>(type: string, detail?: T) {
    const event = new CustomEvent(type, { detail });
    return this.dispatchEvent(event);
  }
}
