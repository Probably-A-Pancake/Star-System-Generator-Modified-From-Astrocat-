import React, { useRef, useEffect, useState } from 'react';
import { CameraOrbit, CameraScale, Star, SystemData, ViewMode } from '../types';
import { drawSystem3D, drawSystemScale } from '../utils/drawing';

interface VisualizerProps {
  star: Star;
  system: SystemData;
  viewMode: ViewMode;
  orbitCam: CameraOrbit;
  setOrbitCam: React.Dispatch<React.SetStateAction<CameraOrbit>>;
  scaleCam: CameraScale;
  setScaleCam: React.Dispatch<React.SetStateAction<CameraScale>>;
}

const Visualizer: React.FC<VisualizerProps> = ({ 
  star, 
  system, 
  viewMode, 
  orbitCam, 
  setOrbitCam, 
  scaleCam, 
  setScaleCam 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Background stars for 3D view (stable per session)
  const [bgStars] = useState(() => {
    const stars = [];
    for(let i=0; i<200; i++) stars.push({ x: Math.random()*2000 - 1000, y: Math.random()*2000 - 1000, size: Math.random() * 1.5, alpha: Math.random() });
    return stars;
  });

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    
    const render = () => {
       // Resize handling
       const dpr = window.devicePixelRatio || 1;
       const rect = canvas.getBoundingClientRect();
       
       if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
           canvas.width = rect.width * dpr;
           canvas.height = rect.height * dpr;
           ctx.scale(dpr, dpr);
       }
       const w = rect.width;
       const h = rect.height;

       if (viewMode === 'orbit') {
          drawSystem3D(ctx, w, h, star, system, orbitCam, bgStars);
       } else {
          drawSystemScale(ctx, w, h, star, system, scaleCam);
       }
       animId = requestAnimationFrame(render);
    }

    render();
    return () => cancelAnimationFrame(animId);
  }, [star, system, viewMode, orbitCam, scaleCam, bgStars]);

  // Interaction Handlers
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };

    if (viewMode === 'orbit') {
        setOrbitCam(prev => ({
            ...prev,
            rotZ: prev.rotZ + dx * 0.5,
            rotX: Math.max(10, Math.min(90, prev.rotX - dy * 0.5))
        }));
    } else {
        setScaleCam(prev => ({
            ...prev,
            panX: prev.panX + dx
        }));
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    if (viewMode === 'orbit') {
        setOrbitCam(prev => ({
            ...prev,
            zoom: Math.max(2, Math.min(1200, prev.zoom * delta))
        }));
    } else {
        setScaleCam(prev => ({
            ...prev,
            zoom: Math.max(0.1, Math.min(60, prev.zoom * delta))
        }));
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden cursor-move">
      <canvas 
        ref={canvasRef}
        className="block w-full h-full touch-none"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
      />
    </div>
  );
};

export default Visualizer;