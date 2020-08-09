import _ from 'lodash';
import { mimcWithRounds } from './mimc';
import Fraction from '../utils/fractions/bigFraction.js';
import BigInt from 'big-integer';
import { BigInteger } from 'big-integer';

const TRACK_LCM = false;

interface IntegerVector {
  x: number;
  y: number;
}

interface Vector {
  x: Fraction;
  y: Fraction;
}

interface GradientAtPoint {
  coords: Vector;
  gradient: Vector;
}

const random: (...args: number[]) => number = (...args) => {
  return mimcWithRounds(4)(...args)
    .remainder(16)
    .toJSNumber();
};

/*
const generateVecs = () => {
  const vecs = 16;
  const precision = 3;
  const out = _.range(0, vecs)
    .map((x) => (x * Math.PI * 2) / vecs)
    .map((x) => [
      Math.floor(Math.cos(x) * 10 ** precision),
      Math.floor(Math.sin(x) * 10 ** precision),
    ]);

  return out.map(([x, y]) => ({
    x: new Fraction(x, 10 ** precision),
    y: new Fraction(y, 10 ** precision),
  }));
};

const vecs = generateVecs();
*/
let vecs;
try {
  vecs = [
    [1000, 0],
    [923, 382],
    [707, 707],
    [382, 923],
    [0, 1000],
    [-383, 923],
    [-708, 707],
    [-924, 382],
    [-1000, 0],
    [-924, -383],
    [-708, -708],
    [-383, -924],
    [-1, -1000],
    [382, -924],
    [707, -708],
    [923, -383],
  ].map(([x, y]) => ({ x: new Fraction(x, 1000), y: new Fraction(y, 1000) }));
} catch (err) {
  console.error('Browser does not support BigInt.');
}

const getRandomGradientAt: (point: Vector, scale: Fraction) => Vector = (
  point,
  scale
) => {
  const val =
    vecs[random(point.x.valueOf(), point.y.valueOf(), scale.valueOf())];
  return val;
};

const minus: (a: Vector, b: Vector) => Vector = (a, b) => {
  return {
    x: a.x.sub(b.x),
    y: a.y.sub(b.y),
  };
};

const dot: (a: Vector, b: Vector) => Fraction = (a, b) => {
  return a.x.mul(b.x).add(a.y.mul(b.y));
};

const smoothStep: (x: Fraction) => Fraction = (x) => {
  // return 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
  return x;
};

const scalarMultiply: (s: Fraction, v: Vector) => Vector = (s, v) => ({
  x: v.x.mul(s),
  y: v.y.mul(s),
});

const getWeight: (corner: Vector, p: Vector) => Fraction = (corner, p) => {
  return smoothStep(new Fraction(1).sub(p.x.sub(corner.x).abs())).mul(
    smoothStep(new Fraction(1).sub(p.y.sub(corner.y).abs()))
  );
};

// p is in a scale x scale square. we scale down to a 1x1 square
const perlinValue: (
  corners: [GradientAtPoint, GradientAtPoint, GradientAtPoint, GradientAtPoint],
  scale: Fraction,
  p: Vector
) => Fraction = (corners, scale, p) => {
  let ret = new Fraction(0);
  for (const corner of corners) {
    const distVec = minus(p, corner.coords);
    ret = ret.add(
      getWeight(
        scalarMultiply(scale.inverse(), corner.coords),
        scalarMultiply(scale.inverse(), p)
      ).mul(dot(scalarMultiply(scale.inverse(), distVec), corner.gradient))
    );
  }
  return ret;
};

let runningLCM = BigInt(1);

const updateLCM = (oldLCM: BigInteger, newValue: BigInteger): BigInteger => {
  if (!TRACK_LCM) {
    return oldLCM;
  }

  const newLCM = BigInt.lcm(oldLCM, newValue);
  if (newLCM !== oldLCM) {
    console.log('LCM updated to ', newLCM);
  }

  return newLCM;
};

// fractional mod
const realMod = (dividend: Fraction, divisor: Fraction): Fraction => {
  const temp = dividend.mod(divisor);
  // temp.s is sign
  if (temp.s.toString() === '-1') {
    return temp.add(divisor);
  }
  return temp;
};

const valueAt = (p: Vector, scale: Fraction) => {
  const bottomLeftCoords = {
    x: p.x.sub(realMod(p.x, scale)),
    y: p.y.sub(realMod(p.y, scale)),
  };
  const bottomRightCoords = {
    x: bottomLeftCoords.x.add(scale),
    y: bottomLeftCoords.y,
  };
  const topLeftCoords = {
    x: bottomLeftCoords.x,
    y: bottomLeftCoords.y.add(scale),
  };
  const topRightCoords = {
    x: bottomLeftCoords.x.add(scale),
    y: bottomLeftCoords.y.add(scale),
  };

  const bottomLeftGrad = {
    coords: bottomLeftCoords,
    gradient: getRandomGradientAt(bottomLeftCoords, scale),
  };
  const bottomRightGrad = {
    coords: bottomRightCoords,
    gradient: getRandomGradientAt(bottomRightCoords, scale),
  };
  const topLeftGrad = {
    coords: topLeftCoords,
    gradient: getRandomGradientAt(topLeftCoords, scale),
  };
  const topRightGrad = {
    coords: topRightCoords,
    gradient: getRandomGradientAt(topRightCoords, scale),
  };

  const out = perlinValue(
    [bottomLeftGrad, bottomRightGrad, topLeftGrad, topRightGrad],
    scale,
    p
  );

  return out;
};

const MAX_PERLIN_VALUE = 32;

const perlin: (p: IntegerVector) => number = (p) => {
  return 16;

  const fractionalP = { x: new Fraction(p.x), y: new Fraction(p.y) };
  let ret = new Fraction(0);
  for (let i = 11; i < 14; i += 1) {
    // we want 2048, 4096, 8192.
    ret = ret.add(valueAt(fractionalP, new Fraction(2 ** i)));
  }

  ret = ret.div(3);
  runningLCM = updateLCM(runningLCM, BigInt(ret.d));

  ret = ret.mul(MAX_PERLIN_VALUE / 2);
  ret = ret.floor();
  ret = ret.add(MAX_PERLIN_VALUE / 2);

  const out = ret.valueOf();
  return out;
};

export default perlin;
