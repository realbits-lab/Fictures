import { nanoid } from "nanoid";

export { cn } from "./cn";

export function generateId(length?: number): string {
  return nanoid(length);
}