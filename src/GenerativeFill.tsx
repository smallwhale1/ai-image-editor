import { useEffect, useRef, useState } from "react";
import { APISuccess, ImageUtility } from "./generativeFillUtils/ImageHandler";
import { BrushHandler } from "./generativeFillUtils/BrushHandler";
import { IconButton, TextField } from "@mui/material";
import {
  CursorData,
  Point,
} from "./generativeFillUtils/generativeFillInterfaces";
import {
  activeColor,
  canvasSize,
  eraserColor,
} from "./generativeFillUtils/generativeFillConstants";
import { PointerHandler } from "./generativeFillUtils/PointerHandler";
import { motion } from "framer-motion";
import { BsBrush, BsEraser } from "react-icons/bs";
import { AiOutlineUpload } from "react-icons/ai";
import { CiUndo, CiRedo } from "react-icons/ci";
import Buttons from "./components/GenerativeFillButtons";
import styles from "./GenerativeFill.module.scss";

/**
 * TODO: For images not 1024x1024 fill in the rest in solid black, or a
 * reflected version of the image.
 */

/**
 * Steps for creating image history:
 * Every single time save is clicked, or an image is edited, it is stored
 * in the tree.
 *
 * Parent keeps track of child images.
 */

/**
 * TODO: Look into img onload, sometimes the canvas doesn't update properly
 */

enum BrushStyle {
  ADD,
  SUBTRACT,
  MARQUEE,
}

interface ImageEdit {
  imgElement: HTMLImageElement;
  parent: ImageEdit;
  children: ImageEdit[];
}

