// JPL-derived low-overhead orbital mechanics for the interactive scene.
//
// Coefficients come from JPL Solar System Dynamics' "Approximate Positions of
// the Planets" model (Table 2a/2b). The model is valid from 3000 BC to 3000 AD
// and is well suited to an interactive visualization. High-precision mission
// work should use JPL Horizons instead.

export const J2000_JULIAN_DATE = 2451545.0;
export const JULIAN_CENTURY_DAYS = 36525;
export const MS_PER_DAY = 86_400_000;

// Preserve the previous app's useful visual pacing while making every body's
// motion share one physical simulation clock. At 1x, an Earth year takes about
// 62.8 real seconds; relative orbital and rotational periods remain physical.
export const SIMULATION_DAYS_PER_SECOND = 365.25 / (Math.PI * 2 / 0.1);

const DEG_TO_RAD = Math.PI / 180;
const TWO_PI = Math.PI * 2;

// [a (AU), e, I (deg), L (deg), longitude of perihelion (deg),
//  longitude of ascending node (deg)]
const JPL_ELEMENTS = {
  Mercury: {
    base: [0.38709843, 0.20563661, 7.00559432, 252.25166724, 77.45771895, 48.33961819],
    rate: [0.0, 0.00002123, -0.00590158, 149472.67486623, 0.15940013, -0.12214182],
  },
  Venus: {
    base: [0.72332102, 0.00676399, 3.39777545, 181.9797085, 131.76755713, 76.67261496],
    rate: [-0.00000026, -0.00005107, 0.00043494, 58517.8156026, 0.05679648, -0.27274174],
  },
  Earth: {
    // JPL's table uses the Earth-Moon barycenter. At this scale that is the
    // scientifically appropriate approximation for the Earth's heliocentric orbit.
    base: [1.00000018, 0.01673163, -0.00054346, 100.46691572, 102.93005885, -5.11260389],
    rate: [-0.00000003, -0.00003661, -0.01337178, 35999.37306329, 0.3179526, -0.24123856],
  },
  Mars: {
    base: [1.52371243, 0.09336511, 1.85181869, -4.56813164, -23.91744784, 49.71320984],
    rate: [0.00000097, 0.00009149, -0.00724757, 19140.29934243, 0.45223625, -0.26852431],
  },
  Jupiter: {
    base: [5.20248019, 0.0485359, 1.29861416, 34.33479152, 14.27495244, 100.29282654],
    rate: [-0.00002864, 0.00018026, -0.00322699, 3034.90371757, 0.18199196, 0.13024619],
    correction: [-0.00012452, 0.0606406, -0.35635438, 38.35125],
  },
  Saturn: {
    base: [9.54149883, 0.05550825, 2.49424102, 50.07571329, 92.86136063, 113.63998702],
    rate: [-0.00003065, -0.00032044, 0.00451969, 1222.11494724, 0.54179478, -0.25015002],
    correction: [0.00025899, -0.13434469, 0.87320147, 38.35125],
  },
  Uranus: {
    base: [19.18797948, 0.0468574, 0.77298127, 314.20276625, 172.43404441, 73.96250215],
    rate: [-0.00020455, -0.0000155, -0.00180155, 428.49512595, 0.09266985, 0.05739699],
    correction: [0.00058331, -0.97731848, 0.17689245, 7.67025],
  },
  Neptune: {
    base: [30.06952752, 0.00895439, 1.7700552, 304.22289287, 46.68158724, 131.78635853],
    rate: [0.00006447, 0.00000818, 0.000224, 218.46515314, 0.01009938, -0.00606302],
    correction: [-0.00041348, 0.68346318, -0.10162547, 7.67025],
  },
};

const wrapRadians = (value) => {
  const wrapped = value % TWO_PI;
  return wrapped < -Math.PI
    ? wrapped + TWO_PI
    : wrapped > Math.PI
      ? wrapped - TWO_PI
      : wrapped;
};

const solveEccentricAnomaly = (meanAnomaly, eccentricity) => {
  let eccentricAnomaly = meanAnomaly + eccentricity * Math.sin(meanAnomaly);

  // Planetary eccentricities are modest, so Newton-Raphson converges quickly.
  for (let iteration = 0; iteration < 8; iteration += 1) {
    const residual = eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly;
    const derivative = 1 - eccentricity * Math.cos(eccentricAnomaly);
    const correction = residual / derivative;
    eccentricAnomaly -= correction;
    if (Math.abs(correction) < 1e-10) break;
  }

  return eccentricAnomaly;
};

export const dateToJulianDate = (date) => date.getTime() / MS_PER_DAY + 2440587.5;

