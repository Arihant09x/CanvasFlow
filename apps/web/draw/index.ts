import { getChats } from "../service/api";

type Shape =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
    }
  | {
      type: "arrow";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    }
  | {
      type: "text";
      x: number;
      y: number;
      text: string;
    };

export async function InitDraw(
  canvas: HTMLCanvasElement,
  roomId: string,
  socket: WebSocket,
  selectedTool: string
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Fill black immediately
  ClearCanvas([], canvas, ctx);

  const existingShapes: Shape[] = await getExistingShapes(roomId);
  // Render all shapes immediately after loading
  ClearCanvas(existingShapes, canvas, ctx);

  let currentTool = selectedTool;
  (canvas as any)._selectedTool = selectedTool;
  (canvas as any)._updateTool = (tool: string) => {
    (canvas as any)._selectedTool = tool;
    // Change cursor based on tool
    if (tool === "text") {
      canvas.style.cursor = "text";
    } else {
      canvas.style.cursor = "crosshair";
    }
  };
  // Set initial cursor
  if (selectedTool === "text") {
    canvas.style.cursor = "text";
  } else {
    canvas.style.cursor = "crosshair";
  }

  // --- Inline text on canvas ---
  let typing = false;
  let typingText = "";
  let typingX = 0;
  let typingY = 0;
  let typingInputActive = false;
  function drawTypingText() {
    if (!ctx) return;
    if (typing && typingText) {
      ctx.save();
      ctx.font = "24px Caveat, cursive, sans-serif";
      ctx.fillStyle = "#fff";
      ctx.fillText(typingText, typingX, typingY);
      ctx.restore();
    }
  }

  let isDrawing = false;
  let startX = 0;
  let startY = 0;

  const getMousePos = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };
  canvas.onmousedown = null;
  canvas.onmouseup = null;
  canvas.onmousemove = null;

  // Inline text input logic
  function createTextInput(x: number, y: number) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type here...";
    input.style.position = "absolute";
    input.style.left = `${canvas.offsetLeft + x}px`;
    input.style.top = `${canvas.offsetTop + y - 20}px`;
    input.style.fontSize = "24px";
    input.style.fontFamily = "Caveat, cursive, sans-serif";
    input.style.background = "rgba(0,0,0,0.8)";
    input.style.color = "white";
    input.style.border = "1px solid #fff";
    input.style.borderRadius = "6px";
    input.style.padding = "2px 8px";
    input.style.zIndex = "1000";
    input.style.outline = "none";
    input.maxLength = 100;
    document.body.appendChild(input);
    input.focus();
    function commitText() {
      const text = input.value;
      if (text) {
        const shape: Shape = { type: "text", x, y, text };
        existingShapes.push(shape);
        socket.send(
          JSON.stringify({
            type: "chat",
            roomId,
            message: JSON.stringify(shape),
          })
        );
        ClearCanvas(existingShapes, canvas, ctx);
      }
      document.body.removeChild(input);
    }
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        commitText();
      } else if (e.key === "Escape") {
        document.body.removeChild(input);
      }
    });
    input.addEventListener("blur", () => {
      commitText();
    });
  }

  canvas.addEventListener("mousedown", (e) => {
    let tool = (canvas as any)._selectedTool || selectedTool;
    if (tool === "text") {
      const pos = getMousePos(e);
      typing = true;
      typingText = "";
      typingX = pos.x;
      typingY = pos.y;
      typingInputActive = true;
      ClearCanvas(existingShapes, canvas, ctx);
      drawTypingText();
      canvas.focus();
      return;
    }
    isDrawing = true;
    const pos = getMousePos(e);
    startX = pos.x;
    startY = pos.y;
    if (tool === "text") {
      createTextInput(pos.x, pos.y);
      isDrawing = false;
    }
  });

  canvas.addEventListener("mouseup", (e) => {
    if (!isDrawing) return;
    isDrawing = false;
    let tool = (canvas as any)._selectedTool || selectedTool;
    const pos = getMousePos(e);
    let shape: Shape | null = null;
    if (tool === "rect") {
      const width = pos.x - startX;
      const height = pos.y - startY;
      shape = {
        type: "rect",
        x: startX,
        y: startY,
        width,
        height,
      };
    } else if (tool === "circle") {
      const centerX = (startX + pos.x) / 2;
      const centerY = (startY + pos.y) / 2;
      const radius =
        Math.sqrt(Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2)) /
        2;
      shape = {
        type: "circle",
        centerX,
        centerY,
        radius,
      };
    } else if (tool === "arrow") {
      shape = {
        type: "arrow",
        startX: startX,
        startY: startY,
        endX: pos.x,
        endY: pos.y,
      };
    }
    if (shape) {
      console.log("Drawn shape:", shape);
      existingShapes.push(shape);
      socket.send(
        JSON.stringify({
          type: "chat",
          roomId,
          message: JSON.stringify(shape),
        })
      );
      ClearCanvas(existingShapes, canvas, ctx);
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing) return;
    let tool = (canvas as any)._selectedTool || selectedTool;
    const pos = getMousePos(e);
    ClearCanvas(existingShapes, canvas, ctx);
    if (!ctx) return;
    ctx.strokeStyle = "white";
    if (tool === "rect") {
      const width = pos.x - startX;
      const height = pos.y - startY;
      ctx.strokeRect(startX, startY, width, height);
    } else if (tool === "circle") {
      const centerX = (startX + pos.x) / 2;
      const centerY = (startY + pos.y) / 2;
      const radius =
        Math.sqrt(Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2)) /
        2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (tool === "arrow") {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.closePath();
    }
  });

  canvas.addEventListener("keydown", (e) => {
    if (!typingInputActive) return;
    if (e.key === "Enter") {
      if (typingText) {
        const shape: Shape = {
          type: "text",
          x: typingX,
          y: typingY,
          text: typingText,
        };
        existingShapes.push(shape);
        socket.send(
          JSON.stringify({
            type: "chat",
            roomId,
            message: JSON.stringify(shape),
          })
        );
        ClearCanvas(existingShapes, canvas, ctx);
      }
      typing = false;
      typingText = "";
      typingInputActive = false;
      return;
    } else if (e.key === "Backspace") {
      typingText = typingText.slice(0, -1);
    } else if (e.key.length === 1) {
      typingText += e.key;
    }
    ClearCanvas(existingShapes, canvas, ctx);
    drawTypingText();
  });
  canvas.addEventListener("blur", () => {
    if (typingInputActive && typingText) {
      const shape: Shape = {
        type: "text",
        x: typingX,
        y: typingY,
        text: typingText,
      };
      existingShapes.push(shape);
      socket.send(
        JSON.stringify({
          type: "chat",
          roomId,
          message: JSON.stringify(shape),
        })
      );
      ClearCanvas(existingShapes, canvas, ctx);
    }
    typing = false;
    typingText = "";
    typingInputActive = false;
  });
}

function ClearCanvas(
  shapes: Shape[],
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D | null
) {
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  shapes.forEach((shape) => {
    if (!shape || !shape.type) return;
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    if (shape.type === "rect") {
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    } else if (shape.type === "circle") {
      ctx.beginPath();
      ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (shape.type === "arrow") {
      ctx.beginPath();
      ctx.moveTo(shape.startX, shape.startY);
      ctx.lineTo(shape.endX, shape.endY);
      ctx.stroke();
      ctx.closePath();
      ctx.fill();
    } else if (shape.type === "text") {
      ctx.font = "24px Caveat, cursive, sans-serif";
      ctx.fillStyle = "white";
      ctx.fillText(shape.text, shape.x, shape.y);
    }
  });
  ctx.restore();
}

async function getExistingShapes(roomId: string) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";
  const res = await getChats(roomId, token as string);
  return res.messages
    .map((x: { message: string }) => safeParse(x.message))
    .filter((shape: any) => shape && shape.type);
}

function safeParse(json: string) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}
