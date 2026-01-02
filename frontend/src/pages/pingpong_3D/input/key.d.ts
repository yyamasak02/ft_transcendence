export type KeyHandler<T = void> = (
  keys: Record<string, boolean>,
  args?: T,
) => void;

export interface KeyboardHandlers {
  onKeyDown?: KeyHandler;
  onKeyUp?: KeyHandler;
  onResize?: (...args: any[]) => void;
}
