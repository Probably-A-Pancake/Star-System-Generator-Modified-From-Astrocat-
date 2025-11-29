import { Star, SystemData, CameraOrbit, CameraScale, RGB } from '../types';

export function kelvinToRGB(kelvin: number): RGB {
    let temp = kelvin / 100;
    let r, g, b;
    if (temp <= 66) {
        r = 255;
        g = temp;
        g = 99.4708025861 * Math.log(g) - 161.1195681661;
        if (temp <= 19) { b = 0; }
        else { b = temp - 10; b = 138.5177312231 * Math.log(b) - 305.0447927307; }
    } else {
        r = temp - 60; r = 329.698727446 * Math.pow(r, -0.1332047592);
        g = temp - 60; g = 288.1221695283 * Math.pow(g, -0.0755148492);
        b = 255;
    }
    return { r: Math.max(0, Math.min(255, Math.floor(r))), g: Math.max(0, Math.min(255, Math.floor(g))), b: Math.max(0, Math.min(255, Math.floor(b))) };
}

export function drawSystem3D(ctx: CanvasRenderingContext2D, w: number, h: number, star: Star, system: SystemData, cam: CameraOrbit, bgStars: {x:number, y:number, size:number, alpha:number}[]) {
    const cx = w/2; const cy = h/2;

    ctx.fillStyle = "#050507"; ctx.fillRect(0,0,w,h);
    
    // BG Stars
    ctx.fillStyle = "#FFFFFF";
    bgStars.forEach(s => {
        const sx = cx + s.x; const sy = cy + s.y;
        if(sx > 0 && sx < w && sy > 0 && sy < h) {
            ctx.globalAlpha = s.alpha * 0.5; ctx.beginPath(); ctx.arc(sx, sy, s.size, 0, Math.PI*2); ctx.fill();
        }
    });
    ctx.globalAlpha = 1.0;

    const radX = cam.rotX * Math.PI / 180; 
    const radZ = cam.rotZ * Math.PI / 180;
    const cosX = Math.cos(radX), sinX = Math.sin(radX); 
    const cosZ = Math.cos(radZ), sinZ = Math.sin(radZ);

    function project(x: number, y: number, z: number) {
        let x1 = x * cosZ - y * sinZ; 
        let y1 = x * sinZ + y * cosZ; 
        let y2 = y1 * cosX - z * sinX;
        return { x: cx + x1 * cam.zoom, y: cy + y2 * cam.zoom };
    }

    // Habitable Zone
    const hzIn = 0.95 * Math.sqrt(star.luminosity); 
    const hzOut = 1.37 * Math.sqrt(star.luminosity);
    ctx.fillStyle = "rgba(40, 220, 100, 0.1)"; ctx.beginPath();
    for(let th=0; th<=Math.PI*2; th+=0.1) { const px=hzOut*Math.cos(th); const py=hzOut*Math.sin(th); const p=project(px,py,0); if(th===0)ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); }
    ctx.closePath();
    const startInner=project(hzIn,0,0); ctx.moveTo(startInner.x,startInner.y);
    for(let th=0; th<=Math.PI*2; th+=0.1) { const px=hzIn*Math.cos(th); const py=hzIn*Math.sin(th); const p=project(px,py,0); ctx.lineTo(p.x,p.y); }
    ctx.closePath(); ctx.fill('evenodd');

    system.planets.forEach(pl => {
        ctx.beginPath(); ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"; ctx.lineWidth = 1;
        const incRad=pl.i*Math.PI/180; const lanRad=pl.lan;
        
        // Draw Orbit Line
        for(let th=0; th<=Math.PI*2.05; th+=0.1) {
            let ox=pl.a*Math.cos(th); let oy=pl.a*Math.sin(th);
            let y_inc=oy*Math.cos(incRad); let z_inc=oy*Math.sin(incRad);
            let x_final=ox*Math.cos(lanRad)-y_inc*Math.sin(lanRad);
            let y_final=ox*Math.sin(lanRad)+y_inc*Math.cos(lanRad);
            const p=project(x_final, y_final, z_inc); if(th===0)ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y);
        }
        ctx.stroke();

        // Draw Planet
        let ox=pl.a*Math.cos(pl.anomaly); let oy=pl.a*Math.sin(pl.anomaly);
        let y_inc=oy*Math.cos(incRad); let z_inc=oy*Math.sin(incRad);
        let x_final=ox*Math.cos(lanRad)-y_inc*Math.sin(lanRad);
        let y_final=ox*Math.sin(lanRad)+y_inc*Math.cos(lanRad);
        const pos = project(x_final, y_final, z_inc);
        const size = Math.max(2, Math.log10(pl.mass * 10) * 1.5);

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI*2); ctx.clip();
        ctx.drawImage(pl.texture, -size, -size, size*2, size*2);
        
        // Fresnel / Rim Light (3D Effect)
        const rim = ctx.createRadialGradient(-size*0.3, -size*0.3, size*0.5, 0, 0, size);
        rim.addColorStop(0, "rgba(255,255,255,0.0)");
        rim.addColorStop(0.8, "rgba(0,0,0,0.1)");
        rim.addColorStop(1, "rgba(255,255,255,0.2)");
        ctx.fillStyle = rim; ctx.fillRect(-size, -size, size*2, size*2);

        // Inner Shadow
        const grad = ctx.createRadialGradient(-size*0.3, -size*0.3, size*0.2, 0, 0, size);
        grad.addColorStop(0, "transparent"); grad.addColorStop(1, "rgba(0,0,0,0.8)");
        ctx.fillStyle = grad; ctx.fillRect(-size, -size, size*2, size*2);
        ctx.restore();
    });

    // Star
    const sPos = project(0,0,0);
    const rgb = kelvinToRGB(star.temp);
    const glow = ctx.createRadialGradient(sPos.x, sPos.y, 5, sPos.x, sPos.y, 40);
    glow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`);
    glow.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(sPos.x, sPos.y, 40, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`; ctx.beginPath(); ctx.arc(sPos.x, sPos.y, 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#FFF"; ctx.beginPath(); ctx.arc(sPos.x, sPos.y, 5, 0, Math.PI*2); ctx.fill();
}

