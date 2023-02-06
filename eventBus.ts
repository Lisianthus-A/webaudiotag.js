type Listener = (...args: any[]) => void;

class EventBus {
  listenerMap: Record<string, any[]>;

  constructor() {
    this.listenerMap = {};
  }

  on(type: string, listener: Listener) {
    const { listenerMap } = this;
    if (listenerMap[type]) {
      listenerMap[type].push(listener);
    } else {
      listenerMap[type] = [listener];
    }
  }

  off(type: string, listener: Listener) {
    const listeners = this.listenerMap[type];
    if (!listeners) {
      return;
    }
    const index = listeners.indexOf(listener);
    index >= 0 && listeners.splice(index, 1);
  }

  emit(type: string, ...args: any[]) {
    const listeners = this.listenerMap[type];
    if (!listeners) {
      return;
    }

    listeners.forEach((listener) => {
      listener(...args);
    });
  }
}

export default EventBus;
