export abstract class FieldComponent {
  private _x: number;
  private _y: number;
  private _dx: number;
  private _dy: number;

  constructor(x: number, y: number, dx: number, dy: number) {
    this._x = x;
    this._y = y;
    this._dx = dx;
    this._dy = dy;
  }
  profile(): Record<string, number> {
    return { x: this._x, y: this._y, dx: this._dx, dy: this._dy };
  }
  assign({
    x,
    y,
    dx,
    dy,
  }: {
    x: number;
    y: number;
    dx: number;
    dy: number;
  }): FieldComponent {
    this._x = x;
    this._y = y;
    this._dx = dx;
    this._dy = dy;
    return this;
  }

  get x(): number {
    return this._x;
  }
  get y(): number {
    return this._y;
  }
  get dx(): number {
    return this._dx;
  }
  get dy(): number {
    return this._dy;
  }

  set x(x: number) {
    this._x = x;
  }
  set y(y: number) {
    this._y = y;
  }
  set dx(dx: number) {
    this._dx = dx;
  }
  set dy(dy: number) {
    this._dy = dy;
  }
}
