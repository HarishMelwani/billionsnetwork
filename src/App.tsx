import React, { useState, useRef, useEffect } from "react";

const OVERLAY_INIT = {
  x_pct: 0.2, // as percent of width
  y_pct: 0.2, // as percent of height
  w_pct: 0.3, // as percent of width
  h_pct: 0.3, // as percent of height
  rotation: 0,
};

type OverlayState = typeof OVERLAY_INIT;
type DragType = "move" | "resize" | "rotate" | null;

const HANDLE_SIZE = 18; // px

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

export default function ResponsiveOverlayStudio() {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [overlay, setOverlay] = useState<OverlayState>(OVERLAY_INIT);
  const [drag, setDrag] = useState<{
    type: DragType;
    start: { x: number; y: number };
    overlayStart: OverlayState;
    handle?: number; // 0=tl, 1=tr, 2=br, 3=bl, rotate=4
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image and set its size
  useEffect(() => {
    if (!bgImage) return;
    const img = new window.Image();
    img.onload = () =>
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = bgImage;
  }, [bgImage]);

  // Draw canvas
  useEffect(() => {
    if (!bgImage || !naturalSize) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get display size for responsive canvas
    const width = containerRef.current
      ? containerRef.current.offsetWidth
      : naturalSize.width;
    const height = Math.round((naturalSize.height / naturalSize.width) * width);

    canvas.width = width;
    canvas.height = height;

    // DRAW background image
    const img = new window.Image();
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // DRAW overlay
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

      // DRAW drag handles
      const handleCoords = [
        // corners: TL, TR, BR, BL
        { x: -ovPx.w / 2, y: -ovPx.h / 2 },
        { x: ovPx.w / 2, y: -ovPx.h / 2 },
        { x: ovPx.w / 2, y: ovPx.h / 2 },
        { x: -ovPx.w / 2, y: ovPx.h / 2 }
      ].map(({ x, y }) => {
        // rotate relative to center
        const theta = (overlay.rotation * Math.PI) / 180;
        const nx = x * Math.cos(theta) - y * Math.sin(theta);
        const ny = x * Math.sin(theta) + y * Math.cos(theta);
        return {
          x: ovPx.x + ovPx.w / 2 + nx,
          y: ovPx.y + ovPx.h / 2 + ny
        };
      });
      // Rotate handle (above top center)
      const theta = (overlay.rotation * Math.PI) / 180;
      const rx =
        ovPx.x +
        ovPx.w / 2 +
        (0 * Math.cos(theta) - (-ovPx.h / 2 - 30) * Math.sin(theta));
      const ry =
        ovPx.y +
        ovPx.h / 2 +
        (0 * Math.sin(theta) + (-ovPx.h / 2 - 30) * Math.cos(theta));
      // Draw handles
      handleCoords.forEach(({ x, y }) => {
        ctx.beginPath();
        ctx.arc(x, y, HANDLE_SIZE / 2, 0, 2 * Math.PI);
        ctx.fillStyle = "#1366f2";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      // Draw rotate handle
      ctx.beginPath();
      ctx.arc(rx, ry, HANDLE_SIZE / 2, 0, 2 * Math.PI);
      ctx.fillStyle = "#16a34a";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    img.src = bgImage;
  }, [bgImage, overlay, naturalSize]);

  // Billions Network overlay logo
  const overlayImage = (() => {
    const img = new window.Image();
    img.src = "/Billions.png";
    return img;
  })();

  // Figure out which handle is pressed
  function getHandleAtPoint(x: number, y: number, width: number, height: number) {
    const ovPx = percentageToPixels(overlay, width, height);
    // get corners and rotate them
    const handleCoords = [
      { x: -ovPx.w / 2, y: -ovPx.h / 2 },
      { x: ovPx.w / 2, y: -ovPx.h / 2 },
      { x: ovPx.w / 2, y: ovPx.h / 2 },
      { x: -ovPx.w / 2, y: ovPx.h / 2 }
    ].map(({ x, y }) => {
      const theta = (overlay.rotation * Math.PI) / 180;
      const nx = x * Math.cos(theta) - y * Math.sin(theta);
      const ny = x * Math.sin(theta) + y * Math.cos(theta);
      return {
        x: ovPx.x + ovPx.w / 2 + nx,
        y: ovPx.y + ovPx.h / 2 + ny
      };
    });
    // rotate handle (above, offset)
    const theta = (overlay.rotation * Math.PI) / 180;
    const rx =
      ovPx.x +
      ovPx.w / 2 +
      (0 * Math.cos(theta) - (-ovPx.h / 2 - 30) * Math.sin(theta));
    const ry =
      ovPx.y +
      ovPx.h / 2 +
      (0 * Math.sin(theta) + (-ovPx.h / 2 - 30) * Math.cos(theta));
    // find handle within range
    for (let i = 0; i < handleCoords.length; i++) {
      if (
        Math.hypot(x - handleCoords[i].x, y - handleCoords[i].y) < HANDLE_SIZE
      )
        return i;
    }
    // rotate-handle: index 4
    if (Math.hypot(x - rx, y - ry) < HANDLE_SIZE) return 4;
    return null;
  }

  // Get mouse or touch coordinates over canvas
  function getCanvasCoords(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ((e as React.TouchEvent).touches) {
      const touch = (e as React.TouchEvent).touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  // Mouse/touch down
  function handlePointerDown(e: React.MouseEvent | React.TouchEvent) {
    if (!naturalSize) return;
    const coords = getCanvasCoords(e);
    const width = canvasRef.current!.width;
    const height = canvasRef.current!.height;

    const handle = getHandleAtPoint(coords.x, coords.y, width, height);
    if (handle !== null) {
      // corner handle: resize, rotate-handle: rotate
      setDrag({
        type: handle === 4 ? "rotate" : "resize",
        start: coords,
        overlayStart: { ...overlay },
        handle: handle,
      });
      e.preventDefault();
      return;
    }

    // check if in overlay (rotated rectangle)
    const ovPx = percentageToPixels(overlay, width, height);
    // Inverse rotate coords
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

  function handlePointerMove(e: React.MouseEvent | React.TouchEvent) {
    if (!drag || !naturalSize) return;
    if ((e as React.TouchEvent).touches && (e as React.TouchEvent).touches.length === 0) return;
    const coords = getCanvasCoords(e);
    const width = canvasRef.current!.width;
    const height = canvasRef.current!.height;

    if (drag.type === "move") {
      // move center
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
      // which handle
      const i = drag.handle!;
      const overlayPx = percentageToPixels(drag.overlayStart, width, height);

      // Find opposite corner
      let anchor;
      if (i === 0) anchor = { x: overlayPx.x + overlayPx.w, y: overlayPx.y + overlayPx.h };
      if (i === 1) anchor = { x: overlayPx.x, y: overlayPx.y + overlayPx.h };
      if (i === 2) anchor = { x: overlayPx.x, y: overlayPx.y };
      if (i === 3) anchor = { x: overlayPx.x + overlayPx.w, y: overlayPx.y };
      // Calculate after rotation
      // Transform pointer around anchor, then rotate inverse
      const theta = (-drag.overlayStart.rotation * Math.PI) / 180;
      const dx = coords.x - anchor.x;
      const dy = coords.y - anchor.y;
      const nx = dx * Math.cos(theta) - dy * Math.sin(theta);
      const ny = dx * Math.sin(theta) + dy * Math.cos(theta);
      // Determine new size
      let w = Math.abs(nx);
      let h = Math.abs(ny);
      // Optionally, minimum size
      w = Math.max(40, Math.min(w, width));
      h = Math.max(40, Math.min(h, height));
      // Recompute position to keep anchor stable
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
      // angle from center to pointer
      const dx = coords.x - center.x;
      const dy = coords.y - center.y;
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      // Angle from center to top middle before rotation
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

  // For responsive design and pointer events
  const pointerEvents = {
    // Mouse
    onMouseDown: handlePointerDown,
    onMouseMove: drag ? handlePointerMove : undefined,
    onMouseUp: handlePointerUp,
    onMouseLeave: handlePointerUp,
    // Touch
    onTouchStart: handlePointerDown,
    onTouchMove: drag ? handlePointerMove : undefined,
    onTouchEnd: handlePointerUp,
    onTouchCancel: handlePointerUp,
  };

  // Responsive container styles for canvas
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-2 sm:p-8">
      <div className="rounded-2xl max-w-2xl mx-auto shadow-xl bg-white border border-slate-200">
        <div className="p-2 sm:p-6 flex flex-col gap-4 items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Responsive Overlay Studio</h2>
          {!bgImage ? (
            <div
              onClick={() => document.getElementById("file-upload")?.click()}
              className="border-2 border-dashed border-blue-500/30 rounded-xl p-5 sm:p-12 text-center hover:bg-blue-50/30 transition-all duration-200 cursor-pointer group"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">Upload Your Image</h3>
              <p className="text-sm sm:text-base text-slate-500">Tap to select image</p>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="relative w-full max-w-full"
              style={{ aspectRatio: `${naturalSize?.width ?? 16}/${naturalSize?.height ?? 9}`, maxWidth: 800 }}
            >
              <canvas
                ref={canvasRef}
                {...pointerEvents}
                className="w-full h-full touch-none select-none rounded-xl shadow"
                style={{ display: "block" }}
              />
              <button
                className="absolute top-3 right-3 p-3 bg-blue-700 rounded-lg text-white"
                type="button"
                onClick={() => setBgImage(null)}
              >
                Remove
              </button>
            </div>
          )}
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (evt) => setBgImage(evt.target?.result as string);
              reader.readAsDataURL(file);
            }}
          />
        </div>
      </div>
      <div className="text-slate-500 text-sm text-center mt-8 max-w-xl mx-auto">
        Drag the overlay to move. Drag a blue corner to resize, drag green handle above to rotate.<br/>
        Responsive UI—works smoothly on all screens and aspect ratios, mouse and touch!
      </div>
    </div>
  );
}
