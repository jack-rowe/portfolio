import Matter from "matter-js";

const DEFAULT_RADIUS = 14;
const RIM_COLOR = "#0a0a0a";
const SHADOW_COLOR = "#000000";

// Physics tuning
const MAGNETISM_RANGE_MULT = 2; // hole "gravity" reach (x hole radius)
const MAGNETISM_STRENGTH = 0.00018; // base attraction force
const CAPTURE_RADIUS_MULT = 0.55; // ball center must be within this fraction of radius
const CAPTURE_SPEED = 3.2; // ball must be slower than this to drop
const LIP_DEFLECT = 0.0001; // sideways nudge for fast lip-outs
const MIN_SPEED_FACTOR = 0.15;
const SPEED_FACTOR_DIVISOR = 8;

// Visual constants
const SHADOW_X_OFFSET = 1;
const SHADOW_Y_OFFSET = 2;
const SHADOW_RADIUS_PAD = 2;
const HIGHLIGHT_INSET = 0.3;
const HIGHLIGHT_INNER = 0.2;
const FLAG_HEIGHT = 38;
const FLAG_WIDTH = 18;
const FLAG_DROOP = 5;
const FLAG_BOTTOM = 10;

export type HoleResult = "in" | "lip-out" | "none";

export class Hole {
  readonly sensor: Matter.Body;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  private _captured = false;

  constructor(x: number, y: number, radius: number = DEFAULT_RADIUS) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.sensor = Matter.Bodies.circle(x, y, radius, {
      isStatic: true,
      isSensor: true,
      label: "hole",
      render: { fillStyle: RIM_COLOR },
    });
  }

  get captured() {
    return this._captured;
  }

  /** Draw the visual hole (shadow + rim) on the render context. */
  draw(ctx: CanvasRenderingContext2D) {
    // Outer shadow ring (depth)
    ctx.save();
    ctx.fillStyle = SHADOW_COLOR;
    ctx.beginPath();
    ctx.arc(
      this.x + SHADOW_X_OFFSET,
      this.y + SHADOW_Y_OFFSET,
      this.radius + SHADOW_RADIUS_PAD,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Hole interior (deep black)
    const grad = ctx.createRadialGradient(
      this.x - this.radius * HIGHLIGHT_INSET,
      this.y - this.radius * HIGHLIGHT_INSET,
      this.radius * HIGHLIGHT_INNER,
      this.x,
      this.y,
      this.radius,
    );
    grad.addColorStop(0, "#1a1a1a");
    grad.addColorStop(1, "#000000");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Subtle rim highlight
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius - 1, 0, Math.PI * 2);
    ctx.stroke();

    // Flag pole + flag
    const poleX = this.x;
    const poleTop = this.y - FLAG_HEIGHT;
    ctx.strokeStyle = "#dddddd";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(poleX, this.y);
    ctx.lineTo(poleX, poleTop);
    ctx.stroke();

    ctx.fillStyle = "#e63946";
    ctx.beginPath();
    ctx.moveTo(poleX, poleTop);
    ctx.lineTo(poleX + FLAG_WIDTH, poleTop + FLAG_DROOP);
    ctx.lineTo(poleX, poleTop + FLAG_BOTTOM);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Apply hole physics to ball each tick. Returns:
   *   "in"      → ball was captured (sunk this tick)
   *   "lip-out" → ball was attracted but escaped at speed
   *   "none"    → no interaction
   */
  update(ballBody: Matter.Body): HoleResult {
    if (this._captured) return "none";

    const dx = this.x - ballBody.position.x;
    const dy = this.y - ballBody.position.y;
    const dist = Math.hypot(dx, dy);
    const speed = Math.hypot(ballBody.velocity.x, ballBody.velocity.y);

    if (dist > this.radius * MAGNETISM_RANGE_MULT) return "none";

    // Capture: ball is centered enough & slow enough
    if (dist < this.radius * CAPTURE_RADIUS_MULT && speed < CAPTURE_SPEED) {
      this._captured = true;
      Matter.Body.setVelocity(ballBody, { x: 0, y: 0 });
      Matter.Body.setPosition(ballBody, { x: this.x, y: this.y });
      return "in";
    }

    if (dist < 0.001) return "none";

    // Magnetism: pull toward center, scaled inversely by speed (slow balls get pulled harder)
    const overlap = 1 - dist / (this.radius * MAGNETISM_RANGE_MULT);
    const speedFactor = Math.max(
      MIN_SPEED_FACTOR,
      1 - speed / SPEED_FACTOR_DIVISOR,
    );
    const pull = MAGNETISM_STRENGTH * overlap * speedFactor;
    Matter.Body.applyForce(ballBody, ballBody.position, {
      x: (dx / dist) * pull,
      y: (dy / dist) * pull,
    });

    // Lip-out: fast ball clipping the rim — small tangential nudge for visual flair
    let result: HoleResult = "none";
    if (
      speed > CAPTURE_SPEED &&
      dist < this.radius &&
      dist > this.radius * CAPTURE_RADIUS_MULT
    ) {
      // tangential (perpendicular to ball→hole vector)
      const tx = -dy / dist;
      const ty = dx / dist;
      // sign: nudge in direction of current motion to make it curl out
      const sign =
        ballBody.velocity.x * tx + ballBody.velocity.y * ty >= 0 ? 1 : -1;
      Matter.Body.applyForce(ballBody, ballBody.position, {
        x: tx * LIP_DEFLECT * sign,
        y: ty * LIP_DEFLECT * sign,
      });
      result = "lip-out";
    }

    return result;
  }
}