const elementsAt = (bodyName, julianDate) => {
  const source = JPL_ELEMENTS[bodyName];
  if (!source) return null;

  const centuries = (julianDate - J2000_JULIAN_DATE) / JULIAN_CENTURY_DAYS;
  const values = source.base.map((baseValue, index) => baseValue + source.rate[index] * centuries);

  return {
    centuries,
    a: values[0],
    e: values[1],
    inclination: values[2] * DEG_TO_RAD,
    meanLongitude: values[3] * DEG_TO_RAD,
    longitudePerihelion: values[4] * DEG_TO_RAD,
    longitudeAscendingNode: values[5] * DEG_TO_RAD,
    correction: source.correction,
  };
};

const writeCoordinatesFromEccentricAnomaly = (elements, eccentricAnomaly, target, scale = 1) => {
  const xPrime = elements.a * (Math.cos(eccentricAnomaly) - elements.e);
  const yPrime =
    elements.a * Math.sqrt(1 - elements.e * elements.e) * Math.sin(eccentricAnomaly);

  const omega = elements.longitudePerihelion - elements.longitudeAscendingNode;
  const cosOmega = Math.cos(elements.longitudeAscendingNode);
  const sinOmega = Math.sin(elements.longitudeAscendingNode);
  const cosInclination = Math.cos(elements.inclination);
  const sinInclination = Math.sin(elements.inclination);
  const cosPerihelion = Math.cos(omega);
  const sinPerihelion = Math.sin(omega);

  const x =
    (cosPerihelion * cosOmega - sinPerihelion * sinOmega * cosInclination) * xPrime +
    (-sinPerihelion * cosOmega - cosPerihelion * sinOmega * cosInclination) * yPrime;
  const y =
    (cosPerihelion * sinOmega + sinPerihelion * cosOmega * cosInclination) * xPrime +
    (-sinPerihelion * sinOmega + cosPerihelion * cosOmega * cosInclination) * yPrime;
  const z = sinPerihelion * sinInclination * xPrime + cosPerihelion * sinInclination * yPrime;

  // JPL coordinates are ecliptic x/y with z normal to the ecliptic. Three.js
  // uses y as the scene's vertical axis, so map (x, y, z) -> (x, z, y).
  target[0] = x * scale;
  target[1] = z * scale;
  target[2] = y * scale;
  return target;
};

export const setVisualPlanetPosition = (bodyName, julianDate, visualSemiMajorAxis, target) => {
  const elements = elementsAt(bodyName, julianDate);
  if (!elements) {
    target[0] = visualSemiMajorAxis;
    target[1] = 0;
    target[2] = 0;
    return target;
  }

  let meanAnomaly = elements.meanLongitude - elements.longitudePerihelion;
  if (elements.correction) {
    const [b, c, s, f] = elements.correction;
    const phase = f * elements.centuries * DEG_TO_RAD;
    meanAnomaly += (b * elements.centuries * elements.centuries + c * Math.cos(phase) + s * Math.sin(phase)) * DEG_TO_RAD;
  }

  meanAnomaly = wrapRadians(meanAnomaly);
  const eccentricAnomaly = solveEccentricAnomaly(meanAnomaly, elements.e);
  const scale = visualSemiMajorAxis / elements.a;
  return writeCoordinatesFromEccentricAnomaly(elements, eccentricAnomaly, target, scale);
};

export const createVisualOrbitPath = (
  bodyName,
  visualSemiMajorAxis,
  segments = 128,
  julianDate = J2000_JULIAN_DATE
) => {
  const elements = elementsAt(bodyName, julianDate);
  if (!elements) return new Float32Array(0);

  const positions = new Float32Array((segments + 1) * 3);
  const point = [0, 0, 0];
  const scale = visualSemiMajorAxis / elements.a;

  for (let index = 0; index <= segments; index += 1) {
    const eccentricAnomaly = (index / segments) * TWO_PI;
    writeCoordinatesFromEccentricAnomaly(elements, eccentricAnomaly, point, scale);
    const offset = index * 3;
    positions[offset] = point[0];
    positions[offset + 1] = point[1];
    positions[offset + 2] = point[2];
  }

  return positions;
};

export const getAxialRotationAngle = (rotationPeriodHours, julianDate) => {
  if (!Number.isFinite(rotationPeriodHours) || rotationPeriodHours === 0) return 0;
  const rotations = ((julianDate - J2000_JULIAN_DATE) * 24) / rotationPeriodHours;
  return (rotations % 1) * TWO_PI;
};

export const getOrbitalSnapshot = (bodyName, julianDate) => {
  const elements = elementsAt(bodyName, julianDate);
  if (!elements) return null;

  const position = [0, 0, 0];
  setVisualPlanetPosition(bodyName, julianDate, elements.a, position);
  const distanceAu = Math.hypot(position[0], position[1], position[2]);

  return {
    semiMajorAxisAu: elements.a,
    eccentricity: elements.e,
    inclinationDegrees: elements.inclination / DEG_TO_RAD,
    heliocentricDistanceAu: distanceAu,
  };
};
