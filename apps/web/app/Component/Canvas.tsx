import { useEffect, useRef } from "react";
import { InitDraw } from "../../draw";

export function Canvas({
  roomId,
  socket,
  selectedTool,
}: {
  roomId: string;
  socket: any;
  selectedTool: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current && roomId) {
      InitDraw(canvasRef.current, roomId, socket, selectedTool);
    }
    // Only run on mount, not on every prop change!
    // eslint-disable-next-line
  }, [canvasRef, roomId, socket]); // Remove selectedTool from deps

  // Add this effect to update the tool on change:
  useEffect(() => {
    if (canvasRef.current && (canvasRef.current as any)._updateTool) {
      (canvasRef.current as any)._updateTool(selectedTool);
    }
  }, [selectedTool]);

  return (
    <div className="h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="border cursor-crosshair"
        tabIndex={0}
        autoFocus
      />
    </div>
  );
}
