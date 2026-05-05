import Matter from "matter-js";
import { Ball } from "./ball";
import { Wall } from "./wall";
import { Hole } from "./hole";
import { Water } from "./water";
import { Mover } from "./mover";
import type { CourseHole } from "./courses";

export type MiniPuttWorld = {
  engine: Matter.Engine;
  render: Matter.Render;
  runner: Matter.Runner;
  ball: Ball;
  hole: Hole;
  cleanup: () => void;
};

type WorldEvents = {
  /** Fired when the ball drops in the hole. */
  onSink?: () => void;
  /** Fired the first frame the ball clips the rim too fast (visual only). */
  onLipOut?: () => void;
  /** Fired when the ball lands in water (penalty). */
  onWaterHit?: () => void;
};

const FELT_COLOR = "#1f7a3a"; // greens
const WATER_RECOVER_DELAY_MS = 350; // brief pause before resetting ball

export function createWorld(
  canvas: HTMLCanvasElement,
  course: CourseHole,
  events: WorldEvents = {},
): MiniPuttWorld {
  const engine = Matter.Engine.create({ gravity: { x: 0, y: 0 } });
  const { world } = engine;

  const render = Matter.Render.create({
    canvas,
    engine,
    options: {
      width: canvas.width,
      height: canvas.height,
      background: FELT_COLOR,
      wireframes: false,
    },
  });

  const runner = Matter.Runner.create();

  const boundaries = Wall.boundaries(canvas.width, canvas.height);
  const courseWalls = course.walls.map((spec) => Wall.fromSpec(spec));
  const waters = (course.waters ?? []).map((spec) => new Water(spec));
  const movers = (course.movers ?? []).map((spec) => new Mover(spec));
  const ball = new Ball(course.ballStart.x, course.ballStart.y);
  const hole = new Hole(course.hole.x, course.hole.y);

  Matter.Composite.add(world, [
    ...boundaries.map((w) => w.body),
    ...courseWalls.map((w) => w.body),
    ...waters.map((w) => w.sensor),
    ...movers.map((m) => m.wall.body),
    hole.sensor,
    ball.body,
  ]);

  let waterRecoverTimer: ReturnType<typeof setTimeout> | null = null;

  // Per-tick: hole physics, mover updates, water detection
  const onBeforeUpdate = () => {
    const now = performance.now();
    movers.forEach((m) => m.update(now));

    // Water check: only if ball isn't already being recovered or sunk
    if (!hole.captured && waterRecoverTimer === null) {
      for (const water of waters) {
        if (water.contains(ball.body)) {
          ball.stop();
          // Park the ball off-screen so it doesn't keep triggering
          Matter.Body.setPosition(ball.body, { x: -100, y: -100 });
          events.onWaterHit?.();
          waterRecoverTimer = setTimeout(() => {
            ball.reset(course.ballStart.x, course.ballStart.y);
            waterRecoverTimer = null;
          }, WATER_RECOVER_DELAY_MS);
          break;
        }
      }
    }

    const result = hole.update(ball.body);
    if (result === "in") {
      ball.stop();
      events.onSink?.();
    } else if (result === "lip-out") {
      events.onLipOut?.();
    }
  };
  Matter.Events.on(engine, "beforeUpdate", onBeforeUpdate);

  // Custom drawing: water (under) and hole/flag (over)
  const onAfterRender = () => {
    const ctx = render.context;
    const now = performance.now();
    waters.forEach((w) => w.draw(ctx, now));
    hole.draw(ctx);
  };
  Matter.Events.on(render, "afterRender", onAfterRender);

  hole.sensor.render.visible = false;

  Matter.Render.run(render);
  Matter.Runner.run(runner, engine);

  function cleanup() {
    if (waterRecoverTimer !== null) {
      clearTimeout(waterRecoverTimer);
      waterRecoverTimer = null;
    }
    Matter.Events.off(engine, "beforeUpdate", onBeforeUpdate);
    Matter.Events.off(render, "afterRender", onAfterRender);
    Matter.Render.stop(render);
    Matter.Runner.stop(runner);
    Matter.World.clear(world, false);
    Matter.Engine.clear(engine);
    if (render.canvas) {
      const ctx = render.canvas.getContext("2d");
      ctx?.clearRect(0, 0, render.canvas.width, render.canvas.height);
    }
  }

  return { engine, render, runner, ball, hole, cleanup };
}

export type { CourseHole } from "./courses";
export { COURSE, CANVAS_W, CANVAS_H } from "./courses";
