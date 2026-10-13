import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(
  new URL('../components/solar-system/lib/orbitalMechanics.js', import.meta.url),
  'utf8'
);
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const orbital = await import(moduleUrl);

const {
  J2000_JULIAN_DATE,
  dateToJulianDate,
  createVisualOrbitPath,
  getAxialRotationAngle,
  getOrbitalSnapshot,
  setVisualPlanetPosition,
} = orbital;

const almostEqual = (actual, expected, tolerance, message) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected} ± ${tolerance}, received ${actual}`
  );
};

// Calendar/epoch regression: Unix epoch is exactly JD 2440587.5.
almostEqual(
  dateToJulianDate(new Date('1970-01-01T00:00:00.000Z')),
  2440587.5,
  1e-9,
  'Unix epoch Julian date'
);
almostEqual(
  dateToJulianDate(new Date('2000-01-01T12:00:00.000Z')),
  J2000_JULIAN_DATE,
  1e-9,
  'J2000 epoch Julian date'
);

// JPL element regression at J2000. These are the source table values used by
// the approximation model and guard against accidental coefficient drift.
const j2000Expectations = {
  Mercury: [0.38709843, 0.20563661, 7.00559432],
  Venus: [0.72332102, 0.00676399, 3.39777545],
  Earth: [1.00000018, 0.01673163, -0.00054346],
  Mars: [1.52371243, 0.09336511, 1.85181869],
  Jupiter: [5.20248019, 0.0485359, 1.29861416],
  Saturn: [9.54149883, 0.05550825, 2.49424102],
  Uranus: [19.18797948, 0.0468574, 0.77298127],
  Neptune: [30.06952752, 0.00895439, 1.7700552],
};

for (const [body, [semiMajorAxis, eccentricity, inclination]] of Object.entries(
  j2000Expectations
)) {
  const snapshot = getOrbitalSnapshot(body, J2000_JULIAN_DATE);
  assert.ok(snapshot, `${body} should have a J2000 orbital snapshot`);
  almostEqual(snapshot.semiMajorAxisAu, semiMajorAxis, 1e-8, `${body} semi-major axis`);
  almostEqual(snapshot.eccentricity, eccentricity, 1e-8, `${body} eccentricity`);
  almostEqual(snapshot.inclinationDegrees, inclination, 1e-7, `${body} inclination`);

  // The instantaneous heliocentric distance of an ellipse must remain within
  // perihelion/aphelion bounds a(1-e) ... a(1+e).
  const minimumDistance = semiMajorAxis * (1 - eccentricity) - 1e-8;
  const maximumDistance = semiMajorAxis * (1 + eccentricity) + 1e-8;
  assert.ok(
    snapshot.heliocentricDistanceAu >= minimumDistance &&
      snapshot.heliocentricDistanceAu <= maximumDistance,
    `${body} J2000 distance must stay inside its Keplerian ellipse`
  );

  const position = [0, 0, 0];
  setVisualPlanetPosition(body, J2000_JULIAN_DATE + 365.25, semiMajorAxis, position);
  assert.ok(position.every(Number.isFinite), `${body} position should remain finite`);

  const path = createVisualOrbitPath(body, semiMajorAxis, 96, J2000_JULIAN_DATE);
  assert.equal(path.length, (96 + 1) * 3, `${body} orbit path point count`);
  almostEqual(path[0], path[path.length - 3], 1e-5, `${body} orbit path closes on x`);
  almostEqual(path[1], path[path.length - 2], 1e-5, `${body} orbit path closes on y`);
  almostEqual(path[2], path[path.length - 1], 1e-5, `${body} orbit path closes on z`);
}

// Rotation direction regression. Venus and Uranus are represented with negative
// rotation periods, so they must rotate in the opposite direction to Earth.
const oneHourInDays = 1 / 24;
const earthRotation = getAxialRotationAngle(23.93, J2000_JULIAN_DATE + oneHourInDays);
const venusRotation = getAxialRotationAngle(-5832, J2000_JULIAN_DATE + oneHourInDays);
const uranusRotation = getAxialRotationAngle(-17.24, J2000_JULIAN_DATE + oneHourInDays);
assert.ok(earthRotation > 0, 'Earth rotation should advance prograde');
assert.ok(venusRotation < 0, 'Venus rotation should advance retrograde');
assert.ok(uranusRotation < 0, 'Uranus rotation should advance retrograde');

console.log('Orbital mechanics regression checks passed.');
