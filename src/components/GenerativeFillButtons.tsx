import { Button } from "@mui/material";
import styles from "./GenerativeFillButtons.module.scss";
import { ImageUtility } from "../generativeFillUtils/ImageHandler";
import { canvasSize } from "../generativeFillUtils/generativeFillConstants";
import { Oval } from "react-loader-spinner";

interface ButtonContainerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  backgroundref: React.RefObject<HTMLCanvasElement>;
  currImg: React.MutableRefObject<HTMLImageElement | null>;
  undoStack: React.MutableRefObject<ImageData[]>;
  getEdit: () => Promise<void>;
  loading: boolean;
}

const Buttons = ({
  canvasRef,
  backgroundref,
  currImg,
  undoStack,
  loading,
  getEdit,
}: ButtonContainerProps) => {
  const handleReset = () => {
    if (!canvasRef.current || !currImg.current) return;
    const ctx = ImageUtility.getCanvasContext(canvasRef);
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ImageUtility.drawImgToCanvas(currImg.current, canvasRef, true);
  };

  return (
    <div className={styles.btnContainer}>
      <Button onClick={handleReset}>Reset</Button>
      <Button
        onClick={() => {
          if (!canvasRef.current) return;
          ImageUtility.downloadCanvas(canvasRef.current);
        }}
      >
        Download
      </Button>
      {/* <Button
        onClick={() => {
          if (!canvasRef.current) return;
          ImageUtility.downloadImageCanvas("/assets/firefly.png");
        }}
      >
        Download Original
      </Button> */}
      <Button
        variant="contained"
        onClick={() => {
          getEdit();
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          Get Edit
          {loading && (
            <Oval
              height={20}
              width={20}
              color="#ffffff"
              visible={true}
              ariaLabel="oval-loading"
              secondaryColor="#ffffff89"
              strokeWidth={3}
              strokeWidthSecondary={3}
            />
          )}
        </span>
      </Button>
    </div>
  );
};

export default Buttons;
