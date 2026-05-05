import Matter from "matter-js";

const WATER_LABEL = "water";
const SAFETY_PAD = 1; // shrink sensor slightly so visual edge feels generous

export type WaterSpec = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export class Water {
  readonly sensor: Matter.Body;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;

  constructor(spec: WaterSpec) {
    this.x = spec.x;
    this.y = spec.y;
    this.w = spec.w;
    this.h = spec.h;
    this.sensor = Matter.Bodies.rectangle(
      spec.x,
      spec.y,
      spec.w - SAFETY_PAD,
      spec.h - SAFETY_PAD,
      {
        isStatic: true,
        isSensor: true,
        label: WATER_LABEL,
        render: { visible: false },
      },
    );
  }

  /** Returns true if the ball center is inside this water region. */
  contains(body: Matter.Body): boolean {
    return (
      Math.abs(body.position.x - this.x) < this.w / 2 &&
      Math.abs(body.position.y - this.y) < this.h / 2
    );
  }

  /** Draw stylized water. */
  draw(ctx: CanvasRenderingContext2D, time: number) {
    const left = this.x - this.w / 2;
    const top = this.y - this.h / 2;

    ctx.save();

    // Base water
    const grad = ctx.createLinearGradient(left, top, left, top + this.h);
    grad.addColorStop(0, "#1e88e5");
    grad.addColorStop(1, "#0d47a1");
    ctx.fillStyle = grad;
    ctx.fillRect(left, top, this.w, this.h);

    // Animated wave shimmer
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    const waveCount = 3;
    const amplitude = 2;
    const wavelength = 22;
    for (let i = 1; i <= waveCount; i++) {
      const y = top + (this.h * i) / (waveCount + 1);
      const offset = (time / 700 + i * 0.6) % 1;
      ctx.beginPath();
      for (let x = left; x <= left + this.w; x += 4) {
        const dy =
          Math.sin((x / wavelength + offset) * Math.PI * 2) * amplitude;
        if (x === left) ctx.moveTo(x, y + dy);
        else ctx.lineTo(x, y + dy);
      }
      ctx.stroke();
    }

    // Edge
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(left, top, this.w, this.h);

    ctx.restore();
  }
}
