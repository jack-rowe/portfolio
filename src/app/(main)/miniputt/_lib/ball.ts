import Matter from "matter-js";

const DEFAULT_RADIUS = 9;
const DEFAULT_COLOR = "#ffffff";

export class Ball {
  readonly body: Matter.Body;

  constructor(
    x: number,
    y: number,
    radius: number = DEFAULT_RADIUS,
    color: string = DEFAULT_COLOR,
  ) {
    this.body = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.55, // lively but not pinball
      friction: 0.02, // contact friction with walls
      frictionAir: 0.028, // putting-green roll resistance
      density: 0.002,
      slop: 0.01,
      label: "ball",
      render: {
        fillStyle: color,
        strokeStyle: "#dddddd",
        lineWidth: 1,
      },
    });
  }

  applyForce(forceX: number, forceY: number) {
    Matter.Body.applyForce(this.body, this.body.position, {
      x: forceX,
      y: forceY,
    });
  }

  reset(x: number, y: number) {
    Matter.Body.setPosition(this.body, { x, y });
    Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(this.body, 0);
  }

  stop() {
    Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(this.body, 0);
  }

  get position() {
    return this.body.position;
  }

  get speed() {
    const { x, y } = this.body.velocity;
    return Math.hypot(x, y);
  }
}