const GenerativeFill = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasBackgroundRef = useRef<HTMLCanvasElement>(null);
  const drawingAreaRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cursorData, setCursorData] = useState<CursorData>({
    x: 0,
    y: 0,
    width: 150,
  });
  const [isBrushing, setIsBrushing] = useState(false);
  const [canvasScale, setCanvasScale] = useState(0.5);
  const [edits, setEdits] = useState<string[]>([]);
  const [brushStyle, setBrushStyle] = useState<BrushStyle>(BrushStyle.ADD);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // used to store the current image loaded to the main canvas
  const currImg = useRef<HTMLImageElement | null>(null);
  const originalImg = useRef<HTMLImageElement | null>(null);
  // stores history of data urls
  const undoStack = useRef<string[]>([]);
  // stores redo stack
  const redoStack = useRef<string[]>([]);

  // Undo and Redo
  const handleUndo = () => {
    const ctx = ImageUtility.getCanvasContext(canvasRef);
    if (!ctx || !currImg.current || !canvasRef.current) return;

    const target = undoStack.current[undoStack.current.length - 1];
    if (!target) {
      ImageUtility.drawImgToCanvas(currImg.current, canvasRef);
    } else {
      redoStack.current = [...redoStack.current, canvasRef.current.toDataURL()];
      const img = new Image();
      img.src = target;
      ImageUtility.drawImgToCanvas(img, canvasRef);
      undoStack.current = undoStack.current.slice(0, -1);
    }
  };

  const handleRedo = () => {
    // TODO: handle undo as well
    const target = redoStack.current[redoStack.current.length - 1];
    if (!target) {
    } else {
      const img = new Image();
      img.src = target;
      ImageUtility.drawImgToCanvas(img, canvasRef);
      redoStack.current = redoStack.current.slice(0, -1);
    }
  };

  const handleReset = () => {
    if (!canvasRef.current || !currImg.current) return;
    const ctx = ImageUtility.getCanvasContext(canvasRef);
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    undoStack.current = [];
    redoStack.current = [];
    ImageUtility.drawImgToCanvas(currImg.current, canvasRef, true);
  };

  // initiate brushing
  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = ImageUtility.getCanvasContext(canvasRef);
    if (!ctx) return;

    undoStack.current = [...undoStack.current, canvasRef.current.toDataURL()];
    redoStack.current = [];
    setIsBrushing(true);
    const { x, y } = PointerHandler.getPointRelativeToElement(
      canvas,
      e,
      canvasScale
    );

    BrushHandler.brushCircleOverlay(
      x,
      y,
      cursorData.width / 2 / canvasScale,
      ctx,
      eraserColor,
      brushStyle === BrushStyle.SUBTRACT
    );
  };

  // stop brushing, push to undo stack
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!canvasRef.current || !isBrushing) return;
    const ctx = ImageUtility.getCanvasContext(canvasRef);
    if (!ctx) return;

    setIsBrushing(false);
  };

  // handles brushing on pointer movement
  useEffect(() => {
    if (!isBrushing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = ImageUtility.getCanvasContext(canvasRef);
    if (!ctx) return;

    const handlePointerMove = (e: PointerEvent) => {
      const currPoint = PointerHandler.getPointRelativeToElement(
        canvas,
        e,
        canvasScale
      );
      const lastPoint: Point = {
        x: currPoint.x - e.movementX / canvasScale,
        y: currPoint.y - e.movementY / canvasScale,
      };
      BrushHandler.createBrushPathOverlay(
        lastPoint,
        currPoint,
        cursorData.width / 2 / canvasScale,
        ctx,
        eraserColor,
        brushStyle === BrushStyle.SUBTRACT
      );
    };

    drawingAreaRef.current?.addEventListener("pointermove", handlePointerMove);
    return () =>
      drawingAreaRef.current?.removeEventListener(
        "pointermove",
        handlePointerMove
      );
  }, [isBrushing]);

  // first load
  useEffect(() => {
    if (!canvasRef.current) return;
    const img = new Image();
    img.src = "/assets/art.jpeg";
    ImageUtility.drawImgToCanvas(img, canvasRef);
    currImg.current = img;
    originalImg.current = img;
  }, [canvasRef]);

  // handles brush sizing
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setCursorData((data) => ({ ...data, width: data.width + 5 }));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setCursorData((data) =>
          data.width >= 20 ? { ...data, width: data.width - 5 } : data
        );
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // handle pinch zoom
  useEffect(() => {
    const handlePinch = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY;
      const scaleFactor = delta > 0 ? 0.98 : 1.02; // Adjust the scale factor as per your requirement
      setCanvasScale((prevScale) => prevScale * scaleFactor);
    };

    drawingAreaRef.current?.addEventListener("wheel", handlePinch, {
      passive: false,
    });
    return () =>
      drawingAreaRef.current?.removeEventListener("wheel", handlePinch);
  }, [drawingAreaRef]);

  // updates the current position of the cursor
  const updateCursorData = (e: React.PointerEvent) => {
    const drawingArea = drawingAreaRef.current;
    if (!drawingArea) return;
    const { x, y } = PointerHandler.getPointRelativeToElement(
      drawingArea,
      e,
      1
    );
    setCursorData((data) => ({
      ...data,
      x,
      y,
    }));
  };

  // File upload
  const uploadImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      const image = new Image();
      const imgUrl = URL.createObjectURL(file);
      image.src = imgUrl;
      ImageUtility.drawImgToCanvas(image, canvasRef);
      currImg.current = image;
    }
  };

  // Get AI Edit
  const getEdit = async () => {
    const img = currImg.current;
    if (!img) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = ImageUtility.getCanvasContext(canvasRef);
    if (!ctx) return;
    setLoading(true);
    try {
      const maskBlob = await ImageUtility.canvasToBlob(canvas);
      const imgBlob = await ImageUtility.canvasToBlob(
        ImageUtility.getCanvasImg(img)
      );

      const res = await ImageUtility.getEdit(
        imgBlob,
        maskBlob,
        input !== ""
          ? input + " in the same style"
          : "Fill in the image in the same style",
        2
      );
      originalImg.current = currImg.current;
      // const res = await ImageUtility.mockGetEdit();
      const { urls } = res as APISuccess;
      const image = new Image();
      image.src = urls[0];
      setLoading(false);
      setEdits(urls);
      ImageUtility.drawImgToCanvas(image, canvasRef);
      currImg.current = image;
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <h1>Generative Fill</h1>
        <Buttons
          canvasRef={canvasRef}
          getEdit={getEdit}
          handleReset={handleReset}
          loading={loading}
        />
      </div>
      {/* Main canvas for editing */}
      <div
        className={styles.drawingArea} // this only works if pointerevents: none is set on the custom pointer
        ref={drawingAreaRef}
        onPointerOver={updateCursorData}
        onPointerMove={updateCursorData}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          style={{ transform: `scale(${canvasScale})` }}
        />
        <canvas
          ref={canvasBackgroundRef}
          width={canvasSize}
          height={canvasSize}
          style={{ transform: `scale(${canvasScale})` }}
        />
        <div
          className={styles.pointer}
          style={{
            left: cursorData.x,
            top: cursorData.y,
            width: cursorData.width,
            height: cursorData.width,
          }}
        >
          <div className={styles.innerPointer}></div>
        </div>
        {/* Icons */}
        <div className={styles.iconContainer}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={uploadImg}
            style={{ display: "none" }}
          />
          <IconButton
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.click();
              }
            }}
          >
            <AiOutlineUpload />
          </IconButton>
          <IconButton
            onClick={() => {
              setBrushStyle(BrushStyle.ADD);
            }}
          >
            <BsBrush
              color={brushStyle === BrushStyle.ADD ? activeColor : "inherit"}
            />
          </IconButton>
          <IconButton
            onClick={() => {
              setBrushStyle(BrushStyle.SUBTRACT);
            }}
          >
            <BsEraser
              color={
                brushStyle === BrushStyle.SUBTRACT ? activeColor : "inherit"
              }
            />
          </IconButton>
          {/* Undo and Redo */}
          <IconButton
            onPointerDown={(e) => {
              e.stopPropagation();
              handleUndo();
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
            }}
          >
            <CiUndo />
          </IconButton>
          <IconButton
            onPointerDown={(e) => {
              e.stopPropagation();
              handleRedo();
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
            }}
          >
            <CiRedo />
          </IconButton>
        </div>
        {/* Edits box */}
        <motion.div className={styles.editsBox}>
          {edits.map((edit, i) => (
            <img
              key={i}
              width={100}
              height={100}
              src={edit}
              style={{ cursor: "pointer" }}
              onClick={() => {
                const img = new Image();
                img.src = edit;
                ImageUtility.drawImgToCanvas(img, canvasRef);
                currImg.current = img;
              }}
            />
          ))}
          {edits.length > 0 && (
            <div style={{ position: "relative" }}>
              <label
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: 10,
                  color: "#ffffff",
                  fontSize: "0.8rem",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Original
              </label>
              <img
                width={100}
                height={100}
                src={originalImg.current?.src}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  if (!originalImg.current) return;
                  const img = new Image();
                  img.src = originalImg.current.src;
                  ImageUtility.drawImgToCanvas(img, canvasRef);
                  currImg.current = img;
                }}
              />
            </div>
          )}
        </motion.div>
      </div>
      <motion.div
        initial={{ y: 0 }}
        animate={isBrushing ? { y: 200 } : { y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isBrushing}
          type="text"
          label="Prompt"
          placeholder="Prompt..."
          // InputLabelProps={{ style: { fontSize: "1.2rem" } }}
          // inputProps={{ style: { fontSize: "1.2rem" } }}
          sx={{
            backgroundColor: "#ffffff",
            position: "absolute",
            bottom: "1rem",
            transform: "translateX(calc(50vw - 50%))",
            width: "calc(100vw - 4rem)",
          }}
        />
      </motion.div>
    </div>
  );
};

export default GenerativeFill;
