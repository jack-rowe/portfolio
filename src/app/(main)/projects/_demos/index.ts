import { EasyHistoryDemo } from "./EasyHistoryDemo";
import { TaskListDemo } from "./TaskListDemo";
import type { ComponentType } from "react";

export const DEMOS: Record<string, ComponentType> = {
  "easy-history": EasyHistoryDemo,
  "task-list": TaskListDemo,
};
