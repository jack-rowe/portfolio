import { useEffect, type RefObject } from "react";
import Matter from "matter-js";
import type { Ball } from "../_lib/ball";

const MAX_DRAG = 130; // px — max pull-back distance
const MAX_FORCE = 0.05; // matter-js force units at full power (uncontrolled)
const POWER_EXPONENT = 2.4; // >1 = soft low end, explosive high end
const BALL_HIT_RADIUS_MULTIPLIER = 3; // click target is 3× ball radius
const DEFAULT_BALL_RADIUS = 9;
const MIN_SPEED_TO_PUTT = 0.3; // don't allow another putt until ball slows
const MIN_SHOT_DIST = 3; // px — ignore accidental clicks
const DASH_SIZE = 5;
const ARROW_MAX_LEN = 55;
const HUE_GREEN = 120;
const ARROW_HEAD_LEN = 8;
const ARROW_HEAD_SPREAD = 6; // divisor for PI, giving PI/6
const POWER_BAR_X = 10;
const POWER_BAR_BOTTOM_OFFSET = 28;
const POWER_BAR_W = 130;
const POWER_BAR_H = 14;

type DragState = {
  active: boolean;
  x: number;
  y: number;
};

export type UsePuttingOptions = {
  /** Called once a shot is committed (mouseup w/ enough drag). */
  onShoot?: () => void;
  /** When false, input is ignored (e.g. between holes). */
  enabled?: boolean;
  /** Re-attach handlers when this changes (e.g. on hole load). */
  resetKey?: number | string;
};

