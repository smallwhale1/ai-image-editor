import { useEffect, useRef, useState } from "react";
import { BsBrush, BsGrid } from "react-icons/bs";
import { BiPencil } from "react-icons/bi";
import { OPENAI_KEY } from "./keys";
import { Rnd } from "react-rnd";
import { BallTriangle } from "react-loader-spinner";
import "./ImageEditor.scss";

/* Constants */
const canvasSize = 300;
const initialBoxSize = 100;
const editsImgSize = 1024;

const initialBoxDims = {
  x: 0,
  y: 0,
  width: initialBoxSize,
  height: initialBoxSize,
};

const ImageEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const [outputSet, setOutputSet] = useState<boolean>(false);
  const [boxDims, setBoxDims] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>(initialBoxDims);
  const [selectionType, setSelectionType] = useState<"rect" | "brush">("rect");
  const [currImg, setCurrImg] = useState<HTMLImageElement>();
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currImg) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    currImg.onload = () => {
      const scale = Math.min(
        canvasSize / currImg.width,
        canvasSize / currImg.height
      );
      const width = currImg.width * scale;
      const height = currImg.height * scale;
      ctx.drawImage(currImg, 0, 0, width, height);
      reset();
      URL.revokeObjectURL(currImg.src);
    };
  }, [canvasRef, currImg]);

  useEffect(() => {
    const img = new Image();
    img.src = "/assets/oranges.jpg";
    setCurrImg(img);
  }, []);

  const onSubmit = async () => {
    if (!currImg) return;
    const newCanvas = document.createElement("canvas");
    newCanvas.width = editsImgSize;
    newCanvas.height = editsImgSize;
    const ctx = newCanvas.getContext("2d");
    if (!ctx) return;
    setLoading(true);
    setOutputSet(true);
    const scale = editsImgSize / currImg.width;

    const boxToFinalScale =
      (currImg.width / canvasSize) * (editsImgSize / currImg.width);

    const width = currImg.width * scale;
    const height = currImg.height * scale;
    ctx.drawImage(currImg, 0, 0, width, height);

    const imgBlob = await canvasToBlob(newCanvas);

    // applying the mask
    const transparentPixels = ctx.createImageData(
      boxDims.width * boxToFinalScale,
      boxDims.height * boxToFinalScale
    );
    const transparentData = transparentPixels.data;
    for (let i = 0; i < transparentData.length; i += 4) {
      transparentData[i] = 0;
      transparentData[i + 1] = 0;
      transparentData[i + 2] = 0;
      transparentData[i + 3] = 0;
    }
    ctx.putImageData(
      transparentPixels,
      boxDims.x * boxToFinalScale,
      boxDims.y * boxToFinalScale
    );
    // document.body.appendChild(newCanvas);
    const maskBlob = await canvasToBlob(newCanvas);
    getImageEdit(imgBlob, maskBlob);
  };

  const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, "image/png");
    });
  };

  const getImageEdit = async (imgBlob: Blob, maskBlob: Blob) => {
    const apiUrl = "https://api.openai.com/v1/images/edits";
    const fd = new FormData();
    fd.append("image", imgBlob, "image.png");
    fd.append("mask", maskBlob, "mask.png");
    fd.append("prompt", prompt);
    fd.append("size", "1024x1024");

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: fd,
      });
      const data = await res.json();
      drawUrlToCanvas(data.data[0].url);
    } catch (err) {
      console.log(err);
    }
  };

  const drawUrlToCanvas = (url: string) => {
    const img = new Image();
    img.src = url;
    console.log(url);

    img.onload = () => {
      if (!outputRef.current) return;
      const ctx = outputRef.current?.getContext("2d");
      if (!ctx) return;
      const scale = Math.min(canvasSize / img.width, canvasSize / img.height);
      const width = img.width * scale;
      const height = img.height * scale;
      ctx.drawImage(img, 0, 0, width, height);
      setLoading(false);
    };
  };

  const previewMask = () => {
    // copy over the image
    if (!currImg) return;
    const ctx = outputRef.current?.getContext("2d");
    if (!ctx) return;
    const scale = Math.min(
      canvasSize / currImg.width,
      canvasSize / currImg.height
    );
    const width = currImg.width * scale;
    const height = currImg.height * scale;
    ctx.drawImage(currImg, 0, 0, width, height);

    // applying the mask
    const transparentPixels = ctx.createImageData(
      boxDims.width,
      boxDims.height
    );
    const transparentData = transparentPixels.data;
    for (let i = 0; i < transparentData.length; i += 4) {
      transparentData[i] = 0;
      transparentData[i + 1] = 0;
      transparentData[i + 2] = 0;
      transparentData[i + 3] = 0;
    }

    ctx.putImageData(transparentPixels, boxDims.x, boxDims.y);
  };

  const uploadImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];

      const image = new Image();
      const imgUrl = URL.createObjectURL(file);
      image.src = imgUrl;
      setCurrImg(image);
    }
  };

  const reset = () => {
    const canvas = outputRef.current;
    const ctx = outputRef.current?.getContext("2d");
    if (canvas && ctx) {
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const save = () => {
    const outputCanvas = outputRef.current;
    if (!outputCanvas) return;
    const outputCtx = outputCanvas.getContext("2d");
    const imgCtx = canvasRef.current?.getContext("2d");
    if (!outputCanvas || !imgCtx || !outputCtx) return;
    imgCtx.drawImage(outputCanvas, 0, 0);
    // const image = new Image();
    // image.src = outputCanvas.toDataURL();
    // setCurrImg(image);
    // imgCtx.fillStyle = "blue";
    // imgCtx.fillRect(0, 0, 50, 50);
    reset();
  };

  const handleMouseOver = () => {};

  const handleMouseOut = () => {};

  return (
    <>
      <div className="selection-opts">
        <BsBrush
          className={`selection-icon ${
            selectionType === "brush" && "active-selection"
          }`}
        />
        <BsGrid
          className={`selection-icon ${
            selectionType === "rect" && "active-selection"
          }`}
        />
      </div>
      <div className="prompt-area">
        <BiPencil size={"18px"} color="#7e7e7e" />
        <input
          type="text"
          placeholder="Write a prompt..."
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
          }}
        />
      </div>
      <div className="canvases">
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
          ></canvas>
          {selectionType === "rect" ? (
            <Rnd
              default={initialBoxDims}
              position={{ x: boxDims.x, y: boxDims.y }}
              size={{ width: boxDims.width, height: boxDims.height }}
              onResizeStop={(e, direction, ref, delta, position) => {
                setBoxDims((prev) => ({
                  ...position,
                  width: parseInt(ref.style.width.split("px")[0]),
                  height: parseInt(ref.style.height.split("px")[0]),
                }));
              }}
              onDragStop={(e, data) => {
                setBoxDims((prev) => ({ ...prev, x: data.x, y: data.y }));
              }}
              bounds="parent"
            >
              <div className="mask-box">
                {new Array(9).fill(0).map((elem, i) => (
                  <div key={i} className="alignment-box"></div>
                ))}
              </div>
              <>
                <div className="top-left-1"></div>
                <div className="top-left-2"></div>
              </>
              <>
                <div className="top-right-1"></div>
                <div className="top-right-2"></div>
              </>
              <>
                <div className="bottom-left-1"></div>
                <div className="bottom-left-2"></div>
              </>
              <>
                <div className="bottom-right-1"></div>
                <div className="bottom-right-2"></div>
              </>
            </Rnd>
          ) : (
            <></>
          )}
        </div>

        <>
          <div style={loading ? { display: "none" } : { display: "block" }}>
            <canvas
              ref={outputRef}
              width={canvasSize}
              height={canvasSize}
            ></canvas>
          </div>
          <div
            style={
              !loading
                ? { display: "none" }
                : {
                    display: "flex",
                    gap: "10px",
                    width: canvasSize,
                    height: canvasSize,
                    justifyContent: "center",
                    alignItems: "center",
                  }
            }
          >
            Loading...
            <BallTriangle
              height={25}
              width={25}
              radius={5}
              color="rgb(61, 168, 255)"
              ariaLabel="ball-triangle-loading"
              visible={true}
            />
          </div>
        </>
      </div>
      <div className="btns">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={uploadImg}
          style={{ display: "none" }}
        />
        <button
          onClick={() => {
            if (fileRef.current) {
              fileRef.current.click();
            }
          }}
        >
          Upload Image
        </button>
        <button onClick={previewMask}>Preview Mask</button>
        <button onClick={onSubmit}>Submit</button>
        <button onClick={save}>Save Changes</button>
        {/* <button onClick={reset}>Reset</button> */}
      </div>
    </>
  );
};

export default ImageEditor;
