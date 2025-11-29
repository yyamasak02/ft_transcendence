// src/core/Ball.ts

import { BALL_SIZE } from "./constants";

export interface BallState {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  power: number;
}

export class Ball {
  private _x: number;
  private _y: number;
  private _size: number;
  private _speedX: number;
  private _speedY: number;
  private _power: number;

  constructor(
    x: number = 0,
    y: number = 0,
    size: number = BALL_SIZE,
    speedX: number = 0,
    speedY: number = 0,
    power: number = 1,
  ) {
    this._x = x;
    this._y = y;
    this._size = size;
    this._speedX = speedX;
    this._speedY = speedY;
    this._power = power;
  }

  // Getters
  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get size(): number {
    return this._size;
  }

  get speedX(): number {
    return this._speedX;
  }

  get speedY(): number {
    return this._speedY;
  }

  get power(): number {
    return this._power;
  }

  // Setters
  set x(value: number) {
    this._x = value;
  }

  set y(value: number) {
    this._y = value;
  }

  set size(value: number) {
    this._size = value;
  }

  set speedX(value: number) {
    this._speedX = value;
  }

  set speedY(value: number) {
    this._speedY = value;
  }

  set power(value: number) {
    this._power = value;
  }

  /**
   * ボールの位置を更新する
   */
  update(frameMultiplier: number): void {
    this._x += this._speedX * frameMultiplier;
    this._y += this._speedY * frameMultiplier;
  }

  /**
   * ボールの中心座標を取得する
   */
  getCenterX(): number {
    return this._x + this._size / 2;
  }

  getCenterY(): number {
    return this._y + this._size / 2;
  }

  /**
   * ボールを初期位置にリセットする
   */
  reset(centerX: number, centerY: number): void {
    this._x = centerX;
    this._y = centerY;
    this._speedX = 0;
    this._speedY = 0;
    this._power = 1;
  }

  /**
   * Y方向の速度を反転する
   */
  reverseSpeedY(): void {
    this._speedY = -this._speedY;
  }

  /**
   * 速度を設定する
   */
  setSpeed(speedX: number, speedY: number): void {
    this._speedX = speedX;
    this._speedY = speedY;
  }

  /**
   * ボールの状態をオブジェクトとして取得する（シリアライズやデバッグ用）
   */
  getState(): BallState {
    return {
      x: this._x,
      y: this._y,
      size: this._size,
      speedX: this._speedX,
      speedY: this._speedY,
      power: this._power,
    };
  }
}
