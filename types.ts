
export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Composition {
  fe: number;
  si: number;
  h2o: number;
  h: number;
}

export interface Planet {
  name: string;      // Name of the planet
  a: number;         // Semi-major axis (AU)
  e: number;         // Eccentricity
  i: number;         // Inclination (degrees)
  mass: number;      // Earth masses
  radius: number;    // Earth radii
  radiusKm: number;  // Radius in km
  density: number;   // g/cm3
  type: 'Gas Giant' | 'Ice Giant' | 'Mini-Neptune' | 'Terrestrial';
  comp: Composition;
  color: string;
  pressure: number;  // atm
  temp: number;      // Kelvin
  anomaly: number;   // Current orbital position (radians)
  lan: number;       // Longitude of ascending node (radians)
  texture: HTMLCanvasElement; // Generated texture
}

export interface Star {
  name: string;      // Catalog name
  mass: number;      // Solar masses
  radius: number;    // Solar radii
  luminosity: number;// Solar luminosity
  temp: number;      // Kelvin
  metallicity: number; // log(Fe/H)
  absMag: number;
  spectralClass: string;
}

export interface SystemData {
  planets: Planet[];
  frostLine: number;
}

export interface CameraOrbit {
  zoom: number;
  rotX: number;
  rotZ: number;
}

export interface CameraScale {
  zoom: number;
  panX: number;
}

export type ViewMode = 'orbit' | 'scale';
