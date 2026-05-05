import Matter from "matter-js";

const DEFAULT_COLOR = "#3d2914";
const BOUNDARY_COLOR = "#2d5a27";

export type WallSpec = {
  x: number;
  y: number;
  w: number;
  h: number;
  angle?: number;
  color?: string;
};

export class Wall {
  readonly body: Matter.Body;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    options: { angle?: number; color?: string } = {},
  ) {
    const { angle = 0, color = DEFAULT_COLOR } = options;
    this.body = Matter.Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      angle,
      restitution: 0.65,
      friction: 0.1,
      label: "wall",
      render: { fillStyle: color, strokeStyle: "#000", lineWidth: 1 },
    });
  }

  static fromSpec(spec: WallSpec): Wall {
    return new Wall(spec.x, spec.y, spec.w, spec.h, {
      angle: spec.angle,
      color: spec.color,
    });
  }

  /** Build the four boundary walls for a given canvas size. */
  static boundaries(width: number, height: number, thickness = 50): Wall[] {
    return [
      new Wall(width / 2, height + thickness / 2, width, thickness, {
        color: BOUNDARY_COLOR,
      }),
      new Wall(width / 2, -thickness / 2, width, thickness, {
        color: BOUNDARY_COLOR,
      }),
      new Wall(-thickness / 2, height / 2, thickness, height, {
        color: BOUNDARY_COLOR,
      }),
      new Wall(width + thickness / 2, height / 2, thickness, height, {
        color: BOUNDARY_COLOR,
      }),
    ];
  }
}
