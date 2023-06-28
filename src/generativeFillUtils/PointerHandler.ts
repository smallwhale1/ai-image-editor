import { Point } from "./generativeFillInterfaces";

export class PointerHandler {
  static getPointRelativeToElement = (
    element: HTMLElement,
    e: React.PointerEvent | PointerEvent,
    scale: number
  ): Point => {
    const boundingBox = element.getBoundingClientRect();
    return {
      x: (e.clientX - boundingBox.x) / scale,
      y: (e.clientY - boundingBox.y) / scale,
    };
  };
}
