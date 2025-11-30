
import React, { useEffect, useRef } from 'react';
import { Star, SystemData, Planet } from '../types';
import { kelvinToRGB } from '../utils/drawing';

interface DataPanelProps {
  star: Star;
  system: SystemData;
}

const DataPanel: React.FC<DataPanelProps> = ({ star, system }) => {
  const hrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!hrRef.current) return;
    const canvas = hrRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fix DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);
    const padding = { top: 20, right: 20, bottom: 25, left: 40 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const logMinT = Math.log10(2000); const logMaxT = Math.log10(40000);
    const logMinL = Math.log10(0.0001); const logMaxL = Math.log10(1000000);

    function mapX(t: number) { return padding.left + chartW * (1 - (Math.log10(t) - logMinT) / (logMaxT - logMinT)); }
    function mapY(l: number) { return padding.top + chartH * (1 - (Math.log10(l) - logMinL) / (logMaxL - logMinL)); }

    // Main Sequence Background Shape
    const pts = [{t:40000,l:500000}, {t:20000,l:30000}, {t:10000,l:50}, {t:5778,l:1}, {t:3000,l:0.002}, {t:2000,l:0.00015}];
    ctx.beginPath(); ctx.moveTo(mapX(pts[0].t), mapY(pts[0].l * 3.5));
    for(let i=1;i<pts.length;i++) ctx.lineTo(mapX(pts[i].t), mapY(pts[i].l * 3.5));
    for(let i=pts.length-1;i>=0;i--) ctx.lineTo(mapX(pts[i].t), mapY(pts[i].l * 0.25));
    ctx.closePath(); ctx.fillStyle = "rgba(50, 50, 80, 0.3)"; ctx.fill();

    // Axes
    ctx.fillStyle = "#666"; ctx.font = "10px Barlow"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
    for(let l=-4; l<=6; l++) { 
        const y = mapY(Math.pow(10, l)); 
        ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(w-padding.right, y); ctx.stroke(); 
        ctx.fillText(`10${l < 0 ? l : (l===0?'':'+'+l)}`, padding.left-4, y); 
    }
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    [40000, 20000, 10000, 5000, 4000, 3000, 2000].forEach(t => { 
        const x = mapX(t); 
        ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.beginPath(); ctx.moveTo(x, padding.top); ctx.lineTo(x, h-padding.bottom); ctx.stroke(); 
        if (t === 40000 || t === 10000 || t === 5000 || t === 2000) ctx.fillText(t.toLocaleString(), x, h-padding.bottom+4); 
    });

    ctx.strokeStyle = "#444"; ctx.beginPath(); ctx.moveTo(padding.left, padding.top); ctx.lineTo(padding.left, h-padding.bottom); ctx.lineTo(w-padding.right, h-padding.bottom); ctx.stroke();

    // The Star
    const x = mapX(star.temp); const y = mapY(star.luminosity);
    const rgb = kelvinToRGB(star.temp); 
    ctx.shadowBlur=10; ctx.shadowColor="white"; ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    ctx.strokeStyle=`rgb(${rgb.r},${rgb.g},${rgb.b})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2); ctx.stroke();

  }, [star]);

  const getClassColor = (cls: string) => {
    const colors: Record<string, string> = { 'O': 'text-blue-500', 'B': 'text-blue-300', 'A': 'text-white', 'F': 'text-yellow-100', 'G': 'text-yellow-400', 'K': 'text-orange-400', 'M': 'text-red-500' };
    return colors[cls] || 'text-white';
  };

  const getPlanetLabel = (i: number) => {
    if (i < 25) return String.fromCharCode(98 + i);
    const sub = i - 25;
    return "a" + String.fromCharCode(97 + sub % 26);
  };

  const getPressureDisplay = (p: Planet) => {
    if (['Gas Giant', 'Ice Giant', 'Mini-Neptune'].includes(p.type)) return "> 1000";
    if (p.pressure < 0.01) return "< 0.01";
    return p.pressure.toFixed(2);
  };

  return (
    <div className="flex flex-col h-full bg-space-900 border-l border-space-700 w-full md:w-[450px] shrink-0 overflow-y-auto">
      {/* Star Header */}
      <div className="p-6 border-b border-space-700 bg-space-800">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Stellar Object</h2>
                <div className="text-2xl font-bold text-white mt-1">{star.name}</div>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-xl font-bold ${getClassColor(star.spectralClass)}`}>{star.spectralClass}-Type</span>
                    <span className="text-lg text-white font-light">Main Sequence</span>
                </div>
            </div>
            <div className="text-right">
                <div className="text-xs text-gray-500">System Age</div>
                <div className="text-sm text-gray-300">{(Math.random() * 8 + 0.5).toFixed(2)} Gyr</div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
                <span className="text-gray-500 block text-xs">Mass</span>
                <span className="text-white font-mono">{star.mass.toFixed(3)} M☉</span>
            </div>
            <div>
                <span className="text-gray-500 block text-xs">Radius</span>
                <span className="text-white font-mono">{star.radius.toFixed(3)} R☉</span>
            </div>
            <div>
                <span className="text-gray-500 block text-xs">Luminosity</span>
                <span className="text-white font-mono">{star.luminosity.toLocaleString(undefined, { maximumFractionDigits: 4 })} L☉</span>
            </div>
            <div>
                <span className="text-gray-500 block text-xs">Temperature</span>
                <span className="text-white font-mono">{Math.round(star.temp).toLocaleString()} K</span>
            </div>
            <div>
                <span className="text-gray-500 block text-xs">Metallicity</span>
                <span className="text-white font-mono">{star.metallicity > 0 ? "+" + star.metallicity.toFixed(2) : star.metallicity.toFixed(2)}</span>
            </div>
             <div>
                <span className="text-gray-500 block text-xs">Abs. Mag</span>
                <span className="text-white font-mono">{star.absMag.toFixed(2)}</span>
            </div>
        </div>
      </div>

      {/* HR Diagram */}
      <div className="p-4 border-b border-space-700 h-48">
         <canvas ref={hrRef} className="w-full h-full block" />
         <div className="text-center text-[10px] text-gray-600 mt-1 uppercase tracking-wider">Hertzsprung–Russell Diagram</div>
      </div>

      {/* Planet List */}
      <div className="p-0 flex-1">
         <div className="p-4 bg-space-800 border-b border-space-700 flex justify-between items-center sticky top-0 z-10">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                {system.planets.length} Planet{system.planets.length !== 1 ? 's' : ''}
            </h3>
         </div>

         <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="text-[10px] uppercase text-gray-500 border-b border-space-700 bg-space-900">
                        <th className="p-3 font-semibold">Name</th>
                        <th className="p-3 font-semibold">Type</th>
                        <th className="p-3 font-semibold text-right">Mass (M⊕)</th>
                        <th className="p-3 font-semibold text-right">Orbit (AU)</th>
                        <th className="p-3 font-semibold text-right">Press. (atm)</th>
                        <th className="p-3 font-semibold text-right">Temp (K)</th>
                        <th className="p-3 font-semibold text-center">Comp</th>
                    </tr>
                 </thead>
                 <tbody>
                    {system.planets.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-gray-500 italic">No planetary bodies detected.</td></tr>
                    ) : system.planets.map((p, i) => {
                        return (
                            <tr key={i} className="border-b border-space-700 hover:bg-white/5 transition-colors group">
                                <td className="p-3 font-bold group-hover:text-blue-200">
                                    <span className="text-blue-300 mr-2">{getPlanetLabel(i)}</span>
                                    <span className="text-gray-300 text-xs font-normal">{p.name}</span>
                                </td>
                                <td className="p-3 text-xs text-gray-400">{p.type}</td>
                                <td className="p-3 text-xs text-white font-mono text-right">{p.mass.toFixed(2)}</td>
                                <td className="p-3 text-xs text-yellow-100 font-mono text-right font-bold">{p.a.toFixed(2)}</td>
                                <td className="p-3 text-xs text-gray-400 font-mono text-right">{getPressureDisplay(p)}</td>
                                <td className={`p-3 text-xs text-right font-mono font-bold ${p.temp >= 240 && p.temp <= 373 ? 'text-green-400' : p.temp < 273 ? 'text-blue-300' : 'text-red-300'}`}>
                                    {p.temp.toFixed(0)}
                                </td>
                                <td className="p-3 text-[10px] text-center whitespace-nowrap">
                                    <span className="text-gray-400 font-bold" title="Iron">{(p.comp.fe*100).toFixed(0)}</span><span className="text-gray-700">/</span>
                                    <span className="text-yellow-600 font-bold" title="Silicates">{(p.comp.si*100).toFixed(0)}</span><span className="text-gray-700">/</span>
                                    <span className="text-blue-400 font-bold" title="Water">{(p.comp.h2o*100).toFixed(0)}</span><span className="text-gray-700">/</span>
                                    <span className="text-gray-200 font-bold" title="Hydrogen">{(p.comp.h*100).toFixed(0)}</span>
                                </td>
                            </tr>
                        )
                    })}
                 </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};

export default DataPanel;