export function usePutting(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  renderRef: RefObject<Matter.Render | null>,
  ballRef: RefObject<Ball | null>,
  options: UsePuttingOptions = {},
) {
  const { onShoot, enabled = true, resetKey } = options;
  useEffect(() => {
    if (!enabled) return () => {};
    const canvasRaw = canvasRef.current;
    const renderRaw = renderRef.current;
    if (!canvasRaw || !renderRaw) return () => {};

    // Create explicitly typed aliases — TypeScript doesn't narrow const across closure boundaries
    const canvas: HTMLCanvasElement = canvasRaw;
    const render: Matter.Render = renderRaw;

    const drag: DragState = { active: false, x: 0, y: 0 };

    function toCanvasPos(clientX: number, clientY: number) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height),
      };
    }

    function onMouseDown(e: MouseEvent) {
      const b = ballRef.current;
      if (!b) return;
      if (b.speed > MIN_SPEED_TO_PUTT) return;

      const pos = toCanvasPos(e.clientX, e.clientY);
      const hitRadius =
        (b.body.circleRadius ?? DEFAULT_BALL_RADIUS) *
        BALL_HIT_RADIUS_MULTIPLIER;

      if (Math.hypot(pos.x - b.position.x, pos.y - b.position.y) <= hitRadius) {
        drag.active = true;
        drag.x = pos.x;
        drag.y = pos.y;
      }
    }

    function onMouseMove(e: MouseEvent) {
      if (!drag.active) return;
      const b = ballRef.current;
      if (!b) return;

      const pos = toCanvasPos(e.clientX, e.clientY);
      const bp = b.position;
      const dx = pos.x - bp.x;
      const dy = pos.y - bp.y;
      const dist = Math.hypot(dx, dy);

      if (dist > MAX_DRAG) {
        drag.x = bp.x + (dx / dist) * MAX_DRAG;
        drag.y = bp.y + (dy / dist) * MAX_DRAG;
      } else {
        drag.x = pos.x;
        drag.y = pos.y;
      }
    }

    function onMouseUp() {
      if (!drag.active) return;
      drag.active = false;

      const b = ballRef.current;
      if (!b) return;

      const bp = b.position;
      const dx = bp.x - drag.x;
      const dy = bp.y - drag.y;
      const dist = Math.hypot(dx, dy);
      if (dist < MIN_SHOT_DIST) return;

      const linearPower = dist / MAX_DRAG;
      const curvedPower = linearPower ** POWER_EXPONENT;
      b.applyForce(
        (dx / dist) * curvedPower * MAX_FORCE,
        (dy / dist) * curvedPower * MAX_FORCE,
      );
      onShoot?.();
    }

    function drawOverlay() {
      if (!drag.active) return;
      const b = ballRef.current;
      if (!b) return;

      const ctx = render.context;
      const bp = b.position;
      const dx = bp.x - drag.x;
      const dy = bp.y - drag.y;
      const dist = Math.hypot(dx, dy);
      const linearPower = dist / MAX_DRAG;
      const power = linearPower ** POWER_EXPONENT; // matches force curve

      ctx.save();

      // Dashed pull-back line
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([DASH_SIZE, DASH_SIZE]);
      ctx.beginPath();
      ctx.moveTo(drag.x, drag.y);
      ctx.lineTo(bp.x, bp.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Shot direction arrow
      if (dist > MIN_SHOT_DIST) {
        const ndx = dx / dist;
        const ndy = dy / dist;
        const arrowLen = power * ARROW_MAX_LEN;
        const ax = bp.x + ndx * arrowLen;
        const ay = bp.y + ndy * arrowLen;

        const hue = Math.round((1 - power) * HUE_GREEN);
        const arrowColor = `hsl(${hue},100%,55%)`;

        ctx.strokeStyle = arrowColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bp.x, bp.y);
        ctx.lineTo(ax, ay);
        ctx.stroke();

        const angle = Math.atan2(ndy, ndx);
        ctx.fillStyle = arrowColor;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(
          ax - ARROW_HEAD_LEN * Math.cos(angle - Math.PI / ARROW_HEAD_SPREAD),
          ay - ARROW_HEAD_LEN * Math.sin(angle - Math.PI / ARROW_HEAD_SPREAD),
        );
        ctx.lineTo(
          ax - ARROW_HEAD_LEN * Math.cos(angle + Math.PI / ARROW_HEAD_SPREAD),
          ay - ARROW_HEAD_LEN * Math.sin(angle + Math.PI / ARROW_HEAD_SPREAD),
        );
        ctx.closePath();
        ctx.fill();
      }

      // Power meter bar
      const barY = canvas.height - POWER_BAR_BOTTOM_OFFSET;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(POWER_BAR_X, barY, POWER_BAR_W, POWER_BAR_H);

      const fillHue = Math.round((1 - power) * HUE_GREEN);
      ctx.fillStyle = `hsl(${fillHue},100%,50%)`;
      ctx.fillRect(POWER_BAR_X, barY, POWER_BAR_W * power, POWER_BAR_H);

      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(POWER_BAR_X, barY, POWER_BAR_W, POWER_BAR_H);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("POWER", POWER_BAR_X + 2, barY - 4);

      ctx.restore();
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      const b = ballRef.current;
      if (!b) return;
      if (b.speed > MIN_SPEED_TO_PUTT) return;

      const touch = e.touches[0];
      const pos = toCanvasPos(touch.clientX, touch.clientY);
      const hitRadius =
        (b.body.circleRadius ?? DEFAULT_BALL_RADIUS) *
        BALL_HIT_RADIUS_MULTIPLIER;

      if (Math.hypot(pos.x - b.position.x, pos.y - b.position.y) <= hitRadius) {
        drag.active = true;
        drag.x = pos.x;
        drag.y = pos.y;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (!drag.active || e.touches.length !== 1) return;
      e.preventDefault();
      const b = ballRef.current;
      if (!b) return;

      const touch = e.touches[0];
      const pos = toCanvasPos(touch.clientX, touch.clientY);
      const bp = b.position;
      const dx = pos.x - bp.x;
      const dy = pos.y - bp.y;
      const dist = Math.hypot(dx, dy);

      if (dist > MAX_DRAG) {
        drag.x = bp.x + (dx / dist) * MAX_DRAG;
        drag.y = bp.y + (dy / dist) * MAX_DRAG;
      } else {
        drag.x = pos.x;
        drag.y = pos.y;
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (!drag.active) return;
      e.preventDefault();
      onMouseUp(); // drag coords already set by last touchmove
    }

    Matter.Events.on(render, "afterRender", drawOverlay);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    globalThis.addEventListener("mousemove", onMouseMove);
    globalThis.addEventListener("mouseup", onMouseUp);

    return () => {
      Matter.Events.off(render, "afterRender", drawOverlay);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      globalThis.removeEventListener("mousemove", onMouseMove);
      globalThis.removeEventListener("mouseup", onMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, resetKey]); // re-attach when world is rebuilt
}
