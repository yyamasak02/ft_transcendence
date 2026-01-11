export interface Vector2 {
  x: number;
  y: number;
}

export interface Ball {
  position: Vector2;
  velocity: Vector2;
  radius: number;
}

export interface Paddle {
  userId: string;
  y: number;
  height: number;
  speed: number;
}
