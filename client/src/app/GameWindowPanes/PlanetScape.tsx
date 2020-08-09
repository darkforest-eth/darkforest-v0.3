import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import dfstyles from '../../styles/dfstyles';
import { Planet, StatIdx } from '../../_types/global/GlobalTypes';
import {
  getPlanetColors,
  PixelCoords,
  planetPerlin,
  planetRandom,
} from '../../utils/ProcgenUtils';
import { PlanetColorInfo } from '../../_types/darkforest/app/board/utils/UtilsTypes';
import _ from 'lodash';
import { bonusFromHex } from '../../utils/Utils';

const PlanetScapeContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  & canvas {
    outline-offset: -1px;
    outline: 1px solid ${dfstyles.colors.text};
  }
`;

function makeMoonRenderer(
  myPlanet: Planet | null,
  myCanvas: HTMLCanvasElement
): () => void {
  const canvas: HTMLCanvasElement = myCanvas;
  const _ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
  if (!_ctx) {
    console.error('makeRenderer dun goofed');
    return () => {};
  }
  const ctx = _ctx as CanvasRenderingContext2D;

  if (!myPlanet) {
    return () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }

  const planet: Planet = myPlanet;
  const colors = getPlanetColors(planet);
  const bonuses = bonusFromHex(planet.locationId);

  return () => {
    const rand = planetRandom(planet.locationId);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = colors.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'color-burn';
    const darkness = Math.max(
      0,
      0.35 + 0.4 * Math.sin(Date.now() / 15000 + rand() * 10000)
    );
    ctx.globalAlpha = darkness;
    ctx.fillStyle = '#020208';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    ctx.fillStyle = 'white';
    for (let i = 0; i < 20; i++) {
      const center = { x: (rand() * 10000) % 500, y: (rand() * 10000) % 200 };
      if (rand() < 0.5) {
        const starSize = 1 + rand() * 3;
        ctx.fillRect(center.x - starSize, center.y, 2 * starSize + 1, 1);
        ctx.fillRect(center.x, center.y - starSize, 1, 2 * starSize + 1);
      } else {
        ctx.fillRect(center.x, center.y, 1, 1);
      }
    }

    const dir = rand() < 0.5 ? -1 : 1;
    for (let i = 0; i < bonuses.length; i++) {
      const bar = 10000;
      const mult = (0.5 + rand() * 2) * 0.1;
      let posX = ((Date.now() * mult + rand() * bar) % bar) / bar;
      if (dir === -1) posX = 1 - posX;

      const radius = 15 + rand() * 20;
      const moonX = (-0.5 + 2 * posX) * canvas.width;
      const moonY = (0.1 + rand() * 0.2) * canvas.height;

      if (bonuses[i]) {
        let color;
        const {
          popCap,
          popGro,
          silCap,
          silGro,
          range,
        } = dfstyles.game.bonuscolors;
        if (i === StatIdx.PopCap) color = popCap;
        else if (i === StatIdx.PopGro) color = popGro;
        else if (i === StatIdx.ResCap) color = silCap;
        else if (i === StatIdx.ResGro) color = silGro;
        else color = range;

        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(moonX, moonY, radius + 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(moonX, moonY, radius, 0, 2 * Math.PI);

        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.fillStyle = color;
        ctx.fill();
      }
    }
  };
}

const TICK_SIZE = 2;
function makeScapeRenderer(
  myPlanet: Planet | null,
  myCanvas: HTMLCanvasElement
): () => void {
  const canvas: HTMLCanvasElement = myCanvas;
  const _ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
  if (!_ctx) {
    console.error('makeRenderer dun goofed');
    return () => {};
  }
  const ctx = _ctx as CanvasRenderingContext2D;

  if (!myPlanet)
    return () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

  const planet: Planet = myPlanet;
  const colors: PlanetColorInfo = getPlanetColors(planet);

  const perlin: (x: PixelCoords) => number = planetPerlin(planet.locationId);
  // const rand: (x: number) => number = planetRandom(planet.locationId);

  function drawPath(arr: PixelCoords[]): void {
    if (arr.length < 3) return;

    ctx.beginPath();
    ctx.moveTo(arr[0].x, arr[0].y);

    for (let i = 1; i < arr.length; i++) {
      ctx.lineTo(arr[i].x, arr[i].y);
    }

    ctx.lineTo(arr[0].x, arr[0].y);
    ctx.fill();
  }

  function drawHill(fn: (x: number) => number): void {
    const arr: PixelCoords[] = [];
    const numTicks = Math.floor(canvas.width / TICK_SIZE);

    arr.push({ x: 0, y: canvas.height });

    for (let i = 0; i < numTicks; i++) {
      arr.push({
        x: i * TICK_SIZE,
        y: fn(i * TICK_SIZE),
      });
    }
    arr.push({ x: canvas.width, y: fn(canvas.width) });
    arr.push({ x: canvas.width, y: canvas.height });

    drawPath(arr);
  }
  function getDraw() {
    // let frameCount = 0;
    // this is a closure in case we want to remember this guy later
    return function () {
      if (canvas.width === 0 || canvas.height === 0) return;

      const { width, height } = canvas;

      // ctx.fillStyle = colors.backgroundColor;
      ctx.clearRect(0, 0, width, height);

      const oct1 = (p: PixelCoords) => 0.5 * perlin({ x: 2 * p.x, y: 2 * p.y });
      const oct2 = (p: PixelCoords) =>
        0.25 * perlin({ x: 4 * p.x, y: 4 * p.y });

      const mtn = (p: PixelCoords) => perlin(p) + oct1(p) + oct2(p);

      // const offset = Date.now() / 10;
      const offset = 0;

      const mtnBase = height * 0.7;
      const mtnHeight = 80;
      ctx.fillStyle = colors.secondaryColor;
      drawHill((x) => mtnBase + mtnHeight * mtn({ x: 2 * x + offset, y: 30 }));
      ctx.fillStyle = colors.secondaryColor2;
      drawHill(
        (x) => 7 + mtnBase + mtnHeight * mtn({ x: 2 * x + offset, y: 37 })
      );
      ctx.fillStyle = colors.secondaryColor3;
      drawHill(
        (x) => 14 + mtnBase + mtnHeight * mtn({ x: 2 * x + offset, y: 44 })
      );

      const hillBase = height * 0.74;
      const hillHeight = 10;
      ctx.fillStyle = colors.baseColor3;
      drawHill((x) => hillBase + hillHeight * perlin({ x, y: 0 }));
      ctx.fillStyle = colors.baseColor2;
      drawHill((x) => 5 + hillBase + hillHeight * perlin({ x, y: 5 }));
      ctx.fillStyle = colors.baseColor;
      drawHill((x) => 15 + hillBase + hillHeight * perlin({ x, y: 10 }));
    };
  }

  return getDraw();
}

// NOTE this refreshes every second like everything else; if it's slow we can cache a planet and wait for select
export function PlanetScape({ planet }: { planet: Planet | null }) {
  const [color, setColor] = useState<string>('none');

  // TODO turn this into const functions; this is very non-reacty
  const scapeRenderer = useRef<(() => void) | null>(null);
  const moonRenderer = useRef<(() => void) | null>(null);

  const scapeRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const moonRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));

  const [width, setWidth] = useState<number>(300);
  const [height, setHeight] = useState<number>(100);

  // const measuredRef = useCallback(node => {
  //   console.log('usecallback fired');
  //   if (node !== null) {
  //     setWidth(node.getBoundingClientRect().width);
  //     setHeight(node.getBoundingClientRect().height);
  //   }
  // }, []);

  const parentRef = useRef<HTMLDivElement>(null);

  // make sure canvas width matches element width
  useEffect(() => {
    if (!parentRef) return;

    if (parentRef.current === null) return;
    setWidth(parentRef.current.offsetWidth);
    setHeight(parentRef.current.offsetHeight);
  }, [parentRef, planet]);

  // make sure renderer matches planet
  useEffect(() => {
    const planetColors = getPlanetColors(planet);
    setColor(planetColors.backgroundColor);

    scapeRenderer.current = makeScapeRenderer(planet, scapeRef.current);
    moonRenderer.current = makeMoonRenderer(planet, moonRef.current);
  }, [planet, scapeRef]);

  // assert renderer non-null
  useEffect(() => {
    if (scapeRenderer.current === null) {
      scapeRenderer.current = makeScapeRenderer(planet, scapeRef.current);
    }
    if (moonRenderer.current === null) {
      moonRenderer.current = makeMoonRenderer(planet, moonRef.current);
    }
  }, [scapeRenderer, planet]);

  // make sure animframe is active
  useEffect(() => {
    let reqId;
    const render = () => {
      if (moonRenderer.current) moonRenderer.current();
      reqId = window.requestAnimationFrame(render);
    };
    if (scapeRenderer.current) scapeRenderer.current();

    window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(reqId);
    };
  }, [scapeRenderer, moonRenderer, planet]);

  return (
    <PlanetScapeContainer ref={parentRef} style={{ background: color }}>
      <canvas
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: '0',
          left: '0',
          background: 'none', // color fallback
        }}
        ref={moonRef}
      ></canvas>
      <canvas
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: '0',
          left: '0',
        }}
        ref={scapeRef}
      ></canvas>
    </PlanetScapeContainer>
  );
}
