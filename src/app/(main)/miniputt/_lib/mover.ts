import Matter from "matter-js";
import { Wall } from "./wall";

export type MoverSpec = {
  /** Position when phase=0. */
  from: { x: number; y: number };
  /** Position when phase=0.5. */
  to: { x: number; y: number };
  w: number;
  h: number;
  /** Full oscillation period in ms (from → to → from). */
  period: number;
  /** 0..1 starting offset within the cycle. */
  phase?: number;
  angle?: number;
  color?: string;
};

const HALF_CYCLE = 0.5;
const TWO_PI = Math.PI * 2;

export class Mover {
  readonly wall: Wall;
  private readonly spec: MoverSpec;
  private readonly startTime: number;

  constructor(spec: MoverSpec) {
    this.spec = spec;
    this.startTime = performance.now();

    // Initial position at phase 0
    const phase = spec.phase ?? 0;
    const t = (Math.sin(phase * TWO_PI - Math.PI / 2) + 1) * HALF_CYCLE;
    const x = spec.from.x + (spec.to.x - spec.from.x) * t;
    const y = spec.from.y + (spec.to.y - spec.from.y) * t;
    this.wall = new Wall(x, y, spec.w, spec.h, {
      angle: spec.angle,
      color: spec.color ?? "#5a3a1a",
    });
  }

  update(now: number) {
    const phase = this.spec.phase ?? 0;
    const cycle =
      ((((now - this.startTime) / this.spec.period + phase) % 1) + 1) % 1;
    // Smooth ease in/out via sine: 0→1→0 over the period
    const t = (Math.sin(cycle * TWO_PI - Math.PI / 2) + 1) * HALF_CYCLE;
    const x = this.spec.from.x + (this.spec.to.x - this.spec.from.x) * t;
    const y = this.spec.from.y + (this.spec.to.y - this.spec.from.y) * t;
    Matter.Body.setPosition(this.wall.body, { x, y });
  }
}
