import { FieldComponent } from "./FieldComponent";

export class Ball extends FieldComponent {
  private _radius: number = 10;
  private _startAngle: number = 0;
  private _endAngle: number = Math.PI * 2;

  override profile(): Record<string, number> {
    return {
      ...super.profile(),
      radius: this._radius,
      startAngle: this._startAngle,
      endAngle: this._endAngle,
    };
  }

  ballSpec(): [number, number, number, number, number] {
    return [this._x, this._y, this._radius, this._startAngle, this._endAngle];
  }
}
