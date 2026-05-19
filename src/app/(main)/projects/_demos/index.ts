import { CanvasDrawDemo } from "./CanvasDrawDemo";
import { EasyHistoryDemo } from "./EasyHistoryDemo";
import { TaskListDemo } from "./TaskListDemo";
import type { ComponentType } from "react";

export const DEMOS: Record<string, ComponentType> = {
  "canvas-draw": CanvasDrawDemo,
  counter: EasyHistoryDemo,
  "task-list": TaskListDemo,
};
