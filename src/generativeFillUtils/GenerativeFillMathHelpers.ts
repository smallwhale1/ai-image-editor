import { Point } from "./generativeFillInterfaces";

export class GenerativeFillMathHelpers {
  // math helpers
  static distanceBetween = (p1: Point, p2: Point) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };
  static angleBetween = (p1: Point, p2: Point) => {
    return Math.atan2(p2.x - p1.x, p2.y - p1.y);
  };
}
