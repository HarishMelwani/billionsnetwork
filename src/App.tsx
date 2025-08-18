import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Download,
  Move,
  Maximize as Resize,
  RotateCw,
  Info,
  Zap,
  Shield,
  Globe,
  Coins,
  Users,
  TrendingUp,
} from "lucide-react";

const OVERLAY_INIT = {
  x_pct: 0.2,
  y_pct: 0.2,
  w_pct: 0.3,
  h_pct: 0.3,
  rotation: 0,
};
type OverlayState = typeof OVERLAY_INIT;
type DragType = "move" | "resize" | "rotate" | null;
const HANDLE_SIZE = 18;

function percentageToPixels(
  overlay: OverlayState,
  width: number,
  height: number
) {
  return {
    x: overlay.x_pct * width,
    y: overlay.y_pct * height,
    w: overlay.w_pct * width,
    h: overlay.h_pct * height,
    rotation: overlay.rotation,
  };
}

function pixelsToPercentage(
  overlay: { x: number; y: number; w: number; h: number; rotation: number },
  width: number,
  height: number
) {
  return {
    x_pct: overlay.x / width,
    y_pct: overlay.y / height,
    w_pct: overlay.w / width,
    h_pct: overlay.h / height,
    rotation: overlay.rotation,
  };
}

