import { useRef, useEffect } from "react";

const offscreenCanvasSize = 1024;
const offscreenCanvas = document.createElement("canvas");
offscreenCanvas.width = offscreenCanvasSize;
offscreenCanvas.height = offscreenCanvasSize;

function CanvasDrawing() {
  const canvasRef = useRef(null);
  const circleRadius = 10;
  const visibleCanvasSize = 512;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const offscreenCtx = offscreenCanvas.getContext("2d");

    const handleMouseDown = (event) => {
      const { offsetX, offsetY } = event.nativeEvent;

      // Adjust coordinates to offscreen canvas size
      const adjustedX = (offsetX * offscreenCanvasSize) / visibleCanvasSize;
      const adjustedY = (offsetY * offscreenCanvasSize) / visibleCanvasSize;

      // Draw circle on the offscreen canvas
      offscreenCtx.beginPath();
      offscreenCtx.arc(adjustedX, adjustedY, circleRadius, 0, 2 * Math.PI);
      offscreenCtx.fillStyle = "black";
      offscreenCtx.fill();

      // Clear and redraw the visible canvas
      ctx.clearRect(0, 0, visibleCanvasSize, visibleCanvasSize);
      ctx.drawImage(
        offscreenCanvas,
        0,
        0,
        offscreenCanvasSize,
        offscreenCanvasSize,
        0,
        0,
        visibleCanvasSize,
        visibleCanvasSize
      );
    };

    canvas.addEventListener("mousedown", handleMouseDown);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
    };
  }, [canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      width={visibleCanvasSize}
      height={visibleCanvasSize}
    />
  );
}

export default CanvasDrawing;
