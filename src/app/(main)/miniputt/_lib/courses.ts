import type { WallSpec } from "./wall";
import type { WaterSpec } from "./water";
import type { MoverSpec } from "./mover";

/* eslint-disable sonarjs/no-magic-numbers */
// Course layouts are inherently coordinate-heavy; magic numbers here are layout data, not logic.

export type CourseHole = {
  number: number;
  par: number;
  name: string;
  ballStart: { x: number; y: number };
  hole: { x: number; y: number };
  walls: WallSpec[];
  waters?: WaterSpec[];
  movers?: MoverSpec[];
};

export const CANVAS_W = 600;
export const CANVAS_H = 500;

export const COURSE: CourseHole[] = [
  // 1. The Pinch — water funnels you into a narrow gap
  {
    number: 1,
    par: 3,
    name: "The Pinch",
    ballStart: { x: 300, y: 450 },
    hole: { x: 300, y: 80 },
    walls: [],
    waters: [
      { x: 90, y: 250, w: 130, h: 200 },
      { x: 510, y: 250, w: 130, h: 200 },
    ],
  },

  // 2. Threading — narrow shortcut between two pillars, or go around
  {
    number: 2,
    par: 3,
    name: "Threading",
    ballStart: { x: 300, y: 450 },
    hole: { x: 300, y: 70 },
    walls: [
      { x: 170, y: 250, w: 240, h: 14 },
      { x: 430, y: 250, w: 240, h: 14 },
      { x: 286, y: 250, w: 14, h: 60 },
      { x: 314, y: 250, w: 14, h: 60 },
    ],
    waters: [
      { x: 50, y: 380, w: 70, h: 90 },
      { x: 550, y: 380, w: 70, h: 90 },
    ],
  },

  // 3. Risky Cut — cross the lake for a direct line
  {
    number: 3,
    par: 3,
    name: "Risky Cut",
    ballStart: { x: 90, y: 440 },
    hole: { x: 510, y: 90 },
    walls: [
      { x: 60, y: 350, w: 14, h: 130 },
      { x: 220, y: 230, w: 320, h: 14 },
    ],
    waters: [{ x: 175, y: 360, w: 230, h: 130 }],
  },

  // 4. The Gate — sliding wall blocks the upper corridor
  {
    number: 4,
    par: 3,
    name: "The Gate",
    ballStart: { x: 510, y: 440 },
    hole: { x: 90, y: 90 },
    walls: [
      { x: 540, y: 350, w: 14, h: 130 },
      { x: 380, y: 230, w: 320, h: 14 },
    ],
    waters: [{ x: 425, y: 360, w: 230, h: 130 }],
    movers: [
      {
        from: { x: 230, y: 90 },
        to: { x: 110, y: 90 },
        w: 14,
        h: 90,
        period: 3200,
      },
    ],
  },

  // 5. Narrow Chute — sliding bar at the throat
  {
    number: 5,
    par: 3,
    name: "Narrow Chute",
    ballStart: { x: 300, y: 450 },
    hole: { x: 300, y: 70 },
    walls: [
      { x: 240, y: 280, w: 14, h: 250 },
      { x: 360, y: 280, w: 14, h: 250 },
    ],
    movers: [
      {
        from: { x: 270, y: 130 },
        to: { x: 330, y: 130 },
        w: 90,
        h: 14,
        period: 2200,
      },
    ],
  },

  // 6. Over the Drink — diagonal carry shot over water
  {
    number: 6,
    par: 3,
    name: "Over the Drink",
    ballStart: { x: 90, y: 440 },
    hole: { x: 510, y: 80 },
    walls: [{ x: 300, y: 270, w: 360, h: 14, angle: -Math.PI / 5 }],
    waters: [
      { x: 470, y: 410, w: 220, h: 110 },
      { x: 110, y: 130, w: 160, h: 100 },
    ],
  },

  // 7. Pendulum — sweeping arm in the gap
  {
    number: 7,
    par: 3,
    name: "Pendulum",
    ballStart: { x: 300, y: 460 },
    hole: { x: 300, y: 100 },
    walls: [
      { x: 170, y: 260, w: 200, h: 14 },
      { x: 430, y: 260, w: 200, h: 14 },
    ],
    movers: [
      {
        from: { x: 220, y: 200 },
        to: { x: 380, y: 200 },
        w: 120,
        h: 14,
        period: 1800,
      },
    ],
  },

  // 8. Island Green — water moat, narrow approach
  {
    number: 8,
    par: 3,
    name: "Island Green",
    ballStart: { x: 300, y: 460 },
    hole: { x: 300, y: 200 },
    walls: [
      { x: 270, y: 380, w: 14, h: 100 },
      { x: 330, y: 380, w: 14, h: 100 },
    ],
    waters: [
      { x: 300, y: 90, w: 420, h: 80 },
      { x: 130, y: 220, w: 80, h: 180 },
      { x: 470, y: 220, w: 80, h: 180 },
      { x: 130, y: 380, w: 80, h: 100 },
      { x: 470, y: 380, w: 80, h: 100 },
    ],
  },

  // 9. The Gauntlet — combo finale: lake shortcut + double mover
  {
    number: 9,
    par: 3,
    name: "The Gauntlet",
    ballStart: { x: 60, y: 450 },
    hole: { x: 540, y: 70 },
    walls: [
      { x: 200, y: 360, w: 14, h: 180 },
      { x: 400, y: 240, w: 14, h: 180 },
    ],
    waters: [{ x: 300, y: 300, w: 160, h: 110 }],
    movers: [
      {
        from: { x: 280, y: 230 },
        to: { x: 380, y: 230 },
        w: 110,
        h: 14,
        period: 2400,
      },
      {
        from: { x: 380, y: 380 },
        to: { x: 240, y: 380 },
        w: 110,
        h: 14,
        period: 2400,
        phase: 0.5,
      },
    ],
  },
];
