import { Vector3, Mesh } from 'three';

/**
 * Display statistics for celestial bodies
 */
export interface DisplayStats {
  classification: string;
  orbitalPeriod: number;
  meanDistanceFromSun: number;
  accurateRadius: number;
  mass: number;
  surfaceGravity: number;
  rotationPeriod: number;
  axialTilt: number;
  numberOfMoons: number;
  atmosphericComposition: string;
  surfaceTemp: string;
  coreTemp?: string;
  age?: string;
  type?: string;
}

/**
 * Moon data structure
 */
export interface MoonData {
  name: string;
  radius?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  color?: string;
  surfaceDetail?: string;
  texture?: string;
}

/**
 * Ring system data
 */
export interface RingsData {
  texturePath: string;
  size: [number, number];
  innerRadius?: number;
  outerRadius?: number;
}

/**
 * Visual effects for celestial bodies
 */
export interface Effects {
  atmosphericGlow?: boolean;
  atmosphericScattering?: boolean;
  clouds?: boolean;
  aurora?: boolean;
  aurorae?: boolean;
  dustStorms?: boolean;
  polarCaps?: boolean;
  rings?: boolean;
}

/**
 * Planet data structure
 */
export interface PlanetData {
  id: number;
  name: string;
  texturePath: string;
  position: Vector3;
  radius: number;
  rotationSpeed: number;
  tilt: number;
  orbitSpeed: number;
  displayStats: DisplayStats;
  moons: MoonData[];
  wobble?: boolean;
  rings?: RingsData;
  isSun?: boolean;
  effects?: Effects;
  color?: string;
  emissive?: string;
}

/**
 * Moon selection with parent planet context
 */
export interface MoonSelection extends MoonData {
  isMoon: true;
  parentPlanet: string;
  parentPlanetData?: PlanetData;
  position?: { x: number; y: number; z: number };
}

/**
 * Union type for celestial body selection
 */
export type CelestialSelection = PlanetData | MoonSelection | null;

/**
 * Camera state machine
 */
export type CameraState = 
  | 'INTRO_ANIMATION' 
  | 'FREE' 
  | 'ZOOMING_IN' 
  | 'DETAIL_VIEW' 
  | 'MOVING_TO_HOME';

/**
 * Speed control context type
 */
export interface SpeedControlContextType {
  speedFactor: number;
  setSpeedFactor: (value: number) => void;
  overrideSpeedFactor: () => void;
  restoreSpeedFactor: () => void;
}

/**
 * Camera context type
 */
export interface CameraContextType {
  cameraState: CameraState;
  setCameraState: (state: CameraState) => void;
}

/**
 * Planet positions context type
 */
export interface PlanetPositionsContextType {
  planetPositions: Record<string, [number, number, number]>;
  setPlanetPosition: (name: string, position: [number, number, number]) => void;
}

/**
 * Selected planet context type
 */
export interface SelectedPlanetContextType {
  selectedPlanet: CelestialSelection;
  setSelectedPlanet: (planet: CelestialSelection) => void;
}

/**
 * Component props types
 */
export interface PlanetProps {
  id: number;
  name: string;
  texturePath: string;
  position: Vector3;
  radius: number;
  orbitSpeed: number; // Changed from orbitProgress
  tilt: number;
  rotationSpeed: number;
  rings?: RingsData;
  moons: MoonData[];
  effects?: Effects;
  wobble?: boolean;
}

export interface MoonProps {
  name: string;
  parentPlanet: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  texture?: string;
  color?: string;
}

export interface SunProps {
  position: Vector3;
  radius: number;
}

export interface RingsProps {
  texturePath: string;
  innerRadius: number;
  outerRadius: number;
}

/**
 * NASA API response types
 */
export interface NASAImageItem {
  data: Array<{
    title: string;
    description?: string;
    date_created?: string;
    photographer?: string;
    secondary_creator?: string;
  }>;
  links: Array<{
    href: string;
  }>;
}

export interface NASAImageResponse {
  collection: {
    items: NASAImageItem[];
  };
}

export interface APODResponse {
  date: string;
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: 'image' | 'video';
  copyright?: string;
}

export interface NEOResponse {
  element_count: number;
  near_earth_objects: Record<string, Array<{
    id: string;
    name: string;
    absolute_magnitude_h: number;
    estimated_diameter: {
      kilometers: {
        estimated_diameter_min: number;
        estimated_diameter_max: number;
      };
    };
    is_potentially_hazardous_asteroid: boolean;
    close_approach_data: Array<{
      close_approach_date: string;
      relative_velocity: {
        kilometers_per_hour: string;
      };
      miss_distance: {
        kilometers: string;
      };
    }>;
  }>>;
}

/**
 * Texture loading types
 */
export interface TextureLoadOptions {
  quality?: 'low' | 'medium' | 'high';
  onProgress?: (loaded: number, total: number) => void;
}

/**
 * Performance optimizer types
 */
export interface PerformanceMetrics {
  fps: number;
  drawCalls: number;
  triangles: number;
  points: number;
  lines: number;
  memory: {
    geometries: number;
    textures: number;
  };
}

export interface OptimizationSettings {
  maxDrawCalls: number;
  targetFPS: number;
  autoLOD: boolean;
  frustumCulling: boolean;
}

/**
 * Educational content types
 */
export interface EducationalContent {
  facts: string[];
  funFacts?: string[];
  composition?: string;
  atmosphere?: string;
  geology?: string;
  exploration?: string;
  moons?: string;
}

/**
 * Component ref types for Three.js objects
 */
export interface PlanetMeshRef {
  mesh: Mesh | null;
  atmosphere: Mesh | null;
}

export interface MoonMeshRef {
  mesh: Mesh | null;
}

/**
 * Animation and motion types
 */
export interface OrbitConfig {
  radius: number;
  speed: number;
  tilt: number;
  eccentricity?: number;
}

export interface RotationConfig {
  speed: number;
  axis?: Vector3;
}

/**
 * UI component props
 */
export interface PlanetMenuProps {
  planets: PlanetData[];
  onPlanetSelect: (planet: PlanetData) => void;
}

export interface PlanetDetailProps {
  planet: CelestialSelection;
  onClose: () => void;
}

export interface SpeedControlProps {
  value: number;
  onChange: (value: number) => void;
}

export interface ControlMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * Error types
 */
export interface APIError {
  code: string;
  message: string;
  userMessage?: string;
  statusCode?: number;
}

/**
 * Device capabilities for performance optimization
 */
export interface DeviceCapabilities {
  isMobile: boolean;
  isLowEnd: boolean;
  devicePixelRatio: number;
  hardwareConcurrency: number;
  supportsWebGL2: boolean;
}
