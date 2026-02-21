// NASA API Integration with caching
// Now using server-side API routes for better security
import { nasaLogger } from '../../../lib/logger';
import {
  APODResponse,
  NEOResponse,
  NASAImageResponse,
  EducationalContent
} from '../types';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface MoonDetailedInfo {
  discovered: string;
  diameter: string;
  mass: string;
  orbitalPeriod: string;
  description: string;
  composition: string;
  surfaceFeatures: string;
  notableFacts: string[];
  exploration: string[];
  images: string[];
  gallery?: Array<{
    url: string;
    title: string;
    caption: string;
    photographer: string;
  }>;
}

interface PlanetPosition {
  planetName: string;
  date: Date;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
}

class NASAAPIService {
  private cache: Map<string, CacheEntry<unknown>>;

  constructor() {
    this.cache = new Map();
  }

  private _getCacheKey(endpoint: string, params: Record<string, string | number | boolean | null> = {}): string {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  private _isCacheValid(cacheEntry?: CacheEntry<unknown>): boolean {
    if (!cacheEntry) return false;
    return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
  }

  private async _fetchWithCache<T>(url: string, cacheKey: string): Promise<T> {
    const cached = this.cache.get(cacheKey);
    if (cached && this._isCacheValid(cached)) {
      nasaLogger.debug(`Using cached data for ${cacheKey}`);
      return cached.data as T;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data as T;
    } catch (error) {
      nasaLogger.error('Fetch error:', error);
      // Return cached data even if expired, better than nothing
      if (cached) return cached.data as T;
      throw error;
    }
  }

  // Get Astronomy Picture of the Day for background inspiration
  async getAPOD(date: string | null = null): Promise<APODResponse> {
    const dateParam = date ? `?date=${date}` : '';
    const url = `/api/nasa/apod${dateParam}`;
    const cacheKey = this._getCacheKey('apod', { date });
    
    return this._fetchWithCache<APODResponse>(url, cacheKey);
  }

  // Get real-time solar system data from Horizons API (simplified)
  async getPlanetPosition(planetName: string, date: Date = new Date()): Promise<PlanetPosition> {
    // This is a placeholder - actual Horizons API requires complex queries
    // For production, consider using pre-calculated ephemeris data
    // const cacheKey = this._getCacheKey('planet_position', { planetName, date: date.toISOString().split('T')[0] });
    
    // Mock implementation - replace with actual Horizons API call in future
    nasaLogger.debug(`Planet position query for ${planetName} (placeholder implementation)`);
    return {
      planetName,
      date,
      position: { x: 0, y: 0, z: 0 }, // AU from Sun
      velocity: { x: 0, y: 0, z: 0 }
    };
  }

  // Get Mars rover photos (fun easter egg feature)
  async getMarsRoverPhoto(): Promise<null> {
    // TODO: Create /api/nasa/mars-rover route for server-side API calls
    // For now, return null to prevent undefined NASA_API_KEY error
    nasaLogger.warn('Mars rover photo feature temporarily disabled - awaiting server route implementation');
    return null;
  }

  // Get near-Earth objects (for asteroid belt realism)
  async getNearEarthObjects(startDate?: string, endDate?: string): Promise<NEOResponse> {
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || start;
    const url = `/api/nasa/neo?start_date=${start}&end_date=${end}`;
    const cacheKey = this._getCacheKey('neo', { start, end });
    
    try {
      return await this._fetchWithCache<NEOResponse>(url, cacheKey);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      nasaLogger.warn('NEO data unavailable:', message);
      return { element_count: 0, near_earth_objects: {} };
    }
  }

  // Get planet images from various NASA sources
  async getPlanetImage(planetName: string): Promise<NASAImageResponse | null> {
    const cacheKey = this._getCacheKey('planet_image', { planetName });
    
    // Use server-side API route for better security
    const url = `/api/nasa/planet/${encodeURIComponent(planetName)}`;
    
    try {
      return await this._fetchWithCache<NASAImageResponse>(url, cacheKey);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      nasaLogger.warn(`${planetName} image unavailable:`, message);
      return null;
    }
  }

  // Get educational content about a planet
  async getPlanetEducationalContent(planetName: string): Promise<EducationalContent | null> {
    // Use server-side API route for educational content
    const url = `/api/nasa/educational/${encodeURIComponent(planetName)}`;
    const cacheKey = this._getCacheKey('planet_educational', { planetName });
    
    try {
      return await this._fetchWithCache<EducationalContent>(url, cacheKey);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      nasaLogger.warn(`Educational content unavailable for ${planetName}:`, message);
      return null;
    }
  }

  // Get moon information
  async getMoonInfo(planetName: string, moonName: string): Promise<NASAImageResponse | null> {
    // Reuse getMoonImage which already uses server route
    return this.getMoonImage(moonName);
  }

  // Get detailed educational content about a specific moon
  async getMoonDetailedInfo(moonName: string): Promise<MoonDetailedInfo | null> {
    const cacheKey = this._getCacheKey('moon_detailed', { moonName });
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      nasaLogger.debug(`Using cached detailed info for ${moonName}`);
      return cached.data as MoonDetailedInfo;
    }

    // Comprehensive moon database
    const moonDatabase: Record<string, MoonDetailedInfo> = {
      // Earth's Moon
      'Moon': {
        discovered: 'Known since antiquity',
        diameter: '3,474 km',
        mass: '7.35 × 10²² kg',
        orbitalPeriod: '27.3 days',
        description: 'Earth\'s only natural satellite and the fifth largest moon in the Solar System. It stabilizes Earth\'s axial wobble and creates tides.',
        composition: 'Rocky body with iron-rich core',
        surfaceFeatures: 'Maria (dark basaltic plains), highlands (lighter cratered regions), impact craters',
        notableFacts: [
          'The only celestial body humans have visited',
          'Causes ocean tides on Earth',
          'Always shows the same face to Earth (tidally locked)',
          'Surface temperatures range from -173°C to 127°C'
        ],
        exploration: [
          'Apollo 11 first landing (1969)',
          'Six Apollo missions landed (1969-1972)',
          'Recent missions: Artemis program planning return'
        ],
        images: [
          'Full Moon view from Apollo',
          'Lunar surface panoramas',
          'Earth rise from Moon'
        ]
      },
      
      // Jupiter's Galilean Moons
      'Io': {
        discovered: 'Galileo Galilei (1610)',
        diameter: '3,643 km',
        mass: '8.93 × 10²² kg',
        orbitalPeriod: '1.77 days',
        description: 'The most volcanically active body in the Solar System, with over 400 active volcanoes.',
        composition: 'Rocky body with iron or iron sulfide core',
        surfaceFeatures: 'Active volcanoes, lava flows, sulfur compounds giving yellow-orange color',
        notableFacts: [
          'Over 400 active volcanoes',
          'Surface constantly renewed by volcanic activity',
          'Thin atmosphere of sulfur dioxide',
          'Tidal heating from Jupiter causes extreme volcanism'
        ],
        exploration: [
          'Discovered by Galileo (1610)',
          'Voyager missions revealed volcanism (1979)',
          'Galileo spacecraft detailed studies (1995-2003)',
          'Juno flybys (ongoing)'
        ],
        images: [
          'Volcanic plumes erupting',
          'Colorful sulfur surface',
          'Comparison with Earth\'s Moon'
        ]
      },
      
      'Europa': {
        discovered: 'Galileo Galilei (1610)',
        diameter: '3,122 km',
        mass: '4.80 × 10²² kg',
        orbitalPeriod: '3.55 days',
        description: 'An icy moon with a global subsurface ocean that may harbor conditions suitable for life.',
        composition: 'Ice shell over rocky mantle, possible subsurface ocean',
        surfaceFeatures: 'Smooth ice crust with cracks and ridges, very few impact craters',
        notableFacts: [
          'Subsurface ocean may contain twice as much water as Earth',
          'Potential for extraterrestrial life',
          'Surface constantly renewed by geological activity',
          'Youngest surface in the Solar System'
        ],
        exploration: [
          'Voyager flybys revealed smooth surface (1979)',
          'Galileo spacecraft found magnetic evidence of ocean (1995-2003)',
          'Europa Clipper mission launching 2024',
          'Future: Possible lander missions'
        ],
        images: [
          'Icy surface with linear features',
          'True color composite',
          'Chaos terrain regions'
        ]
      },
      
      'Ganymede': {
        discovered: 'Galileo Galilei (1610)',
        diameter: '5,268 km',
        mass: '1.48 × 10²³ kg',
        orbitalPeriod: '7.15 days',
        description: 'The largest moon in the Solar System, even bigger than Mercury, with its own magnetic field.',
        composition: 'Rock and water ice, possible subsurface ocean',
        surfaceFeatures: 'Mix of dark cratered terrain and lighter grooved terrain',
        notableFacts: [
          'Only moon with its own magnetic field',
          'Larger than Mercury',
          'May have a subsurface ocean',
          'Has a thin oxygen atmosphere'
        ],
        exploration: [
          'Voyager missions first detailed images (1979)',
          'Galileo found magnetic field evidence (1996)',
          'JUICE mission (ESA) will study closely (arriving 2031)',
          'Future: Potential for detailed ocean study'
        ],
        images: [
          'Full disk view showing terrain types',
          'Grooved terrain detail',
          'Size comparison with Earth\'s Moon'
        ]
      },
      
      'Callisto': {
        discovered: 'Galileo Galilei (1610)',
        diameter: '4,821 km',
        mass: '1.08 × 10²³ kg',
        orbitalPeriod: '16.69 days',
        description: 'The most heavily cratered object in the Solar System, with a very ancient surface.',
        composition: 'Roughly equal mix of rock and ice, possible subsurface ocean',
        surfaceFeatures: 'Heavily cratered, dark surface, multi-ring impact structures',
        notableFacts: [
          'Most heavily cratered moon in the Solar System',
          'Surface is over 4 billion years old',
          'May have a subsurface ocean',
          'Low radiation environment makes it attractive for future bases'
        ],
        exploration: [
          'Voyager missions revealed ancient surface (1979)',
          'Galileo spacecraft detailed mapping (1995-2003)',
          'Considered for future human base location',
          'JUICE mission will conduct flybys (2030s)'
        ],
        images: [
          'Full disk showing heavy cratering',
          'Valhalla multi-ring structure',
          'Ancient terrain detail'
        ]
      },
      
      // Saturn's Moons
      'Titan': {
        discovered: 'Christiaan Huygens (1655)',
        diameter: '5,150 km',
        mass: '1.35 × 10²³ kg',
        orbitalPeriod: '15.95 days',
        description: 'The only moon with a substantial atmosphere and liquid lakes on its surface (liquid methane and ethane).',
        composition: 'Rocky core, water ice mantle, thick nitrogen atmosphere',
        surfaceFeatures: 'Methane lakes and seas, sand dunes, ice mountains, river channels',
        notableFacts: [
          'Only moon with thick atmosphere (1.5x Earth\'s surface pressure)',
          'Has weather, clouds, and rain (methane)',
          'Surface liquid lakes and seas',
          'Possible prebiotic chemistry'
        ],
        exploration: [
          'Voyager missions first atmospheric data (1980-1981)',
          'Cassini-Huygens mission detailed study (2004-2017)',
          'Huygens probe landed on surface (2005)',
          'Dragonfly rotorcraft mission planned (launch 2028, arrival 2034)'
        ],
        images: [
          'Orange atmosphere from space',
          'Surface view from Huygens lander',
          'Radar maps of lakes and seas'
        ]
      },
      
      'Enceladus': {
        discovered: 'William Herschel (1789)',
        diameter: '504 km',
        mass: '1.08 × 10²⁰ kg',
        orbitalPeriod: '1.37 days',
        description: 'A small moon with active ice geysers erupting from its south pole, suggesting a subsurface ocean.',
        composition: 'Water ice surface, rocky core, subsurface ocean',
        surfaceFeatures: 'Smooth ice surface, "tiger stripe" fractures at south pole, active geysers',
        notableFacts: [
          'Ice geysers shoot water 500 km into space',
          'Subsurface ocean contains organic compounds',
          'One of the brightest objects in Solar System',
          'Strong candidate for extraterrestrial life'
        ],
        exploration: [
          'Voyager missions first images (1981)',
          'Cassini discovered geysers (2005)',
          'Cassini flew through geyser plumes (2008-2015)',
          'Future missions being considered'
        ],
        images: [
          'Ice geysers erupting from south pole',
          'Tiger stripe fractures',
          'Bright icy surface'
        ]
      },
      
      'Mimas': {
        discovered: 'William Herschel (1789)',
        diameter: '396 km',
        mass: '3.75 × 10¹⁹ kg',
        orbitalPeriod: '0.94 days',
        description: 'Known for its resemblance to the Death Star due to the massive Herschel crater.',
        composition: 'Water ice with small rocky core',
        surfaceFeatures: 'Heavily cratered, Herschel crater (130 km diameter)',
        notableFacts: [
          'Herschel crater is 1/3 the diameter of Mimas itself',
          'Impact that created Herschel nearly destroyed the moon',
          'Nicknamed the "Death Star moon"',
          'Shepherds Saturn\'s ring system'
        ],
        exploration: [
          'Voyager missions first detailed images (1980-1981)',
          'Cassini close flybys (2005-2017)'
        ],
        images: [
          'Herschel crater in detail',
          'Full disk "Death Star" view',
          'Cratered surface terrain'
        ]
      },
      
      'Rhea': {
        discovered: 'Giovanni Cassini (1672)',
        diameter: '1,527 km',
        mass: '2.31 × 10²¹ kg',
        orbitalPeriod: '4.52 days',
        description: 'Saturn\'s second-largest moon with a possible thin ring system of its own.',
        composition: 'Water ice and rock',
        surfaceFeatures: 'Heavily cratered, wispy terrain, possible ancient ring debris',
        notableFacts: [
          'May have its own tenuous ring system',
          'Heavily cratered ancient surface',
          'Thin oxygen and carbon dioxide atmosphere',
          'Named after a Titan from Greek mythology'
        ],
        exploration: [
          'Voyager missions first images (1980-1981)',
          'Cassini detailed mapping (2004-2017)',
          'Possible ring system detected (2008)'
        ],
        images: [
          'Wispy terrain features',
          'Heavily cratered highlands',
          'Full disk view'
        ]
      },

      // Additional moons (Uranus, Neptune, etc.)
      'Triton': {
        discovered: 'William Lassell (1846)',
        diameter: '2,706 km',
        mass: '2.14 × 10²² kg',
        orbitalPeriod: '5.88 days (retrograde)',
        description: 'Neptune\'s largest moon with a retrograde orbit, suggesting it was captured from the Kuiper Belt.',
        composition: 'Rocky core, water ice mantle, nitrogen ice surface',
        surfaceFeatures: 'Nitrogen geysers, cantaloupe terrain, few impact craters',
        notableFacts: [
          'Only large moon with retrograde orbit',
          'Coldest surface temperature measured: -235°C',
          'Active nitrogen geysers',
          'Likely a captured Kuiper Belt object'
        ],
        exploration: [
          'Voyager 2 only spacecraft to visit (1989)',
          'Future Neptune missions being considered'
        ],
        images: [
          'Cantaloupe terrain',
          'Nitrogen geyser deposits',
          'South polar cap'
        ]
      }
    };

    const moonData = moonDatabase[moonName];
    
    if (moonData) {
      // Fetch real images from NASA API
      try {
        const query = `${moonName} moon`;
        const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&year_start=2000`;
        const imageData = await this._fetchWithCache<NASAImageResponse>(url, `${cacheKey}_images`);
        const items = imageData?.collection?.items || [];
        
        // Extract multiple images for gallery
        const imageGallery = items.slice(0, 5).map(item => ({
          url: item.links?.[0]?.href,
          title: item.data?.[0]?.title,
          caption: item.data?.[0]?.description || '',
          photographer: item.data?.[0]?.photographer || 'NASA'
        })).filter(img => img.url);
        
        moonData.gallery = imageGallery;
      } catch {
        nasaLogger.warn(`Could not fetch gallery images for ${moonName}`);
        moonData.gallery = [];
      }
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: moonData,
        timestamp: Date.now()
      });
      
      return moonData;
    }
    
    return null;
  }

  // Get moon images from NASA sources
  async getMoonImage(moonName: string): Promise<NASAImageResponse | null> {
    const cacheKey = this._getCacheKey('moon_image', { moonName });
    
    // Use server-side API route for better security
    const url = `/api/nasa/moon/${encodeURIComponent(moonName)}`;
    
    try {
      return await this._fetchWithCache<NASAImageResponse>(url, cacheKey);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      nasaLogger.warn(`${moonName} image unavailable:`, message);
      return null;
    }
  }

  // Get educational content about a moon
  async getMoonEducationalContent(moonName: string): Promise<EducationalContent | null> {
    // Reuse the getMoonDetailedInfo which has comprehensive educational data
    const detailedInfo = await this.getMoonDetailedInfo(moonName);
    
    if (detailedInfo) {
      return {
        facts: detailedInfo.notableFacts || [],
        funFacts: detailedInfo.notableFacts || [],
        composition: detailedInfo.composition || '',
        atmosphere: '', // Moon atmosphere often negligible or not in detailedInfo
        geology: detailedInfo.surfaceFeatures || '',
        exploration: detailedInfo.exploration.join(', '),
      };
    }
    
    return null;
  }

  clearCache() {
    this.cache.clear();
  }
}

export const nasaAPI = new NASAAPIService();
