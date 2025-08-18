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

// Overlay defaults
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

  // Info modal features
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Stay Private",
      description: "Only you control access. Your personal information stays encrypted and private, right on your device.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Verification for Humans & AI",
      description: "Billions allows humans and AI to be verified, privately and securely.",
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Verify with Your Phone",
      description: "No proprietary hardware required. All you need is your phone.",
    },
    {
      icon: <Coins className="w-6 h-6" />,
      title: "Earn Ongoing Rewards",
      description: "Verify you're human and complete tasks on the Billions Portal to earn rewards.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Identity And accountability for ai",
      description: "Billions gives humans and AI agents verifiable identities so you can trust the individuals with whom you interact.",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Want to go deeper?",
      description: "Read our technical report on Billions’ Deep Trust Framework.",
    },
  ];

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

      // Draw handles (for live canvas only)
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
        ctx.fillStyle = "#1366f2";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
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

  // Download (draw temp canvas, NO handles)
  function handleDownload() {
    if (!bgImage || !naturalSize || !canvasRef.current) return;
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
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
      // Export! (no handles drawn here)
      const a = document.createElement("a");
      a.download = "billions-network.png";
      a.href = tempCanvas.toDataURL("image/png", 1.0);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-2 py-4 md:px-6 md:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#083aa8] to-[#1366f2] flex items-center justify-center shadow-lg">
                <div className="w-8 h-6 rounded-lg bg-white/90 flex items-center justify-center">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-3 bg-[#083aa8] rounded-full"></div>
                    <div className="w-1.5 h-3 bg-[#083aa8] rounded-full"></div>
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#083aa8] to-[#1366f2] bg-clip-text text-transparent leading-none">
                  Billions Network
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">Image Studio by <a href="https://x.com/harishmelwanii" target="_blank" rel="noopener noreferrer" className="hover:underline">0xharish</a></p>
              </div>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center space-x-2 px-3 py-2 bg-[#083aa8] text-white rounded-lg hover:bg-[#0629a0] transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Info className="w-4 h-4" />
              <span>About Network</span>
            </button>
          </div>
        </div>
      </header>
      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-full sm:max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-[#083aa8] to-[#1366f2] bg-clip-text text-transparent mb-1 sm:mb-2">
                  Billions Network
                </h2>
                <p className="text-sm sm:text-lg text-slate-600">The Human and AI Network</p>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors text-xl font-semibold"
                aria-label="Close information modal"
              >
                ×
              </button>
            </div>
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-[#083aa8] to-[#1366f2] rounded-xl text-white">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">The Human and AI Network</h3>
              <p className="text-sm sm:text-lg text-blue-100 leading-relaxed">
              Prove you’re human and start earning Power — Billions’ reward points. The more you use the network, the more experiences and ongoing rewards you unlock
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
              {features.map((feature, index) => (
                <div key={index}
                  className="bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#083aa8] text-white flex items-center justify-center shadow-md">
                      {feature.icon}
                    </div>
                    <h3 className="text-base sm:text-xl font-semibold text-slate-800">{feature.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
            {/* Why Choose Billions, Join Our Ecosystem sections can go here */}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-2 py-6 md:px-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Canvas Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border border-slate-200">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1 sm:mb-2">Upload your image and add the Billions Network branding with precision controls - by <a href="https://x.com/harishmelwanii" target="_blank" rel="noopener noreferrer" className="hover:underline">0XHarish</a></h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  
                </p>
              </div>
              {!bgImage ? (
                <div
                  onClick={() => document.getElementById("file-upload")?.click()}
                  className="border-2 border-dashed border-[#083aa8]/30 rounded-xl p-8 sm:p-12 text-center hover:border-[#083aa8]/50 hover:bg-[#083aa8]/5 transition-all duration-200 cursor-pointer group select-none"
                >
                  <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-[#083aa8] mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-1">Upload Your Background Image</h3>
                  <p className="text-xs sm:text-sm text-slate-500">Drag & drop your image here or click to browse</p>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">Supports JPG, PNG, GIF up to 10MB</p>
                </div>
              ) : (
                <div
                  ref={containerRef}
                  className="relative w-full"
                  style={{
                    aspectRatio: `${naturalSize?.width ?? 16}/${naturalSize?.height ?? 9}`,
                    maxWidth: 900,
                    minHeight: 240,
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    {...pointerEvents}
                    className="w-full h-full touch-none select-none rounded-xl shadow"
                    style={{ display: "block" }}
                  />
                  <div className="absolute top-4 right-4 flex space-x-2 z-10">
                    <button
                      onClick={handleDownload}
                      className="bg-[#083aa8] text-white p-3 rounded-lg hover:bg-[#0629a0] transition-all duration-200 shadow-lg hover:shadow-xl group"
                      title="Download Image"
                    >
                      <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      className="bg-slate-600 text-white p-3 rounded-lg hover:bg-slate-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      title="Clear Image"
                      onClick={() => { setBgImage(null); resetOverlay(); }}
                    >
                      <span className="text-lg font-semibold">×</span>
                    </button>
                  </div>
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
          {/* Controls Panel WITH SLIDERS */}
          <div className="space-y-6">

            {/* Mouse/Touch info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 border border-blue-200">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <h4 className="font-medium text-blue-800 text-sm sm:text-base">Mouse & Touch Controls</h4>
              </div>
              <p className="text-xs sm:text-sm text-blue-700">
                Tap and drag the overlay directly on the canvas to move, resize from corners, rotate from green handle.
              </p>
            </div>
            {/* Position Controls */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#083aa8] flex items-center justify-center">
                  <Move className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 text-base sm:text-lg">Position Controls</h3>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2">Horizontal Position</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.001"
                    value={overlay.x_pct}
                    onChange={(e) => handleSlider("x_pct", e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1 select-none">
                    <span>Left</span>
                    <span className="font-medium text-[#083aa8]">{Math.round(overlay.x_pct * 100)}%</span>
                    <span>Right</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2">Vertical Position</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.001"
                    value={overlay.y_pct}
                    onChange={(e) => handleSlider("y_pct", e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1 select-none">
                    <span>Top</span>
                    <span className="font-medium text-[#083aa8]">{Math.round(overlay.y_pct * 100)}%</span>
                    <span>Bottom</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Size Controls */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#083aa8] flex items-center justify-center">
                  <Resize className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 text-base sm:text-lg">Size Controls</h3>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2">Width</label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.9"
                    step="0.001"
                    value={overlay.w_pct}
                    onChange={(e) => handleSlider("w_pct", e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1 select-none">
                    <span>Min</span>
                    <span className="font-medium text-[#083aa8]">{Math.round(overlay.w_pct * 100)}%</span>
                    <span>Max</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2">Height</label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.9"
                    step="0.001"
                    value={overlay.h_pct}
                    onChange={(e) => handleSlider("h_pct", e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1 select-none">
                    <span>Min</span>
                    <span className="font-medium text-[#083aa8]">{Math.round(overlay.h_pct * 100)}%</span>
                    <span>Max</span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setOverlay((prev) => ({ ...prev, w_pct: prev.h_pct }))
                  }
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium"
                >
                  Lock Aspect Ratio (Square)
                </button>
              </div>
            </div>

            {/* Rotation Controls */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#083aa8] flex items-center justify-center">
                  <RotateCw className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 text-base sm:text-lg">Rotation Control</h3>
              </div>
              <div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={overlay.rotation}
                  onChange={(e) => handleSlider("rotation", e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider mb-4"
                />
                <div className="flex justify-between text-xs text-slate-500 mb-4 select-none">
                  <span>0°</span>
                  <span className="font-medium text-[#083aa8] text-sm sm:text-lg">{Math.round(overlay.rotation)}°</span>
                  <span>360°</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSlider("rotation", 0)}
                    className="py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium"
                  >
                    Reset (0°)
                  </button>
                  <button
                    onClick={() => handleSlider("rotation", 90)}
                    className="py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium"
                  >
                    90°
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-[#083aa8] to-[#1366f2] rounded-2xl p-4 sm:p-6 text-white">
              <h3 className="font-semibold mb-3 text-base sm:text-lg">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={resetOverlay}
                  className="w-full py-2 px-4 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium"
                >
                  Reset All Settings
                </button>
                <div className="text-xs sm:text-sm text-blue-100">
                  <p className="mb-1 sm:mb-2"><strong>Pro Tip:</strong></p>
                  <p>
                    Position the overlay in corners or edges for professional watermarking, or center it for bold branding impact.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-sm border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-12">
        &copy; 2025 Billions Network &ndash; Image Studio
      </footer>
    </div>
  );
}
