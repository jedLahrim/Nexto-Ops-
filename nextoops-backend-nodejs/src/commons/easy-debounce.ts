type EasyDebounceCallback = () => void;

class EasyDebounceOperation {
  callback: EasyDebounceCallback;
  timer: NodeJS.Timeout;

  constructor(callback: EasyDebounceCallback, timer: NodeJS.Timeout) {
    this.callback = callback;
    this.timer = timer;
  }
}

export class EasyDebounce {
  private static operations: Map<string, EasyDebounceOperation> = new Map();

  /**
   * Will delay the execution of `onExecute` with the given `duration`. If another call to
   * `debounce` with the same `tag` happens within this duration, the first call will be
   * cancelled and the debouncer will start waiting for another `duration` before executing
   * `onExecute`.
   *
   * `tag` is any arbitrary string, and is used to identify this particular debounce
   * operation in subsequent calls to `debounce` or `cancel`.
   *
   * If `duration` is 0, `onExecute` will be executed immediately, i.e., synchronously.
   */
  static debounce(tag: string, duration: number, onExecute: EasyDebounceCallback): void {
    if (duration === 0) {
      EasyDebounce.operations.get(tag)?.timer && clearTimeout(EasyDebounce.operations.get(tag)!.timer);
      EasyDebounce.operations.delete(tag);
      onExecute();
    } else {
      EasyDebounce.operations.get(tag)?.timer && clearTimeout(EasyDebounce.operations.get(tag)!.timer);

      const timer = setTimeout(() => {
        EasyDebounce.operations.get(tag)?.timer && clearTimeout(EasyDebounce.operations.get(tag)!.timer);
        EasyDebounce.operations.delete(tag);

        onExecute();
      }, duration);

      EasyDebounce.operations.set(tag, new EasyDebounceOperation(onExecute, timer));
    }
  }

  /**
   * Fires the callback associated with `tag` immediately. This does not cancel the debounce timer,
   * so if you want to invoke the callback and cancel the debounce timer, you must first call
   * `fire(tag)` and then `cancel(tag)`.
   */
  static fire(tag: string): void {
    EasyDebounce.operations.get(tag)?.callback();
  }

  /**
   * Cancels any active debounce operation with the given `tag`.
   */
  static cancel(tag: string): void {
    EasyDebounce.operations.get(tag)?.timer && clearTimeout(EasyDebounce.operations.get(tag)!.timer);
    EasyDebounce.operations.delete(tag);
  }

  /**
   * Cancels all active debouncers.
   */
  static cancelAll(): void {
    for (const operation of EasyDebounce.operations.values()) {
      clearTimeout(operation.timer);
    }
    EasyDebounce.operations.clear();
  }

  /**
   * Returns the number of active debouncers (debouncers that haven't yet called their
   * `onExecute` methods).
   */
  static count(): number {
    return EasyDebounce.operations.size;
  }
}