export function drawSystemScale(ctx: CanvasRenderingContext2D, w: number, h: number, star: Star, system: SystemData, cam: CameraScale) {
    ctx.fillStyle = "#050507"; ctx.fillRect(0,0,w,h);

    const cy = h/2;
    let maxR = 0; system.planets.forEach(p => maxR = Math.max(maxR, p.radiusKm));
    if(maxR === 0) maxR = 6371;
    const baseScale = (h * 0.4) / (maxR * 2);
    const currentScale = baseScale * cam.zoom;
    
    let cursorX = 20 + cam.panX;

    // Star Slice
    const starR_km = star.radius * 696340;
    const starR_px = starR_km * currentScale;
    const rgb = kelvinToRGB(star.temp);
    ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    ctx.beginPath(); ctx.arc(cursorX - starR_px + 20, cy, starR_px, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = "#AAA"; ctx.font = "16px Barlow"; ctx.textAlign = "left";
    ctx.fillText("STAR", 10, cy + h*0.45); ctx.fillText((star.radius.toFixed(2)) + " R☉", 10, cy + h*0.45 + 20);

    cursorX += 60 * cam.zoom;

    system.planets.forEach((pl, i) => {
        const rPx = pl.radiusKm * currentScale;
        cursorX += rPx + 10 * cam.zoom;
        if(i > 0) cursorX += 20 * cam.zoom;

        // Draw Planet Texture
        ctx.save();
        ctx.translate(cursorX, cy);
        
        // Render Texture
        ctx.beginPath(); ctx.arc(0, 0, rPx, 0, Math.PI*2); ctx.clip();
        ctx.drawImage(pl.texture, -rPx, -rPx, rPx*2, rPx*2);
        
        // Atmosphere Glow
        if(pl.pressure > 0.1) {
            const atmGrad = ctx.createRadialGradient(0,0,rPx*0.8, 0,0,rPx+4);
            atmGrad.addColorStop(0.8, "transparent");
            atmGrad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`);
            ctx.fillStyle = atmGrad;
            ctx.beginPath(); ctx.arc(0, 0, rPx+4, 0, Math.PI*2); ctx.fill();
        }

        // Fresnel / Rim (Scale View)
        const rim = ctx.createRadialGradient(-rPx*0.3, -rPx*0.3, rPx*0.5, 0, 0, rPx);
        rim.addColorStop(0, "rgba(255,255,255,0.0)");
        rim.addColorStop(0.8, "rgba(0,0,0,0.1)");
        rim.addColorStop(1, "rgba(255,255,255,0.3)"); 
        ctx.fillStyle = rim; ctx.fillRect(-rPx, -rPx, rPx*2, rPx*2);

        // Shadow shading
        const shadowGrad = ctx.createLinearGradient(-rPx, 0, rPx, 0);
        shadowGrad.addColorStop(0, "rgba(0,0,0,0)"); 
        shadowGrad.addColorStop(0.3, "rgba(0,0,0,0)");
        shadowGrad.addColorStop(1, "rgba(0,0,0,0.9)"); 
        
        ctx.fillStyle = shadowGrad;
        ctx.beginPath(); ctx.arc(0,0,rPx,0,Math.PI*2); ctx.fill();

        ctx.restore();

        // Labels
        ctx.fillStyle = "#BBB"; ctx.textAlign = "center"; ctx.font = "bold 16px Barlow";
        
        let label = "";
        if (i < 25) {
            label = String.fromCharCode(98 + i);
        } else {
            const sub = i - 25;
            label = "a" + String.fromCharCode(97 + sub%26); 
        }

        ctx.fillText(label, cursorX, cy + h*0.35);
        ctx.font = "14px Barlow"; ctx.fillStyle = "#888";
        ctx.fillText(Math.round(pl.radiusKm).toLocaleString() + " km", cursorX, cy + h*0.35 + 18);
        ctx.fillText(pl.radius.toFixed(2) + " R⊕", cursorX, cy + h*0.35 + 34);

        cursorX += rPx;
    });
}