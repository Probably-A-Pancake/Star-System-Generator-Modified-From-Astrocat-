import React, { useState, useEffect } from 'react';
import { generateStar, generatePlanets } from './utils/physics';
import Visualizer from './components/Visualizer';
import DataPanel from './components/DataPanel';
import { Star, SystemData, ViewMode, CameraOrbit, CameraScale } from './types';

function App() {
  const [star, setStar] = useState<Star | null>(null);
  const [system, setSystem] = useState<SystemData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('orbit');
  const [targetClass, setTargetClass] = useState<string>('Random');

  // Lifted State for Camera to allow HUD positioning in App
  const [orbitCam, setOrbitCam] = useState<CameraOrbit>({ zoom: 20, rotX: 60, rotZ: 0 });
  const [scaleCam, setScaleCam] = useState<CameraScale>({ zoom: 1.0, panX: 0 });

  const generateSystem = (cls?: string) => {
    const selectedClass = cls || targetClass;
    const newStar = generateStar(selectedClass === 'Random' ? undefined : selectedClass);
    const newSystem = generatePlanets(newStar);
    setStar(newStar);
    setSystem(newSystem);
  };

  const handleClassSelect = (cls: string) => {
      setTargetClass(cls);
      generateSystem(cls);
  };

  // Initial Load
  useEffect(() => {
    generateSystem();
  }, []);

  if (!star || !system) return <div className="w-full h-screen bg-black text-white flex items-center justify-center font-mono">Initializing Astrophysics Simulation...</div>;

  const classes = ['Random', 'O', 'B', 'A', 'F', 'G', 'K', 'M'];

  const getClassColor = (c: string) => {
      if(c === 'Random') return 'text-white border-white/20';
      const map: Record<string, string> = { 'O': 'text-blue-500 border-blue-500/50', 'B': 'text-blue-300 border-blue-300/50', 'A': 'text-white border-white/50', 'F': 'text-yellow-100 border-yellow-100/50', 'G': 'text-yellow-400 border-yellow-400/50', 'K': 'text-orange-400 border-orange-400/50', 'M': 'text-red-500 border-red-500/50' };
      return map[c] || 'text-gray-400';
  }

  return (
    <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden bg-space-900 text-gray-100 font-sans">
      
      {/* Main View Area */}
      <div className="flex-1 relative flex flex-col h-[60vh] md:h-full min-h-0">
        
        {/* Top Center Controls & HUD Container */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col gap-1 items-start">
            
            {/* Star Class Selector */}
            <div className="flex gap-1 bg-space-800/90 backdrop-blur p-1 rounded-lg border border-space-700 shadow-xl">
                {classes.map(c => (
                    <button
                        key={c}
                        onClick={() => handleClassSelect(c)}
                        className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all border ${targetClass === c ? 'bg-white/10 ' + getClassColor(c) : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {/* HUD Info - Left Aligned to Star Picker */}
            <div className="text-white text-xs font-mono bg-space-800/60 border border-white/10 p-2 rounded-lg backdrop-blur-md shadow-xl min-w-[140px] pointer-events-none select-none">
                {viewMode === 'orbit' ? (
                    <>
                    <div className="text-[10px] font-bold text-blue-400 mb-1 uppercase tracking-widest">Orbital View</div>
                    <div className="flex justify-between items-center mb-0.5">
                        <span className="text-gray-500">ZOOM</span> 
                        <span className="text-white font-bold">{(orbitCam.zoom / 20).toFixed(1)}x</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">INC</span> 
                        <span className="text-white font-bold">{orbitCam.rotX.toFixed(0)}°</span>
                    </div>
                    </>
                ) : (
                    <>
                    <div className="text-[10px] font-bold text-blue-400 mb-1 uppercase tracking-widest">Scale View</div>
                    <div className="flex justify-between items-center mb-0.5">
                        <span className="text-gray-500">SCALE</span> 
                        <span className="text-white font-bold">{scaleCam.zoom.toFixed(1)}x</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">PAN</span> 
                        <span className="text-white font-bold">{scaleCam.panX.toFixed(0)}px</span>
                    </div>
                    </>
                )}
            </div>
        </div>

        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
            <div className="bg-space-800/80 backdrop-blur p-1 rounded-lg border border-space-700 flex gap-1">
                <button 
                    onClick={() => setViewMode('orbit')}
                    className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'orbit' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    Orbit View
                </button>
                <button 
                    onClick={() => setViewMode('scale')}
                    className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'scale' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    Scale View
                </button>
            </div>
        </div>

        {/* Generate Button */}
        <div className="absolute bottom-6 left-6 z-20">
            <button 
                onClick={() => generateSystem()}
                className="group relative px-6 py-3 bg-white text-black font-bold uppercase tracking-widest text-sm rounded hover:bg-blue-400 transition-colors shadow-xl shadow-white/10"
            >
                Generate New System
                <div className="absolute inset-0 border border-white rounded scale-105 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"></div>
            </button>
        </div>

        {/* Legend Overlay */}
        {viewMode === 'orbit' && (
            <div className="absolute bottom-6 right-6 z-20 pointer-events-none select-none">
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono bg-black/40 backdrop-blur px-3 py-2 rounded border border-white/10">
                    <div className="w-3 h-3 bg-green-500/20 border border-green-500/50 rounded-full"></div>
                    <span>Habitable Zone</span>
                </div>
            </div>
        )}

        <Visualizer 
            star={star} 
            system={system} 
            viewMode={viewMode}
            orbitCam={orbitCam}
            setOrbitCam={setOrbitCam}
            scaleCam={scaleCam}
            setScaleCam={setScaleCam}
        />
      </div>

      {/* Side Panel */}
      <DataPanel star={star} system={system} />
      
    </div>
  );
}

export default App;