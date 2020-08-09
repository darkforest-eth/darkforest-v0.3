import { Planet, EthAddress, LocationId } from '../_types/global/GlobalTypes';
import * as bigInt from 'big-integer';
import { PlanetColorInfo } from '../_types/darkforest/app/board/utils/UtilsTypes';
import {
  getPlanetRank,
  getPlanetClass,
  seededRandom,
  titleCase,
} from './Utils';
import _ from 'lodash';
import Noise from './Noise';
import {
  planetNameWords,
  planetTagAdj,
  planetTagNoun,
  blurb2grammar,
  blurbGrammar,
} from './ProcgenConsts';

import tracery from './tracery';
import { baseEngModifiers } from './tracery-modifiers';

export const hslStr: (h: number, s: number, l: number) => string = (
  h,
  s,
  l
) => {
  return `hsl(${h % 360},${s}%,${l}%)`;
};
function hashToHue(hash: string): number {
  let seed = bigInt(hash, 16).and(0xffffff).toString(16);
  seed = '0x' + '0'.repeat(6 - seed.length) + seed;

  const baseHue = parseInt(seed) % 360;
  return baseHue;
}

export const getPlayerColor: (player: EthAddress) => string = (player) => {
  return hslStr(hashToHue(player.slice(2)), 100, 70); // remove 0x
};

export const getOwnerColor: (planet: Planet) => string = (planet) => {
  return planet.owner ? getPlayerColor(planet.owner) : 'hsl(0,1%,50%)';
};

export type PixelCoords = {
  x: number;
  y: number;
};

type NoiseFn = (coords: PixelCoords) => number;
type NoiseClosure = (loc: LocationId) => NoiseFn;
// returns a deterministic seeded perlin for a given planet loc
export const planetPerlin: NoiseClosure = (loc: LocationId) => {
  const realHash = loc.substring(4, loc.length);

  const noise = Noise.getInstance();
  const offset = parseInt('0x' + realHash.substring(0, 10));
  const t = (num) => num / 100 + offset;

  return (coords: PixelCoords) => {
    const ret = noise.simplex2(t(coords.x), t(coords.y));
    return ret;
  };
};

type RandomFn = () => number;
type RandomClosure = (loc: LocationId) => RandomFn;
// returns a deterministic seeded random fn for a given planet loc
export const planetRandom: RandomClosure = (loc: LocationId) => {
  // shouldn't need to clone since loc is primitive but just to be safe
  const realHash = loc.substring(4, loc.length);

  let count = 0;
  const countOffset = parseInt('0x' + realHash.substring(0, 10));

  return () => {
    count++;
    const ret = seededRandom(count + countOffset);
    return ret;
  };
};

export const planetRandomInt: RandomClosure = (loc: LocationId) => {
  const rand = planetRandom(loc);
  return () => Math.floor(rand() * 2 ** 24);
};

const grayColors: PlanetColorInfo = {
  baseHue: 0,
  baseColor: '#888',
  baseColor2: '#888',
  baseColor3: '#888',
  secondaryColor: '#888',
  secondaryColor2: '#888',
  secondaryColor3: '#888',
  backgroundColor: '#888',
  previewColor: '#888',
};

export const getPlanetColors: (planet: Planet | null) => PlanetColorInfo = (
  planet
) => {
  if (!planet) return grayColors;
  const baseHue = hashToHue(planet.locationId);
  const baseColor = hslStr(baseHue % 360, 70, 60);

  const colors: PlanetColorInfo = {
    baseHue,
    baseColor,
    baseColor2: hslStr(baseHue % 360, 70, 70),
    baseColor3: hslStr(baseHue % 360, 70, 80),
    secondaryColor: hslStr(baseHue % 360, 60, 30),
    secondaryColor2: hslStr(baseHue % 360, 60, 40),
    secondaryColor3: hslStr(baseHue % 360, 60, 50),
    backgroundColor: hslStr((baseHue + 180) % 360, 70, 60),
    previewColor: baseColor,
  };

  return colors;
};

export const getPlanetTitle = (planet: Planet | null) => {
  if (!planet) return 'Unknown';
  const { upgradeState: u } = planet;

  const myRank = getPlanetRank(planet);
  const myClass = getPlanetClass(planet);

  let ret = 'Planet';

  if (myRank === 1) {
    ret = 'Settlement';
  } else if (myRank === 2) {
    ret = 'Colony';
  } else if (myRank === 3) {
    ret = ['Market', 'Barracks', 'Spaceport'][myClass];
  } else if (myRank === 4) {
    ret = ['DeFi Exchange', 'Stronghold', 'Warp Gate'][myClass];
  }
  // singles
  if (u[0] > 0 && u[1] === 0 && u[2] === 0) {
    ret = 'Economic ' + ret;
  } else if (u[0] === 0 && u[1] > 0 && u[2] === 0) {
    ret = 'Industrial ' + ret;
  } else if (u[0] === 0 && u[1] === 0 && u[2] > 0) {
    ret = 'Wayfaring ' + ret;
  }
  // doubles / triple
  else if (u[0] > 0 && u[1] > 0 && u[2] === 0) {
    ret = 'Mercantile ' + ret;
  } else if (u[0] > 0 && u[1] === 0 && u[2] > 0) {
    ret = 'Voyaging ' + ret;
  } else if (u[0] === 0 && u[1] > 0 && u[2] > 0) {
    ret = 'Enterprising ' + ret;
  } else if (u[0] > 0 && u[1] > 0 && u[2] > 0) {
    ret = 'Daring ' + ret;
  }

  return ret;
};

