import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  Download,
  RotateCw,
  Move,
  Maximize as Resize,
  Info,
  Zap,
  Shield,
  Globe,
  Coins,
  Users,
  TrendingUp,
} from 'lucide-react';

interface OverlayState {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface MouseState {
  isDragging: boolean;
  dragStart: { x: number; y: number };
  overlayStart: { x: number; y: number };
}

function App() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<OverlayState>({
    x: 50,
    y: 50,
    width: 150,
    height: 150,
    rotation: 0,
  });
  const [mouseState, setMouseState] = useState<MouseState>({
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    overlayStart: { x: 0, y: 0 },
  });
  const [showInfo, setShowInfo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // The Billions Network overlay logo (blue rounded rectangle with two oval eyes)
  const overlayImageSrc = '/Billions.png';

  // Handle uploaded background image
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Update canvas with background and overlay drawn
  const updateCanvas = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !backgroundImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgImg = new Image();
    const overlayImg = new Image();

    bgImg.onload = () => {
      // Scale canvas size responsively to max width 100%, keeping bg image aspect ratio
      canvas.width = bgImg.width;
      canvas.height = bgImg.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      overlayImg.onload = () => {
        ctx.save();
        ctx.translate(overlay.x + overlay.width / 2, overlay.y + overlay.height / 2);
        ctx.rotate((overlay.rotation * Math.PI) / 180);
        ctx.drawImage(
          overlayImg,
          -overlay.width / 2,
          -overlay.height / 2,
          overlay.width,
          overlay.height
        );
        ctx.restore();
      };
      overlayImg.src = overlayImageSrc;
    };
    bgImg.src = backgroundImage;
  }, [backgroundImage, overlay, overlayImageSrc]);

  useEffect(() => {
    updateCanvas();
  }, [updateCanvas]);

  // Get canvas-relative coordinates scaled for device pixels, used for mouse/touch
  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Check if point hits overlay rectangle (ignoring rotation for simplicity)
  const isPointInOverlay = (x: number, y: number) => {
    return (
      x >= overlay.x &&
      x <= overlay.x + overlay.width &&
      y >= overlay.y &&
      y <= overlay.y + overlay.height
    );
  };

  // --- Mouse Handlers ---
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!backgroundImage) return;
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    if (isPointInOverlay(coords.x, coords.y)) {
      setMouseState({
        isDragging: true,
        dragStart: coords,
        overlayStart: { x: overlay.x, y: overlay.y },
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mouseState.isDragging || !backgroundImage) return;
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    const deltaX = coords.x - mouseState.dragStart.x;
    const deltaY = coords.y - mouseState.dragStart.y;
    const newX = Math.max(0, Math.min(500, mouseState.overlayStart.x + deltaX));
    const newY = Math.max(0, Math.min(500, mouseState.overlayStart.y + deltaY));
    setOverlay((prev) => ({
      ...prev,
      x: newX,
      y: newY,
    }));
  };

  const handleMouseUp = () => {
    setMouseState((prev) => ({ ...prev, isDragging: false }));
  };

  const handleMouseLeave = () => {
    setMouseState((prev) => ({ ...prev, isDragging: false }));
  };

  // --- Touch Handlers ---
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!backgroundImage) return;
    const touch = e.touches[0];
    if (!touch) return;
    const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
    if (isPointInOverlay(coords.x, coords.y)) {
      setMouseState({
        isDragging: true,
        dragStart: coords,
        overlayStart: { x: overlay.x, y: overlay.y },
      });
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!mouseState.isDragging || !backgroundImage) return;
    const touch = e.touches[0];
    if (!touch) return;
    const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
    const deltaX = coords.x - mouseState.dragStart.x;
    const deltaY = coords.y - mouseState.dragStart.y;
    setOverlay((prev) => ({
      ...prev,
      x: Math.max(0, Math.min(500, mouseState.overlayStart.x + deltaX)),
      y: Math.max(0, Math.min(500, mouseState.overlayStart.y + deltaY)),
    }));
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    setMouseState((prev) => ({ ...prev, isDragging: false }));
  };

  // Cursor style for desktop
  const getCanvasCursor = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!backgroundImage) return 'default';
    if (mouseState.isDragging) return 'grabbing';
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    return isPointInOverlay(coords.x, coords.y) ? 'grab' : 'default';
  };

  // Download canvas image
  const downloadImage = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'billions-network.png';
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  }, []);

  // Reset overlay to initial
  const resetOverlay = () => {
    setOverlay({ x: 50, y: 50, width: 150, height: 150, rotation: 0 });
  };

  // Features Array for Info Modal
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Lightning-Fast Transactions',
      description:
        'Experience unprecedented speed with our advanced blockchain architecture, processing thousands of transactions per second with minimal fees.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Enterprise-Grade Security',
      description:
        'Built with military-grade encryption and cutting-edge consensus mechanisms to ensure your digital assets are protected 24/7.',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Global Decentralized Network',
      description:
        'Connect seamlessly from anywhere in the world through our robust, decentralized infrastructure spanning multiple continents.',
    },
    {
      icon: <Coins className="w-6 h-6" />,
      title: 'Comprehensive DeFi Ecosystem',
      description:
        'Access a full suite of decentralized finance tools including staking, lending, yield farming, and liquidity mining.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community-Driven Governance',
      description:
        'Participate in democratic decision-making through our innovative DAO structure, where every voice matters in shaping the future.',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Sustainable Growth Model',
      description:
        'Built for long-term success with tokenomics designed to reward early adopters while ensuring sustainable ecosystem growth.',
    },
  ];

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
                <p className="text-xs sm:text-sm text-slate-500">Overlay Image Studio</p>
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
                <p className="text-sm sm:text-lg text-slate-600">The Future of Decentralized Finance</p>
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
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                Revolutionizing Blockchain Technology
              </h3>
              <p className="text-sm sm:text-lg text-blue-100 leading-relaxed">
                Billions Network is pioneering the next generation of blockchain infrastructure,
                designed to serve billions of users worldwide. Our innovative approach combines
                unparalleled scalability, enterprise-grade security, and user-centric design to create
                a truly decentralized ecosystem that empowers individuals and businesses alike.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
              {features.map((feature, index) => (
                <div
                  key={index}
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-6 rounded-xl border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-2 sm:mb-3">Why Choose Billions Network?</h3>
                <ul className="space-y-1 sm:space-y-2 text-green-700 text-xs sm:text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Proven track record with institutional partnerships</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Carbon-neutral blockchain operations</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>24/7 developer support and documentation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Cross-chain compatibility and interoperability</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 sm:p-6 rounded-xl border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mb-2 sm:mb-3">Join Our Growing Ecosystem</h3>
                <p className="text-purple-700 text-xs sm:text-sm mb-3 sm:mb-4">
                  Be part of a revolutionary movement that's reshaping the future of finance,
                  governance, and digital interaction.
                </p>
                <div className="flex items-center space-x-4 text-purple-600 text-xs sm:text-sm">
                  <div className="text-center">
                    <div className="font-bold text-base sm:text-lg">1M+</div>
                    <div>Active Users</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-base sm:text-lg">50+</div>
                    <div>Countries</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-base sm:text-lg">$2B+</div>
                    <div>TVL</div>
                  </div>
                </div>
              </div>
            </div>
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
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1 sm:mb-2">
                  Professional Image Overlay Studio
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Upload your image and add the Billions Network branding overlay with precision controls
                </p>
              </div>

              {!backgroundImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#083aa8]/30 rounded-xl p-8 sm:p-12 text-center hover:border-[#083aa8]/50 hover:bg-[#083aa8]/5 transition-all duration-200 cursor-pointer group select-none"
                >
                  <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-[#083aa8] mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-1">Upload Your Background Image</h3>
                  <p className="text-xs sm:text-sm text-slate-500">Drag & drop your image here or click to browse</p>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">Supports JPG, PNG, GIF up to 10MB</p>
                </div>
              ) : (
                <div className="relative bg-slate-100 rounded-xl overflow-hidden min-h-[240px] sm:min-h-[400px] flex items-center justify-center">
                  <canvas
                    ref={previewCanvasRef}
                    className="w-full h-[60vw] max-h-[400px] object-contain shadow-lg rounded-lg touch-none"
                    style={{ touchAction: 'none', cursor: mouseState.isDragging ? 'grabbing' : 'grab' }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                  />
                  <div className="absolute top-4 right-4 flex space-x-2 z-10">
                    <button
                      onClick={downloadImage}
                      className="bg-[#083aa8] text-white p-3 rounded-lg hover:bg-[#0629a0] transition-all duration-200 shadow-lg hover:shadow-xl group"
                      title="Download Image"
                    >
                      <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => {
                        setBackgroundImage(null);
                        resetOverlay();
                      }}
                      className="bg-slate-600 text-white p-3 rounded-lg hover:bg-slate-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      title="Clear Image"
                    >
                      <span className="text-lg font-semibold">×</span>
                    </button>
                  </div>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-6">
            {/* Mouse Control Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 border border-blue-200">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <h4 className="font-medium text-blue-800 text-sm sm:text-base">Mouse & Touch Controls</h4>
              </div>
              <p className="text-xs sm:text-sm text-blue-700">
                Tap and drag the overlay directly on the canvas to reposition it. Use the sliders below for precise adjustments.
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
                    max="500"
                    value={overlay.x}
                    onChange={(e) => setOverlay({ ...overlay, x: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #083aa8 0%, #083aa8 ${(overlay.x / 500) * 100}%, #e2e8f0 ${(overlay.x / 500) * 100}%, #e2e8f0 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1 select-none">
                    <span>0px</span>
                    <span className="font-medium text-[#083aa8]">{overlay.x}px</span>
                    <span>500px</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2">Vertical Position</label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={overlay.y}
                    onChange={(e) => setOverlay({ ...overlay, y: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #083aa8 0%, #083aa8 ${(overlay.y / 500) * 100}%, #e2e8f0 ${(overlay.y / 500) * 100}%, #e2e8f0 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1 select-none">
                    <span>0px</span>
                    <span className="font-medium text-[#083aa8]">{overlay.y}px</span>
                    <span>500px</span>
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
                    min="50"
                    max="400"
                    value={overlay.width}
                    onChange={(e) => setOverlay({ ...overlay, width: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #083aa8 0%, #083aa8 ${((overlay.width - 50) / 350) * 100}%, #e2e8f0 ${((overlay.width - 50) / 350) * 100}%, #e2e8f0 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1 select-none">
                    <span>50px</span>
                    <span className="font-medium text-[#083aa8]">{overlay.width}px</span>
                    <span>400px</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2">Height</label>
                  <input
                    type="range"
                    min="50"
                    max="400"
                    value={overlay.height}
                    onChange={(e) => setOverlay({ ...overlay, height: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #083aa8 0%, #083aa8 ${((overlay.height - 50) / 350) * 100}%, #e2e8f0 ${((overlay.height - 50) / 350) * 100}%, #e2e8f0 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1 select-none">
                    <span>50px</span>
                    <span className="font-medium text-[#083aa8]">{overlay.height}px</span>
                    <span>400px</span>
                  </div>
                </div>
                <button
                  onClick={() => setOverlay({ ...overlay, width: overlay.height })}
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
                  onChange={(e) => setOverlay({ ...overlay, rotation: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider mb-4"
                  style={{
                    background: `linear-gradient(to right, #083aa8 0%, #083aa8 ${(overlay.rotation / 360) * 100}%, #e2e8f0 ${(overlay.rotation / 360) * 100}%, #e2e8f0 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-slate-500 mb-4 select-none">
                  <span>0°</span>
                  <span className="font-medium text-[#083aa8] text-sm sm:text-lg">{overlay.rotation}°</span>
                  <span>360°</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOverlay({ ...overlay, rotation: 0 })}
                    className="py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium"
                  >
                    Reset (0°)
                  </button>
                  <button
                    onClick={() => setOverlay({ ...overlay, rotation: 90 })}
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
                  <p className="mb-1 sm:mb-2">
                    <strong>Pro Tip:</strong>
                  </p>
                  <p>Position the overlay in corners or edges for professional watermarking, or center it for bold branding impact.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default App;
