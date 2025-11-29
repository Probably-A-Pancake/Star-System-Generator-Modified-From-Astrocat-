export function randomUniform(min: number, max: number) { return Math.random() * (max - min) + min; }

export function randomBetaProxy(k: number) { return Math.pow(Math.random(), k); }

export function lerp(t: number, a: number, b: number) { return a + t * (b - a); }

// Inverse Error Function approximation for statistical distribution
export function erfinv(x: number) {
  const a = 0.147;
  const ln1minusx2 = Math.log(1 - x*x);
  const part1 = 2 / (Math.PI * a) + ln1minusx2 / 2;
  const part2 = ln1minusx2 / a;
  const sign = x < 0 ? -1 : 1;
  return sign * Math.sqrt(Math.sqrt(part1*part1 - part2) - part1);
}

// -- Simple Noise Implementation --
const perm = new Uint8Array(512);
const pPerm = new Uint8Array(256);
for(let i=0; i<256; i++) pPerm[i] = i;
for(let i=255; i>0; i--) { const r = Math.floor(Math.random()*(i+1)); [pPerm[i], pPerm[r]] = [pPerm[r], pPerm[i]]; }
for(let i=0; i<512; i++) perm[i] = pPerm[i & 255];

function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }

function grad(hash: number, x: number, y: number, z: number) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

export function noise(x: number, y: number, z: number) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x); const v = fade(y); const w = fade(z);
    const A = perm[X] + Y; const AA = perm[A] + Z; const AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y; const BA = perm[B] + Z; const BB = perm[B + 1] + Z;
    return lerp(w, lerp(v, lerp(u, grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z)),
                           lerp(u, grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z))),
                   lerp(v, lerp(u, grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1)),
                           lerp(u, grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1))));
}

export function fbm(x: number, y: number, z: number, octaves: number) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for(let i=0; i<octaves; i++) {
        total += noise(x * frequency, y * frequency, z * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
    }
    return total / maxValue;
}