export default function App() {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [overlay, setOverlay] = useState<OverlayState>(OVERLAY_INIT);
  const [drag, setDrag] = useState<{
    type: DragType;
    start: { x: number; y: number };
    overlayStart: OverlayState;
    handle?: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Billions overlay logo
  const overlayImage = (() => {
    const img = new window.Image();
    img.src = "/Billions.png";
    return img;
  })();

  useEffect(() => {
    if (!bgImage) return;
    const img = new window.Image();
    img.onload = () =>
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = bgImage;
  }, [bgImage]);

  // Draw main canvas (with handles)
  useEffect(() => {
    if (!bgImage || !naturalSize) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = containerRef.current
      ? containerRef.current.offsetWidth
      : naturalSize.width;
    const height = Math.round((naturalSize.height / naturalSize.width) * width);
    canvas.width = width;
    canvas.height = height;
    const img = new window.Image();
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const ovPx = percentageToPixels(overlay, width, height);

      // Draw overlay
      ctx.save();
      ctx.translate(ovPx.x + ovPx.w / 2, ovPx.y + ovPx.h / 2);
      ctx.rotate((overlay.rotation * Math.PI) / 180);
      ctx.drawImage(
        overlayImage,
        -ovPx.w / 2,
        -ovPx.h / 2,
        ovPx.w,
        ovPx.h
      );
      ctx.restore();

      // Draw handles (only for live canvas, not for download)
      const handleCoords = [
        { x: -ovPx.w / 2, y: -ovPx.h / 2 },
        { x: ovPx.w / 2, y: -ovPx.h / 2 },
        { x: ovPx.w / 2, y: ovPx.h / 2 },
        { x: -ovPx.w / 2, y: ovPx.h / 2 },
      ].map(({ x, y }) => {
        const theta = (overlay.rotation * Math.PI) / 180;
        const nx = x * Math.cos(theta) - y * Math.sin(theta);
        const ny = x * Math.sin(theta) + y * Math.cos(theta);
        return {
          x: ovPx.x + ovPx.w / 2 + nx,
          y: ovPx.y + ovPx.h / 2 + ny,
        };
      });

      // rotate handle
      const theta = (overlay.rotation * Math.PI) / 180;
      const rx =
        ovPx.x +
        ovPx.w / 2 +
        (0 * Math.cos(theta) - (-ovPx.h / 2 - 30) * Math.sin(theta));
      const ry =
        ovPx.y +
        ovPx.h / 2 +
        (0 * Math.sin(theta) + (-ovPx.h / 2 - 30) * Math.cos(theta));
      
      handleCoords.forEach(({ x, y }) => {
        ctx.beginPath();
        ctx.arc(x, y, HANDLE_SIZE / 2, 0, 2 * Math.PI);
        ctx.fillStyle = "#1366f2"; // blue dot (not in download)
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.arc(rx, ry, HANDLE_SIZE / 2, 0, 2 * Math.PI);
      ctx.fillStyle = "#16a34a"; // green dot (not in download)
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    img.src = bgImage;
  }, [bgImage, overlay, naturalSize]);

  // --- Pointer logic for resize/rotate/move ---
  function getHandleAtPoint(x, y, width, height) {
    const ovPx = percentageToPixels(overlay, width, height);
    const handleCoords = [
      { x: -ovPx.w / 2, y: -ovPx.h / 2 },
      { x: ovPx.w / 2, y: -ovPx.h / 2 },
      { x: ovPx.w / 2, y: ovPx.h / 2 },
      { x: -ovPx.w / 2, y: ovPx.h / 2 },
    ].map(({ x, y }) => {
      const theta = (overlay.rotation * Math.PI) / 180;
      const nx = x * Math.cos(theta) - y * Math.sin(theta);
      const ny = x * Math.sin(theta) + y * Math.cos(theta);
      return {
        x: ovPx.x + ovPx.w / 2 + nx,
        y: ovPx.y + ovPx.h / 2 + ny,
      };
    });
    const theta = (overlay.rotation * Math.PI) / 180;
    const rx =
      ovPx.x +
      ovPx.w / 2 +
      (0 * Math.cos(theta) - (-ovPx.h / 2 - 30) * Math.sin(theta));
    const ry =
      ovPx.y +
      ovPx.h / 2 +
      (0 * Math.sin(theta) + (-ovPx.h / 2 - 30) * Math.cos(theta));
    for (let i = 0; i < handleCoords.length; i++) {
      if (Math.hypot(x - handleCoords[i].x, y - handleCoords[i].y) < HANDLE_SIZE)
        return i;
    }
    if (Math.hypot(x - rx, y - ry) < HANDLE_SIZE) return 4;
    return null;
  }

  function getCanvasCoords(e) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches) {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function handlePointerDown(e) {
    if (!naturalSize) return;
    const coords = getCanvasCoords(e);
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const handle = getHandleAtPoint(coords.x, coords.y, width, height);
    if (handle !== null) {
      setDrag({
        type: handle === 4 ? "rotate" : "resize",
        start: coords,
        overlayStart: { ...overlay },
        handle: handle,
      });
      e.preventDefault();
      return;
    }
    const ovPx = percentageToPixels(overlay, width, height);
    const dx = coords.x - (ovPx.x + ovPx.w / 2);
    const dy = coords.y - (ovPx.y + ovPx.h / 2);
    const theta = (-overlay.rotation * Math.PI) / 180;
    const nx = dx * Math.cos(theta) - dy * Math.sin(theta);
    const ny = dx * Math.sin(theta) + dy * Math.cos(theta);
    if (
      nx > -ovPx.w / 2 &&
      nx < ovPx.w / 2 &&
      ny > -ovPx.h / 2 &&
      ny < ovPx.h / 2
    ) {
      setDrag({
        type: "move",
        start: coords,
        overlayStart: { ...overlay },
      });
      e.preventDefault();
    }
  }

  function handlePointerMove(e) {
    if (!drag || !naturalSize) return;
    if (e.touches && e.touches.length === 0) return;
    const coords = getCanvasCoords(e);
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    if (drag.type === "move") {
      const deltaX = coords.x - drag.start.x;
      const deltaY = coords.y - drag.start.y;
      const { x_pct, y_pct } = drag.overlayStart;
      setOverlay((prev) => ({
        ...prev,
        x_pct: Math.min(Math.max(x_pct + deltaX / width, 0), 1 - prev.w_pct),
        y_pct: Math.min(Math.max(y_pct + deltaY / height, 0), 1 - prev.h_pct),
      }));
    }
    if (drag.type === "resize") {
      const i = drag.handle;
      const overlayPx = percentageToPixels(drag.overlayStart, width, height);
      let anchor;
      if (i === 0) anchor = { x: overlayPx.x + overlayPx.w, y: overlayPx.y + overlayPx.h };
      if (i === 1) anchor = { x: overlayPx.x, y: overlayPx.y + overlayPx.h };
      if (i === 2) anchor = { x: overlayPx.x, y: overlayPx.y };
      if (i === 3) anchor = { x: overlayPx.x + overlayPx.w, y: overlayPx.y };
      const theta = (-drag.overlayStart.rotation * Math.PI) / 180;
      const dx = coords.x - anchor.x;
      const dy = coords.y - anchor.y;
      const nx = dx * Math.cos(theta) - dy * Math.sin(theta);
      const ny = dx * Math.sin(theta) + dy * Math.cos(theta);
      let w = Math.abs(nx);
      let h = Math.abs(ny);
      w = Math.max(40, Math.min(w, width));
      h = Math.max(40, Math.min(h, height));
      const newX = Math.min(anchor.x, anchor.x + Math.sign(nx) * w);
      const newY = Math.min(anchor.y, anchor.y + Math.sign(ny) * h);
      setOverlay((prev) =>
        pixelsToPercentage(
          {
            x: newX,
            y: newY,
            w,
            h,
            rotation: prev.rotation,
          },
          width,
          height
        )
      );
    }
    if (drag.type === "rotate") {
      const overlayPx = percentageToPixels(drag.overlayStart, width, height);
      const center = {
        x: overlayPx.x + overlayPx.w / 2,
        y: overlayPx.y + overlayPx.h / 2,
      };
      const dx = coords.x - center.x;
      const dy = coords.y - center.y;
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      let startDx = drag.start.x - center.x;
      let startDy = drag.start.y - center.y;
      let startAngle = (Math.atan2(startDy, startDx) * 180) / Math.PI;
      const diff = angle - startAngle;
      setOverlay((prev) => ({
        ...prev,
        rotation: (drag.overlayStart.rotation + diff) % 360,
      }));
    }
    e.preventDefault();
  }

  function handlePointerUp() {
    setDrag(null);
  }

  const pointerEvents = {
    onMouseDown: handlePointerDown,
    onMouseMove: drag ? handlePointerMove : undefined,
    onMouseUp: handlePointerUp,
    onMouseLeave: handlePointerUp,
    onTouchStart: handlePointerDown,
    onTouchMove: drag ? handlePointerMove : undefined,
    onTouchEnd: handlePointerUp,
    onTouchCancel: handlePointerUp,
  };

  // Merged function: Download with NO handles visible
  function handleDownload() {
    if (!canvasRef.current || !bgImage || !naturalSize) return;
    const canvas = document.createElement("canvas");
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Draw background
    const img = new window.Image();
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      // Draw overlay
      const ovPx = percentageToPixels(overlay, width, height);
      ctx.save();
      ctx.translate(ovPx.x + ovPx.w / 2, ovPx.y + ovPx.h / 2);
      ctx.rotate((overlay.rotation * Math.PI) / 180);
      ctx.drawImage(
        overlayImage,
        -ovPx.w / 2,
        -ovPx.h / 2,
        ovPx.w,
        ovPx.h
      );
      ctx.restore();
      // Download temp canvas without handles
      const a = document.createElement("a");
      a.download = "billions-network.png";
      a.href = canvas.toDataURL("image/png", 1.0);
      a.click();
    };
    img.src = bgImage;
  }

  function handleSlider(key, value) {
    setOverlay((prev) => ({ ...prev, [key]: Number(value) }));
  }
  function resetOverlay() {
    setOverlay(OVERLAY_INIT);
  }

  // Features for info modal
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning-Fast Transactions",
      description: "Experience unprecedented speed with our advanced blockchain architecture, processing thousands of transactions per second with minimal fees.",
    },
    // (other feature cards unchanged)...
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* (Header, Info Modal, Content and Footer unchanged from previous code) */}
      {/* Drop in your full UI here as before, using canvas, controls, modals, etc. */}
      {/* Only the handleDownload function is replaced with the above logic. */}
    </div>
  );
}
