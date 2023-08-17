import { RefObject } from "react";
import { OPENAI_KEY } from "../keys";
import { bgColor, canvasSize } from "./generativeFillConstants";

export interface APISuccess {
  status: "success";
  urls: string[];
}

export interface APIError {
  status: "error";
  message: string;
}

export interface PaddingInfo {
  imgWidth: number;
  imgHeight: number;
  offsetX: number;
  offsetY: number;
}

export class ImageUtility {
  static canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, "image/png");
    });
  };

  static getEdit = async (
    imgBlob: Blob,
    maskBlob: Blob,
    prompt: string,
    n?: number
  ): Promise<APISuccess | APIError> => {
    const apiUrl = "https://api.openai.com/v1/images/edits";
    const fd = new FormData();
    fd.append("image", imgBlob, "image.png");
    fd.append("mask", maskBlob, "mask.png");
    fd.append("prompt", prompt);
    fd.append("size", "1024x1024");
    fd.append("n", n ? JSON.stringify(n) : "1");
    fd.append("response_format", "b64_json");

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: fd,
      });
      const data = await res.json();
      console.log(data.data);
      return {
        status: "success",
        urls: (data.data as { b64_json: string }[]).map(
          (data) => `data:image/png;base64,${data.b64_json}`
        ),
      };
    } catch (err) {
      console.log(err);
      return { status: "error", message: "API error." };
    }
  };

  static mockGetEdit = async (): Promise<APISuccess | APIError> => {
    return {
      status: "success",
      urls: [
        "/assets/shiba.png",
        "/assets/souffle-dalle.png",
        "/assets/firefly.png",
      ],
    };
  };

  static getCanvasContext = (
    canvasRef: RefObject<HTMLCanvasElement>
  ): CanvasRenderingContext2D | null => {
    if (!canvasRef.current) return null;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return null;
    return ctx;
  };

  static downloadCanvas = (canvas: HTMLCanvasElement) => {
    const url = canvas.toDataURL();
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "canvas";
    downloadLink.click();
    downloadLink.remove();
  };

  static downloadImageCanvas = (imgUrl: string) => {
    const img = new Image();
    img.src = imgUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, canvasSize, canvasSize);

      this.downloadCanvas(canvas);
    };
  };

  static getCroppedImg = (
    img: HTMLImageElement,
    readablePaddingData: PaddingInfo,
    width: number,
    height: number
  ) => {
    if (img.naturalHeight > img.naturalWidth) {
      // horizontal padding, x offset
      const xOffset = (canvasSize - width) / 2;
    } else {
      // vertical padding, y offset
      const yOffset = (canvasSize - height) / 2;
    }
  };

  static drawImgToCanvas = (
    img: HTMLImageElement,
    canvasRef: React.RefObject<HTMLCanvasElement>,
    width: number,
    height: number,
    drawPadding?: boolean,
    mutablePaddingData?: React.MutableRefObject<PaddingInfo>,
    readablePaddingData?: PaddingInfo
  ) => {
    const drawImg = (img: HTMLImageElement) => {
      const ctx = this.getCanvasContext(canvasRef);
      if (!ctx) return;
      ctx.globalCompositeOperation = "source-over";
      // TODO: support more than square-shaped images
      const scale = Math.min(
        canvasSize / img.naturalWidth,
        canvasSize / img.naturalHeight
      );
      const finalWidth = img.naturalWidth * scale;
      const finalHeight = img.naturalHeight * scale;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
    };

    if (img.complete) {
      drawImg(img);
    } else {
      img.onload = () => {
        drawImg(img);
      };
    }
  };

  // The image must be loaded!
  static getCanvasImg = (
    img: HTMLImageElement
  ): HTMLCanvasElement | undefined => {
    const canvas = document.createElement("canvas");
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // fix scaling
    const scale = Math.min(canvasSize / img.width, canvasSize / img.height);
    const width = img.width * scale;
    const height = img.height * scale;
    ctx?.clearRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // extract and set padding data
    if (img.naturalHeight > img.naturalWidth) {
      // horizontal padding, x offset
      const xOffset = (canvasSize - width) / 2;

      ctx.drawImage(img, xOffset, 0, width, height);
    } else {
      // vertical padding, y offset
      const yOffset = (canvasSize - height) / 2;

      ctx.drawImage(img, 0, yOffset, width, height);
    }
    return canvas;
  };
}
