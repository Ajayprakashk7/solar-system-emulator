// NASA API Integration with caching
// Now using server-side API routes for better security
import { nasaLogger } from '../../../lib/logger';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

class NASAAPIService {
  constructor() {
    this.cache = new Map();
  }

  _getCacheKey(endpoint, params = {}) {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  _isCacheValid(cacheEntry) {
    if (!cacheEntry) return false;
    return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
  }

  async _fetchWithCache(url, cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && this._isCacheValid(cached)) {
      nasaLogger.debug(`Using cached data for ${cacheKey}`);
      return cached.data;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      nasaLogger.error('Fetch error:', error);
      // Return cached data even if expired, better than nothing
      if (cached) return cached.data;
      throw error;
    }
  }

  // Get Astronomy Picture of the Day for background inspiration
  async getAPOD(date = null) {
    const dateParam = date ? `?date=${date}` : '';
    const url = `/api/nasa/apod${dateParam}`;
    const cacheKey = this._getCacheKey('apod', { date });
    
    return this._fetchWithCache(url, cacheKey);
  }

  // Get real-time solar system data from Horizons API (simplified)
  async getPlanetPosition(planetName, date = new Date()) {
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
  async getMarsRoverPhoto(rover = 'curiosity', sol = null) {
    const params = { rover };
    if (sol !== null) params.sol = sol;

    const queryParams = new URLSearchParams(params).toString();
    const url = `/api/nasa/mars-rover?${queryParams}`;
    const cacheKey = this._getCacheKey('mars_rover', params);

    try {
      return await this._fetchWithCache(url, cacheKey);
    } catch (err) {
      nasaLogger.warn('Mars rover photos unavailable:', err.message);
      return null;
    }
  }

  // Get near-Earth objects (for asteroid belt realism)
  async getNearEarthObjects(startDate, endDate) {
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || start;
    const url = `/api/nasa/neo?start_date=${start}&end_date=${end}`;
    const cacheKey = this._getCacheKey('neo', { start, end });
    
    try {
      return await this._fetchWithCache(url, cacheKey);
    } catch (err) {
      nasaLogger.warn('NEO data unavailable:', err.message);
      return { element_count: 0, near_earth_objects: {} };
    }
  }

  // Get planet images from various NASA sources
  async getPlanetImage(planetName) {
    const cacheKey = this._getCacheKey('planet_image', { planetName });
    
    // Use server-side API route for better security
    const url = `/api/nasa/planet/${encodeURIComponent(planetName)}`;
    
    try {
      const data = await this._fetchWithCache(url, cacheKey);
      return data;
    } catch (err) {
      nasaLogger.warn(`${planetName} image unavailable:`, err.message);
      return null;
    }
  }

  // Get educational content about a planet
  async getPlanetEducationalContent(planetName) {
    // Use server-side API route for educational content
    const url = `/api/nasa/educational/${encodeURIComponent(planetName)}`;
    const cacheKey = this._getCacheKey('planet_educational', { planetName });
    
    try {
      return await this._fetchWithCache(url, cacheKey);
    } catch (err) {
      nasaLogger.warn(`Educational content unavailable for ${planetName}:`, err.message);
      return null;
    }
  }

  // Get moon information
  async getMoonInfo(planetName, moonName) {
    // Reuse getMoonImage which already uses server route
    return this.getMoonImage(moonName);
  }

  // Get detailed educational content about a specific moon
  async getMoonDetailedInfo(moonName) {
    const cacheKey = this._getCacheKey('moon_detailed', { moonName });
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      nasaLogger.debug(`Using cached detailed info for ${moonName}`);
      return cached.data;
    }

    // Comprehensive moon database
    const moonDatabase = {
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
        const imageData = await this._fetchWithCache(url, `${cacheKey}_images`);
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
  async getMoonImage(moonName) {
    const cacheKey = this._getCacheKey('moon_image', { moonName });
    
    // Use server-side API route for better security
    const url = `/api/nasa/moon/${encodeURIComponent(moonName)}`;
    
    try {
      const data = await this._fetchWithCache(url, cacheKey);
      return data;
    } catch (err) {
      nasaLogger.warn(`${moonName} image unavailable:`, err.message);
      return null;
    }
  }

  // Get educational content about a moon
  async getMoonEducationalContent(moonName) {
    // Reuse the getMoonDetailedInfo which has comprehensive educational data
    const detailedInfo = await this.getMoonDetailedInfo(moonName);
    
    if (detailedInfo) {
      return {
        funFacts: detailedInfo.notableFacts || [],
        missions: detailedInfo.exploration || [],
        description: detailedInfo.description || '',
        composition: detailedInfo.composition || '',
        surfaceFeatures: detailedInfo.surfaceFeatures || ''
      };
    }
    
    return null;
  }

  clearCache() {
    this.cache.clear();
  }
}

export const nasaAPI = new NASAAPIService();
