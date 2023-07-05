import { Button } from "@mui/material";
import styles from "./GenerativeFillButtons.module.scss";
import { ImageUtility } from "../generativeFillUtils/ImageHandler";
import { canvasSize } from "../generativeFillUtils/generativeFillConstants";
import { Oval } from "react-loader-spinner";

interface ButtonContainerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  handleReset: () => void;
  getEdit: () => Promise<void>;
  loading: boolean;
}

const Buttons = ({
  canvasRef,
  handleReset,
  loading,
  getEdit,
}: ButtonContainerProps) => {
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
