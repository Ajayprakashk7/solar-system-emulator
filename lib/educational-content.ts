/**
 * Educational content for celestial bodies
 * Extracted from NASA API service for better organization
 */

export interface EducationalData {
  funFacts: string[];
  missions: string[];
  nextEvents?: string;
  atmosphere?: string;
}

export const EDUCATIONAL_CONTENT: Record<string, EducationalData> = {
  Sun: {
    funFacts: [
      "The Sun is a G-type main-sequence star (yellow dwarf)",
      "Contains 99.86% of the Solar System's total mass",
      "Surface temperature is about 5,778 K (5,505°C)",
      "Core temperature reaches 15 million degrees Celsius",
      "Has been shining for about 4.6 billion years",
      "Will continue to shine for another 5 billion years"
    ],
    missions: ["Parker Solar Probe", "Solar Orbiter (ESA/NASA)", "SOHO", "SDO (Solar Dynamics Observatory)"],
    nextEvents: "Parker Solar Probe continues record-breaking close approaches to the Sun",
    atmosphere: "Primarily composed of Hydrogen (~73%) and Helium (~25%) in a plasma state."
  },
  Earth: {
    funFacts: [
      "The only known planet with life",
      "71% of the surface is covered by water",
      "Has one natural satellite (the Moon)",
      "Orbital speed: 107,000 km/h (66,600 mph)"
    ],
    missions: ["ISS", "Landsat", "Terra", "Aqua"],
    nextEvents: "Continuous Earth observation missions",
    atmosphere: "Nitrogen (78%) and Oxygen (21%), protecting life from harmful solar radiation."
  },
  Mars: {
    funFacts: [
      "Called the Red Planet due to iron oxide on its surface",
      "Has the largest volcano in the solar system (Olympus Mons)",
      "A day on Mars is 24.6 hours",
      "Has two small moons: Phobos and Deimos"
    ],
    missions: ["Perseverance", "Curiosity", "InSight", "MAVEN"],
    nextEvents: "Mars Sample Return mission planned for 2030s",
    atmosphere: "Very thin, consisting mostly of Carbon Dioxide (95%), Argon (2%), and Nitrogen (2%)."
  },
  Jupiter: {
    funFacts: [
      "Largest planet in our solar system",
      "Has 95+ known moons",
      "The Great Red Spot is a storm larger than Earth",
      "A day on Jupiter is only 10 hours"
    ],
    missions: ["Juno", "Galileo (ended)", "Pioneer (ended)"],
    nextEvents: "Europa Clipper mission launching 2024",
    atmosphere: "Thick atmosphere composed mostly of Hydrogen (90%) and Helium (10%)."
  },
  Saturn: {
    funFacts: [
      "Has spectacular ring system visible from Earth",
      "Has 146+ known moons",
      "Could float in water (if there was a bathtub big enough)",
      "Winds can reach 1,800 km/h"
    ],
    missions: ["Cassini-Huygens (ended)"],
    nextEvents: "Dragonfly mission to Titan planned for 2027",
    atmosphere: "Made mostly of Hydrogen (96%) and Helium (3%), with traces of methane and ammonia."
  },
  Venus: {
    funFacts: [
      "Hottest planet despite Mercury being closer to Sun",
      "Rotates backwards (retrograde rotation)",
      "A day is longer than a year",
      "Surface pressure is 90x Earth's"
    ],
    missions: ["Magellan (ended)", "Akatsuki (JAXA)"],
    nextEvents: "DAVINCI and VERITAS missions planned",
    atmosphere: "Extremely dense, mostly Carbon Dioxide (96.5%) with thick clouds of sulfuric acid."
  },
  Mercury: {
    funFacts: [
      "Smallest planet in our solar system",
      "Closest planet to the Sun",
      "Temperature varies from -173°C to 427°C",
      "Has almost no atmosphere"
    ],
    missions: ["MESSENGER (ended)", "BepiColombo (ESA/JAXA)"],
    nextEvents: "BepiColombo arrival in 2025",
    atmosphere: "Has an extremely thin exosphere consisting of atoms blasted off the surface by the solar wind."
  },
  Uranus: {
    funFacts: [
      "Rotates on its side (97.8° tilt)",
      "Has faint ring system",
      "Coldest planetary atmosphere (-224°C)",
      "Has 28+ known moons"
    ],
    missions: ["Voyager 2 (1986 flyby)"],
    nextEvents: "Uranus Orbiter and Probe being considered",
    atmosphere: "Primarily Hydrogen (83%) and Helium (15%), with traces of methane giving it a blue color."
  },
  Neptune: {
    funFacts: [
      "Windiest planet in the solar system",
      "Discovered by mathematical prediction",
      "Has 14+ known moons",
      "Triton orbits backwards (retrograde)"
    ],
    missions: ["Voyager 2 (1989 flyby)"],
    nextEvents: "Neptune mission being studied by NASA",
    atmosphere: "Composed mostly of Hydrogen (80%) and Helium (19%), with some methane."
  }
};
