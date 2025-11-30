
import { Composition, Planet, Star, SystemData } from '../types';
import { randomUniform, randomBetaProxy, erfinv, fbm, lerp } from './math';
import { applySystemNaming, generateStarName } from './names';

function normalizeComp(c: Composition): Composition {
    const sum = c.fe + c.si + c.h2o + c.h;
    return { fe: c.fe/sum, si: c.si/sum, h2o: c.h2o/sum, h: c.h/sum };
}

function getSpectralClass(temp: number): string {
    if (temp >= 30000) return "O"; if (temp >= 10000) return "B"; if (temp >= 7500) return "A";
    if (temp >= 6000) return "F"; if (temp >= 5200) return "G"; if (temp >= 3700) return "K"; return "M";
}

function hslToRgb(h: number, s: number, l: number) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function generateTexture(planet: Omit<Planet, 'texture'>): HTMLCanvasElement {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const seed = Math.random() * 10000;

    // --- 1. GAS GIANTS / ICE GIANTS / MINI-NEPTUNES ---
    if (['Gas Giant', 'Ice Giant', 'Mini-Neptune'].includes(planet.type)) {
        const imgData = ctx.createImageData(size, size);
        const data = imgData.data;
        
        let hueBase = Math.random();
        let sat = randomUniform(0.3, 0.8);
        let light = randomUniform(0.4, 0.7);
        
        if (planet.type === 'Gas Giant') {
            if (planet.temp < 150) { 
                hueBase = randomUniform(0.08, 0.14); 
                sat = 0.4; light = 0.75;
            } else if (planet.temp > 1000) { 
                hueBase = Math.random() > 0.5 ? randomUniform(0.6, 0.75) : randomUniform(0.95, 1.05); 
                sat = 0.8; light = 0.4;
            } else {
                if (Math.random() > 0.5) hueBase = randomUniform(0.05, 0.15); 
            }
        } else if (planet.type === 'Ice Giant') {
            hueBase = randomUniform(0.45, 0.65); 
            sat = 0.6; light = 0.65;
        }

        const colBase = hslToRgb(hueBase, sat, light);
        const colDark = hslToRgb(hueBase, Math.min(1, sat + 0.2), Math.max(0, light - 0.2));
        const colLight = hslToRgb((hueBase + 0.05)%1, Math.max(0, sat - 0.1), Math.min(1, light + 0.2));
        const colAccent = hslToRgb((hueBase + 0.5)%1, sat, Math.max(0, light - 0.1)); 

        const bandScaleY = randomUniform(10, 40); 
        const turbulence = randomUniform(0.5, 3.0); 
        const detailScale = randomUniform(2, 6);
        const hasStorms = Math.random() > 0.7;
        const stormX = randomUniform(0.2, 0.8);
        const stormY = randomUniform(0.4, 0.6);

        for(let y=0; y<size; y++) {
            for(let x=0; x<size; x++) {
                const nx = x / size;
                const ny = y / size;
                
                const qx = fbm(nx + seed, ny + seed, 0, 2);
                const qy = fbm(nx + seed + 5.2, ny + seed + 1.3, 0, 2);
                
                let n = fbm(nx * detailScale + qx * turbulence, ny * bandScaleY + qy * turbulence, seed, 4);
                let bandPos = ny * bandScaleY + qx * 2.0;
                let bandMix = Math.sin(bandPos); 
                bandMix += n * 0.5;

                if (hasStorms) {
                    const dx = nx - stormX;
                    const dy = (ny - stormY) * 2.0; 
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < 0.15) {
                        const stormMix = fbm(nx*15, ny*15, seed+10, 3);
                        bandMix = lerp(1 - (dist/0.15), bandMix, stormMix + 0.5); 
                    }
                }

                let r, g, b;
                let val = (bandMix + 1.5) / 3.0; 
                val = Math.max(0, Math.min(1, val));

                if (val < 0.3) {
                    let t = val / 0.3;
                    r = lerp(t, colDark.r, colBase.r);
                    g = lerp(t, colDark.g, colBase.g);
                    b = lerp(t, colDark.b, colBase.b);
                } else if (val < 0.6) {
                    let t = (val - 0.3) / 0.3;
                    r = lerp(t, colBase.r, colLight.r);
                    g = lerp(t, colBase.g, colLight.g);
                    b = lerp(t, colBase.b, colLight.b);
                } else if (val < 0.8) {
                    let t = (val - 0.6) / 0.2;
                    r = lerp(t, colLight.r, colBase.r); 
                    g = lerp(t, colLight.g, colBase.g);
                    b = lerp(t, colLight.b, colBase.b);
                } else {
                    let t = (val - 0.8) / 0.2;
                    r = lerp(t, colBase.r, colAccent.r);
                    g = lerp(t, colBase.g, colAccent.g);
                    b = lerp(t, colBase.b, colAccent.b);
                }

                const idx = (y * size + x) * 4;
                data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }
    // --- 2. TERRESTRIAL ---
    else {
        const imgData = ctx.createImageData(size, size);
        const data = imgData.data;
        
        const canHaveLiquidWater = planet.temp >= 240 && planet.temp <= 373;
        const isOceanWorld = planet.comp.h2o > 0.01 && canHaveLiquidWater;
        const isLava = planet.temp > 1000;
        
        let seaLevel = planet.comp.h2o * 1000;
        if (isOceanWorld) seaLevel = 2.0;
        if (!canHaveLiquidWater) seaLevel = -1.0;
        
        const shiftR = (Math.random()-0.5)*40;
        const shiftG = (Math.random()-0.5)*40;
        const shiftB = (Math.random()-0.5)*40;

        let sand, rock, grass, forest, ocean, snow;

        if (planet.temp < 250) {
            sand = {r:200, g:200, b:220};
            rock = {r:80+shiftR, g:90+shiftG, b:100+shiftB};
            grass = {r:220, g:230, b:255};
            forest = {r:100, g:120, b:140};
            ocean = {r:10, g:20, b:50};
            snow = {r:245, g:250, b:255};
        } else if (planet.temp > 350) {
            if (Math.random()>0.5) {
                sand = {r:200+Math.abs(shiftR), g:120, b:80};
                rock = {r:100, g:60, b:50};
            } else {
                sand = {r:220, g:200+Math.abs(shiftG), b:140};
                rock = {r:120, g:110, b:90};
            }
            grass = sand; forest = rock;
            ocean = {r:10, g:40, b:90};
            snow = {r:255, g:255, b:255};
        } else {
            sand = {r:194+shiftR, g:178+shiftG, b:128+shiftB};
            rock = {r:100, g:90, b:80};
            grass = {r:50+shiftR*0.5, g:100+Math.abs(shiftG), b:40};
            forest = {r:20, g:60, b:20};
            ocean = {r:10, g:40, b:90};
            snow = {r:240, g:240, b:255};
        }
        const shallow = {r: ocean.r+20, g: ocean.g+40, b: ocean.b+30};
        const lavaDark = {r:40, g:10, b:10};
        const lavaBright = {r:255, g:100, b:0};

        const terrainScale = randomUniform(2.5, 6.0);
        const detailScale = randomUniform(8.0, 15.0);

        for(let y=0; y<size; y++) {
            for(let x=0; x<size; x++) {
                const nx = x / size;
                const ny = y / size;
                
                let h = fbm(nx * terrainScale, ny * terrainScale, seed, 6);
                let m = fbm(nx * detailScale + 10, ny * detailScale + 10, seed + 50, 4);
                
                let r,g,b;

                if (isLava) {
                    let crust = fbm(nx*6, ny*6, seed+10, 4);
                    if (crust < 0.45) {
                        let glow = crust / 0.45;
                        r = lerp(glow, lavaBright.r, 150);
                        g = lerp(glow, lavaBright.g, 20);
                        b = 0;
                    } else {
                        r = lavaDark.r; g = lavaDark.g; b = lavaDark.b;
                    }
                } else if (isOceanWorld) {
                    let d = fbm(nx*3, ny*3, seed, 3);
                    r = lerp(d, ocean.r, shallow.r);
                    g = lerp(d, ocean.g, shallow.g);
                    b = lerp(d, ocean.b, shallow.b);
                } else {
                    if (h < seaLevel) {
                        let depth = h / seaLevel;
                        r = lerp(depth, ocean.r, shallow.r);
                        g = lerp(depth, ocean.g, shallow.g);
                        b = lerp(depth, ocean.b, shallow.b);
                    } else {
                        let alt = (h - seaLevel) / (1 - seaLevel);
                        const canHaveLife = planet.temp >= 250 && planet.temp <= 330;
                        let c;
                        
                        let localSand = sand;
                        if(m > 0.6) {
                            localSand = {r: sand.r*0.9, g: sand.g*0.9, b: sand.b*0.9};
                        }

                        if (alt < 0.05) c = localSand;
                        else if (alt < 0.2) c = canHaveLife ? (m > 0.4 ? grass : localSand) : localSand;
                        else if (alt < 0.4) c = canHaveLife ? (m > 0.3 ? forest : rock) : rock;
                        else c = rock;
                        
                        let lat = Math.abs(ny - 0.5) * 2;
                        if (planet.temp < 320 && lat > 0.8 - alt*0.2) c = snow;
                        
                        r = c.r; g = c.g; b = c.b;
                        
                        let noiseVal = (Math.random()-0.5)*15;
                        r+=noiseVal; g+=noiseVal; b+=noiseVal;
                    }
                }
                const idx = (y * size + x) * 4;
                data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    if (planet.pressure > 0.5 && !['Gas Giant','Ice Giant'].includes(planet.type)) {
        const cCtx = document.createElement('canvas').getContext('2d')!;
        cCtx.canvas.width = size; cCtx.canvas.height = size;
        const imgData = cCtx.createImageData(size, size);
        const data = imgData.data;
        const cSeed = seed + 99;
        const cloudScale = randomUniform(2.5, 4.5);
        
        for(let y=0; y<size; y++) {
            for(let x=0; x<size; x++) {
                const nx = x/size; const ny = y/size;
                let n = fbm(nx*cloudScale, ny*cloudScale, cSeed, 4);
                let alpha = n > 0.55 ? (n-0.55)*200 : 0;
                if(planet.temp > 350) alpha *= 1.2;

                const idx = (y*size+x)*4;
                data[idx]=255; data[idx+1]=255; data[idx+2]=255; data[idx+3]=Math.min(255, alpha);
            }
        }
        cCtx.putImageData(imgData, 0, 0);
        ctx.drawImage(cCtx.canvas, 0, 0);
    }
    
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI*2); ctx.fill();
    return canvas;
}

export function generateStar(targetClass?: string): Star {
    let mass = 101;
    
    if (targetClass && targetClass !== 'Random') {
        switch(targetClass) {
            case 'O': mass = 16 + randomBetaProxy(6) * (60 - 16); break;
            case 'B': mass = randomUniform(2.1, 16); break;
            case 'A': mass = randomUniform(1.4, 2.1); break;
            case 'F': mass = randomUniform(1.04, 1.4); break;
            case 'G': mass = randomUniform(0.8, 1.04); break;
            case 'K': mass = randomUniform(0.45, 0.8); break;
            case 'M': mass = randomUniform(0.1, 0.45); break;
            default: mass = 1;
        }
    } else {
        while (mass >= 100) {
            const u = randomUniform(0, 1);
            const term = Math.sqrt(2) * erfinv(2 * u - 1);
            mass = Math.exp(-1.3 + 1.1 * term) + 0.08;
        }
    }

    let luminosity, radius;
    if (mass < 0.43) luminosity = 0.23 * Math.pow(mass, 2.3);
    else if (mass < 2) luminosity = Math.pow(mass, 4);
    else if (mass < 50) luminosity = 1.4 * Math.pow(mass, 3.5);
    else luminosity = 32000 * mass;

    if (mass < 1) radius = Math.pow(mass, 0.9);
    else radius = Math.pow(mass, 0.6);

    let z_feh = (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 0.4;
    let z_factor = Math.pow(10, z_feh);

    const r_adj = radius * Math.pow(z_factor, 0.15);
    const l_adj = luminosity * Math.pow(z_factor, -0.1);
    const temp = 5778 * Math.pow(l_adj / (r_adj * r_adj), 0.25);
    const absMag = 4.74 - 2.5 * Math.log10(l_adj);

    return { 
        mass, 
        radius: r_adj, 
        luminosity: l_adj, 
        temp, 
        metallicity: z_feh, 
        absMag, 
        spectralClass: getSpectralClass(temp),
        name: generateStarName() 
    };
}

function createPlanet(star: Star, orbit: {a:number, e:number, i:number}, frostLine: number, hzIn: number, hzOut: number, forcedType?: Planet['type']): Planet {
    const { a, e: ecc, i: inc } = orbit;
    const eqTemp = 278 * (Math.pow(star.luminosity, 0.25) / Math.sqrt(a));

    let type: Planet['type'] = "Terrestrial";
    
    if (forcedType) {
        type = forcedType;
    } else {
        const rand = Math.random();
        const inHabitableZone = a >= hzIn && a <= hzOut;
        
        if (inHabitableZone) {
            if (rand < 0.98) type = "Terrestrial"; 
            else if (rand < 0.99) type = "Mini-Neptune";
            else type = "Gas Giant"; 
        } else if (a > frostLine) {
            if (rand < 0.40) type = "Gas Giant";
            else if (rand < 0.75) type = "Ice Giant";
            else if (rand < 0.98) type = "Mini-Neptune";
            else type = "Terrestrial"; 
        } else {
            if (rand < 0.03) type = "Gas Giant";
            else if (rand < 0.08) type = "Ice Giant";
            else if (rand < 0.25) type = "Mini-Neptune";
            else type = "Terrestrial";
        }

        if (star.mass < 0.5 && type === "Gas Giant") {
            const downgrade = Math.random();
            if (downgrade < 0.5) type = "Mini-Neptune";
            else if (downgrade < 0.85) type = "Terrestrial";
        }
    }

    let mass;
    switch(type) {
        case "Gas Giant": mass = Math.exp(randomUniform(Math.log(50), Math.log(3000))); break;
        case "Ice Giant": mass = Math.exp(randomUniform(Math.log(10), Math.log(50))); break;
        case "Mini-Neptune": mass = Math.exp(randomUniform(Math.log(2), Math.log(15))); break;
        case "Terrestrial": default: mass = Math.exp(randomUniform(Math.log(0.05), Math.log(8))); break;
    }

    let rawComp = {fe:0, si:0, h2o:0, h:0};
    
    if (type === "Gas Giant") {
        rawComp.h = randomUniform(0.85, 0.98);
        rawComp.h2o = randomUniform(0.01, 0.10);
        rawComp.si = randomUniform(0.005, 0.03);
        rawComp.fe = randomUniform(0.005, 0.03);
    } else if (type === "Ice Giant") {
        rawComp.h = randomUniform(0.10, 0.25);
        rawComp.h2o = randomUniform(0.40, 0.70);
        rawComp.si = randomUniform(0.15, 0.35);
        rawComp.fe = randomUniform(0.05, 0.15);
    } else if (type === "Mini-Neptune") {
        rawComp.h = randomUniform(0.02, 0.15);
        rawComp.h2o = randomUniform(0.20, 0.50);
        rawComp.si = randomUniform(0.25, 0.55);
        rawComp.fe = randomUniform(0.10, 0.30);
    } else {
        rawComp.h = 0;
        if (eqTemp > 400) {
            rawComp.h2o = 0;
        } else {
            let logWater = randomUniform(-5, -3);
            rawComp.h2o = Math.pow(10, logWater);
            if ((a >= hzIn || a > frostLine * 0.7) && Math.random() > 0.85) {
                rawComp.h2o = randomUniform(0.05, 0.5);
            }
        }
        rawComp.si = randomUniform(0.45, 0.85);
        rawComp.fe = randomUniform(0.15, 0.45);
    }
    
    const comp = normalizeComp(rawComp);

    let pressure = 0;
    let surfaceTemp = eqTemp;

    if (type === "Gas Giant" || type === "Ice Giant" || type === "Mini-Neptune") {
        pressure = mass * 1000;
    } else {
        if (mass > 0.1) {
            if (Math.random() < Math.min(1, mass * 0.8)) {
                pressure = Math.pow(mass, 2) * randomUniform(0.1, 10.0);
            }
        }
    }

    if (pressure > 0.01 && pressure < 1000) {
            const logVal = Math.log10(pressure);
            let greenhouse = (157.5 * logVal + 35) * (1/255)*eqTemp;
            if(greenhouse < 0) greenhouse = 0;
            surfaceTemp = eqTemp + greenhouse;
    }

    if (type === "Terrestrial" && surfaceTemp > 450 && comp.h2o > 0) {
        comp.h2o = 0;
        let sum = comp.fe + comp.si + comp.h;
        if(sum > 0) { comp.fe /= sum; comp.si /= sum; comp.h /= sum; }
        else { comp.si = 0.7; comp.fe = 0.3; }
    }

    const M_earth_g = 5.972e27;
    const mass_g = mass * M_earth_g;
    const rho_Fe = 7.0; const rho_Si = 3.5; const rho_Water = 1.5;
    const logT = Math.log10(Math.max(1, surfaceTemp));
    const rho_H = Math.max(0.1, 1.5 - 0.3 * logT);

    const V_Fe = (mass_g * comp.fe) / rho_Fe;
    const V_Si = (mass_g * comp.si) / rho_Si;
    const V_Water = (mass_g * comp.h2o) / rho_Water;
    const V_H = (mass_g * comp.h) / rho_H;
    
    const V_total = V_Fe + V_Si + V_Water + V_H;
    const radius_cm = Math.pow( (3 * V_total) / (4 * Math.PI), 1/3 );
    const radius_km = radius_cm / 100000;
    const radius_earth = radius_km / 6371;
    const density = mass_g / V_total;

    let color = "#aaa";
    if (type === "Gas Giant") color = "#e0c0a0";
    else if (type === "Ice Giant") color = "#a0d0e0";
    else if (type === "Mini-Neptune") color = "#b0d0d0";
    else {
        color = "#a08c76";
        if (comp.h2o > 0.2) color = "#406080";
    }

    const pObj: Planet = {
        name: "", // Will be filled later
        a, e: ecc, i: inc, mass, radius: radius_earth, radiusKm: radius_km,
        density, type, comp, color, pressure, temp: surfaceTemp,
        anomaly: Math.random() * Math.PI * 2, lan: Math.random() * Math.PI * 2,
        texture: document.createElement('canvas')
    };
    
    pObj.texture = generateTexture(pObj);
    return pObj;
}

export function generatePlanets(star: Star, density: string = 'Medium'): SystemData {
    let targetCount = 0;
    
    // Density logic
    switch(density) {
        case 'None':
            targetCount = 0;
            break;
        case 'Low':
            // At most 5
            targetCount = Math.floor(randomUniform(1, 6)); 
            break;
        case 'Medium':
            // At most 12
            targetCount = Math.floor(randomUniform(4, 13)); 
            break;
        case 'High':
            // At most 30
            targetCount = Math.floor(randomUniform(12, 31)); 
            break;
        case 'Extreme':
            // Uncapped / High density
            targetCount = Math.floor(randomUniform(25, 55)); 
            break;
        default:
            targetCount = Math.floor(randomUniform(3, 15));
            break;
    }

    if (density !== 'None') {
        targetCount += Math.round(star.metallicity * 4);
        
        // Apply hard caps requested
        if (density === 'Low') targetCount = Math.min(targetCount, 5);
        if (density === 'Medium') targetCount = Math.min(targetCount, 12);
        if (density === 'High') targetCount = Math.min(targetCount, 30);
    }
    
    if (star.mass < 0.5 && density !== 'Extreme') {
        targetCount = Math.min(targetCount, 12); 
    }
    
    targetCount = Math.max(0, targetCount);

    if(targetCount === 0) return { planets: [], frostLine: 2.7 * Math.sqrt(star.luminosity) };

    const frostLine = 2.7 * Math.sqrt(star.luminosity);
    const hzIn = 0.75 * Math.sqrt(star.luminosity); 
    const hzOut = 1.5 * Math.sqrt(star.luminosity); 

    let rawOrbits: number[] = [];
    for(let i=0; i<targetCount * 5; i++) {
        const a = Math.exp(randomUniform(Math.log(0.05), Math.log(80))); 
        rawOrbits.push(a);
    }
    rawOrbits.sort((a,b) => a-b);

    const stableOrbits: number[] = [];
    const hotLimit = Math.pow(278 * Math.pow(star.luminosity, 0.25) / 373, 2);
    const maxHot = Math.floor(targetCount * 0.2);
    let currentHot = 0;

    for (let i = 0; i < rawOrbits.length; i++) {
        const candidate = rawOrbits[i];
        if (stableOrbits.length > 0) {
            if (candidate < stableOrbits[stableOrbits.length - 1] * 1.35) continue;
        }
        if (candidate < hotLimit) {
            if (currentHot >= maxHot) continue;
            currentHot++;
        }
        stableOrbits.push(candidate);
        if (stableOrbits.length >= targetCount) break;
    }

    const minOuter = targetCount > 10 ? 2 : 1;
    if (stableOrbits.length >= minOuter) {
        let count = 0;
        for (const orb of stableOrbits) if (orb >= hzIn) count++;
        
        if (count < minOuter) {
            const startIndex = stableOrbits.length - minOuter;
            if (stableOrbits[startIndex] < hzIn) {
                stableOrbits[startIndex] = hzIn * 1.05;
            }
            for (let k = startIndex + 1; k < stableOrbits.length; k++) {
                if (stableOrbits[k] < stableOrbits[k-1] * 1.35) {
                    stableOrbits[k] = stableOrbits[k-1] * 1.35;
                }
            }
        }
    }

    const orbitParams = stableOrbits.map(a => ({
       a,
       e: randomBetaProxy(4) * 0.5,
       i: randomBetaProxy(10) * 20
    }));

    let planets: Planet[] = orbitParams.map(orbit => createPlanet(star, orbit, frostLine, hzIn, hzOut));

    if (planets.length > 7) {
        let tCount = planets.filter(p => p.type === 'Terrestrial').length;
        const minTerrestrial = Math.ceil(planets.length * 0.3);
        
        if (tCount < minTerrestrial) {
            let toConvert = minTerrestrial - tCount;
            const candidates = planets.map((p, i) => ({p, i})).filter(x => x.p.type !== 'Terrestrial');
            for (let i = candidates.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
            }
            for (let k = 0; k < toConvert && k < candidates.length; k++) {
                const index = candidates[k].i;
                const orbit = { a: planets[index].a, e: planets[index].e, i: planets[index].i };
                planets[index] = createPlanet(star, orbit, frostLine, hzIn, hzOut, 'Terrestrial');
            }
        }
    }

    applySystemNaming(star, planets);

    return { planets, frostLine };
}