export const getPlanetName = (planet: Planet | null): string => {
  if (!planet) return 'Unknown Unknown';
  const randInt = planetRandomInt(planet.locationId);
  if (randInt() % 1024 === 0) return 'Clown Town';
  const word1 = planetNameWords[randInt() % planetNameWords.length];
  const word2 = planetNameWords[randInt() % planetNameWords.length];
  return titleCase(`${word1} ${word2}`);
};

export const getPlanetTagline = (planet: Planet | null): string => {
  if (!planet) return 'The empty unknown';

  if (getPlanetName(planet) === 'Clown Town') return `A town of clowns...`;

  const randInt = planetRandomInt(planet.locationId);
  const adj1 = planetTagAdj[randInt() % planetTagAdj.length];
  const adj2 = planetTagAdj[randInt() % planetTagAdj.length];
  const noun = planetTagNoun[randInt() % planetTagNoun.length];

  return `${adj1}, ${adj2} ${noun}`;
};

// this one doesn't mention the name
export const getPlanetBlurb = (planet: Planet | null): string => {
  if (!planet)
    return 'The vast, empty unknown of space contains worlds of infinite possibilities. Select a planet to learn more...';

  let append = '';
  if (getPlanetName(planet) === 'Clown Town') {
    append = `Founded in 1998 by Brian Gu, who remains the CEO of Clown Town to this day. `;
  }

  tracery.setRng(planetRandom(planet.locationId));
  const myGrammar = {
    // geography, atmosphere, fauna, flora, fun fact
    story: [
      `#geography.capitalize# #populates#. ` +
        `The #air# is #descair#. ` +
        `#myflora.capitalize# #bloom# #colors#. ` +
        `#many.capitalize# species of #species# #populate# the #habitat#. ` +
        `#funfact.capitalize#\.`,
    ],
    origin: ['#[myflora:#flora#]story#'],
  };
  const grammar = tracery.createGrammar({ ...blurbGrammar, ...myGrammar });

  grammar.addModifiers(baseEngModifiers);
  return append + grammar.flatten('#origin#');
};

// this one mentions the name
export const getPlanetBlurb2 = (planet: Planet | null): string => {
  if (!planet) return '';

  const name = getPlanetName(planet);
  const tagline = getPlanetTagline(planet);
  const myGrammar = {
    story: [
      `The people of ${name} have #learned# to #live# in a ${tagline}. ${name}'s #mysun# #sends# an #flock# of #bads# #sometimes#. Over the #years#, they've #removed# the #mysun# by #throwing# #warbears#. In doing so, they've learned that #lesson#\.`,
    ],
    origin: [`#[mysun:#sun#]story#`],
  };
  tracery.setRng(planetRandom(planet.locationId));
  const grammar = tracery.createGrammar({ ...blurb2grammar, ...myGrammar });

  grammar.addModifiers(baseEngModifiers);
  return grammar.flatten('#origin#');
};

export type QuoteData = {
  quote: string;
  author: string;
};

export const getPlanetQuote = (planet: Planet | null): QuoteData => {
  if (!planet)
    return {
      quote: "What can I say? I just don't know.",
      author: 'Everyone, probably',
    };

  const myRank = getPlanetRank(planet);
  const myClass = getPlanetClass(planet);

  if (myRank === 0) {
    return {
      quote:
        'Man cannot discover new oceans unless he has the courage to lose sight of the shore.',
      author: 'Andre Gide',
    };
  } else if (myRank === 1) {
    return {
      quote:
        'Equipped with his five senses, man explores the universe around him and calls the adventure Science.',
      author: 'Edwin Hubble',
    };
  } else if (myRank === 2) {
    return {
      quote:
        'Weakness and ignorance are not barriers to survival, but arrogance is.',
      author: 'Liu Cixin',
    };
  } else if (myRank === 3) {
    return [
      {
        quote:
          'Opportunity is missed by most people because it is dressed in overalls and looks like work.',
        author: 'Thomas Edison',
      },
      {
        quote:
          'People make mistakes in life through believing too much, but they have a damned dull time if they believe too little.',
        author: 'James Hilton',
      },
      {
        quote:
          "I'm sure the universe is full of intelligent life. It's just been too intelligent to come here.",
        author: 'Arthur C. Clarke',
      },
    ][myClass];
  } else if (myRank === 4) {
    return [
      { quote: 'Money often costs too much.', author: 'Ralph Waldo Emerson' },
      {
        quote: "I think there's just one kind of folks. Folks.",
        author: 'Harper Lee',
      },
      {
        quote: 'All civilizations become either spacefaring or extinct.',
        author: 'Carl Sagan',
      },
    ][myClass];
  }

  return {
    quote: '99% of quotes on the internet are made up on the spot.',
    author: 'Abraham Lincoln',
  };
};
