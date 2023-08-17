import { GenerativeFillMathHelpers } from "./GenerativeFillMathHelpers";
import { eraserColor } from "./generativeFillConstants";
import { Point } from "./generativeFillInterfaces";

export class BrushHandler {
  static brushCircle = (
    x: number,
    y: number,
    brushRadius: number,
    ctx: CanvasRenderingContext2D
  ) => {
    ctx.globalCompositeOperation = "destination-out";
    ctx.shadowColor = "#ffffffeb";
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(x, y, brushRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  };

  static brushCircleOverlay = (
    x: number,
    y: number,
    brushRadius: number,
    ctx: CanvasRenderingContext2D
  ) => {
    ctx.globalCompositeOperation = "destination-out";
    // ctx.globalCompositeOperation = erase ? "destination-out" : "source-over";
    ctx.shadowColor = eraserColor;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(x, y, brushRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  };

  static createBrushPath = (
    startPoint: Point,
    endPoint: Point,
    brushRadius: number,
    ctx: CanvasRenderingContext2D
  ) => {
    const dist = GenerativeFillMathHelpers.distanceBetween(
      startPoint,
      endPoint
    );

    for (let i = 0; i < dist; i += 5) {
      const s = i / dist;
      BrushHandler.brushCircle(
        startPoint.x * (1 - s) + endPoint.x * s,
        startPoint.y * (1 - s) + endPoint.y * s,
        brushRadius,
        ctx
      );
    }
  };

  static createBrushPathOverlay = (
    startPoint: Point,
    endPoint: Point,
    brushRadius: number,
    ctx: CanvasRenderingContext2D
  ) => {
    const dist = GenerativeFillMathHelpers.distanceBetween(
      startPoint,
      endPoint
    );

    for (let i = 0; i < dist; i += 5) {
      const s = i / dist;
      BrushHandler.brushCircleOverlay(
        startPoint.x * (1 - s) + endPoint.x * s,
        startPoint.y * (1 - s) + endPoint.y * s,
        brushRadius,
        ctx
      );
    }
  };
}
