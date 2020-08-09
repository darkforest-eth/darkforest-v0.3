import React, { useEffect, useRef, RefObject } from 'react';
import autoBind from 'auto-bind';
import dfstyles from '../styles/dfstyles';
import { hasTouchscreen, isMobileOrTablet } from '../api/BrowserChecks';
import { LandingPageZIndex } from './LandingPage';

const canvasStyle = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  zIndex: LandingPageZIndex.Canvas,
  // background:'blue',
} as React.CSSProperties;

type Position = { x: number; y: number };
type Point = {
  pos: Position;
  r: number;
  z: number;
  color: string;
};

type Edge = [number, number]; // as index, index

const scaleFactor = 1.5;

class LandingPageCanvasRenderer {
  static instance: LandingPageCanvasRenderer | null;
  canvasRef: RefObject<HTMLCanvasElement>;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  frameRequestId: number;

  mouse: Position;
  delMouse: Position;

  points: Point[];
  realPos: Position[];
  edges: Edge[];

  private constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Not a 2D canvas.');
    }
    this.ctx = ctx;
    this.mouse = { x: -0xdeadbeef, y: -0xdeadbeef };
    this.delMouse = { x: 0, y: 0 };
    this.points = [];
    this.edges = [];

    autoBind(this);

    this.setupDraw();
    this.frame();
  }

  private makeConstellation(center: Position): void {
    const randomColor: () => string = () => {
      const idx = Math.floor(Math.random() * 3);
      return [
        dfstyles.colors.dfgreen,
        dfstyles.colors.dfblue,
        dfstyles.colors.dfred,
      ][idx];
    };

    const newPoints: Point[] = [];
    let newEdges: Edge[] = [];

    const numPoints = Math.floor(2 + Math.random() * 7);
    for (let i = 0; i < numPoints; i++) {
      const size = 20 + Math.random() * 160;
      const t = Math.random() * 2 * Math.PI;
      newPoints.push({
        pos: {
          x: center.x + size * Math.sin(t),
          y: center.y + size * Math.cos(t),
        },
        z: 0.2 + Math.random() * 0.8,
        r: 1 + Math.random() * 4,
        color: randomColor(),
      });
    }

    const numEdges = Math.floor((1 + Math.random()) * (numPoints - 1));
    for (let i = 0; i < numEdges; i++) {
      const p1 = Math.floor(Math.random() * numPoints);
      let p2 = p1;
      while (p2 === p1) p2 = Math.floor(Math.random() * numPoints);
      newEdges.push([p1, p2]);
    }

    const length = this.points.length;
    newEdges = newEdges.map((e) => [e[0] + length, e[1] + length]);

    for (const point of newPoints) {
      this.points.push(point);
      this.realPos.push({
        x: -0xdeadbeef,
        y: -0xdeadbeef,
      });
    }
    for (const edge of newEdges) {
      this.edges.push(edge);
    }
  }

  private setupDraw() {
    const canvas = this.canvas;

    this.points = [];
    this.edges = [];
    this.realPos = [];

    const numH =
      window.innerWidth > 400
        ? Math.floor(canvas.width / (200 * scaleFactor))
        : 2;
    const numV =
      window.innerHeight > 600
        ? Math.floor(canvas.height / (180 * scaleFactor))
        : 3;

    const perturb = () => -150 + Math.random() * 300;
    const midX = (x) => 0.2 * canvas.width < x && x < 0.8 * canvas.width;
    const midY = (y) => 0.2 * canvas.height < y && y < 0.8 * canvas.height;
    const mid = (x, y) => midX(x) && midY(y);

    for (let i = 0; i < numH; i++) {
      for (let j = 0; j < numV; j++) {
        const baseX = (i * canvas.width) / (numH - 1);
        const baseY = (j * canvas.height) / (numV - 1);
        const rand = Math.random();
        const m = mid(baseX, baseY);
        if ((m && rand < 0.4) || (!m && rand < 0.9)) {
          this.makeConstellation({
            x: baseX + perturb(),
            y: baseY + perturb(),
          });
        }
      }
    }
  }

  private allowMouse(): boolean {
    return !(hasTouchscreen() || isMobileOrTablet() || window.innerWidth < 600);
  }

  private frame(): void {
    // references for ease
    const ctx = this.ctx;
    const canvas = this.canvas;
    const mouse = this.mouse;
    const delMouse = this.delMouse;
    const edges = this.edges;
    const points = this.points;
    const realPos = this.realPos;

    // fake mouse
    if (!this.allowMouse()) {
      const now = () => Date.now() / 3000;

      const xOfT = () => 1.5 * (0.5 + 0.5 * Math.cos(now()));
      const yOfT = () => 1.5 * (0.5 + 0.5 * Math.sin(now()));
      const fakeE = {
        clientX: xOfT() * window.innerWidth,
        clientY: yOfT() * window.innerHeight,
      };
      this._mouseMove(fakeE);
    }

    // draw stuff

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const i in points) {
      const point = points[i];
      // const { x, y } = point.pos;
      const {
        z,
        pos: { x, y },
      } = point;

      const realX = x + z * delMouse.x * -4;
      const realY = y + z * delMouse.y * -4;

      this.realPos[i] = {
        x: realX,
        y: realY,
      };
    }

    for (const edge of edges) {
      const [i1, i2] = edge;
      const p1 = realPos[i1].x === -0xdeadbeef ? points[i1].pos : realPos[i1];
      const p2 = realPos[i2].x === -0xdeadbeef ? points[i2].pos : realPos[i2];

      ctx.strokeStyle = dfstyles.colors.subtext;

      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    for (const i in points) {
      const { x: realX, y: realY } = this.realPos[i];

      const point = points[i];
      // const { x, y } = point.pos;
      const { r, color } = point;

      const dist = (realX - mouse.x) ** 2 + (realY - mouse.y) ** 2;
      const maxDist = 900 ** 2;
      const factor1 = Math.max(0, 1 - dist / maxDist);
      const factor2 = 0.5 * (Math.sin(8 ** Math.sin(dist / 300000)) + 1);

      // const factor = factor1 * factor2;
      const factor = factor1 * factor2;

      // const factor = factor1;

      ctx.fillStyle = dfstyles.colors.subtext;
      ctx.beginPath();
      ctx.arc(realX, realY, r * (1 + factor * 1.5), 0, 2 * Math.PI);
      ctx.fill();

      ctx.globalAlpha = factor;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(realX, realY, r * (1 + factor * 1.5), 0, 2 * Math.PI);
      ctx.fill();

      ctx.globalAlpha = 1.0;
    }

    this.frameRequestId = window.requestAnimationFrame(this.frame.bind(this));
  }

  private mouseMove(e) {
    if (!this.allowMouse()) return;
    this._mouseMove(e);
  }

  private _mouseMove(e) {
    const newMouse = {
      x: e.clientX * scaleFactor,
      y: e.clientY * scaleFactor,
    };

    let vMouse = { x: 0, y: 0 };

    const _tSquare: (base: Position, max: number) => Position = (base, max) => {
      const sgn = {
        x: base.x < 0 ? -1 : 1,
        y: base.y < 0 ? -1 : 1,
      };
      const magnitude = {
        x: base.x * sgn.x,
        y: base.y * sgn.y,
      };
      return {
        x: sgn.x * Math.min(magnitude.x, max),
        y: sgn.y * Math.min(magnitude.y, max),
      };
    };

    const _tCircle: (base: Position, max: number) => Position = (base, max) => {
      if (base.x ** 2 + base.y ** 2 > max ** 2) {
        const mult = max / Math.sqrt(base.x ** 2 + base.y ** 2);
        return { x: base.x * mult, y: base.y * mult };
      } else return base;
    };

    const _tIdentity = (x, _m) => x;

    if (this.mouse.x !== -0xdeadbeef) {
      const baseVmouse = {
        x: newMouse.x - this.mouse.x,
        y: newMouse.y - this.mouse.y,
      };
      vMouse = _tCircle(baseVmouse, 20);
    }

    const baseDelMouse = {
      x: this.delMouse.x + vMouse.x * 0.1,
      y: this.delMouse.y + vMouse.y * 0.1,
    };
    this.delMouse = _tIdentity(baseDelMouse, 100);

    this.mouse = {
      x: e.clientX * scaleFactor,
      y: e.clientY * scaleFactor,
    };
  }

  static initialize(canvas: HTMLCanvasElement) {
    const canvasRenderer = new LandingPageCanvasRenderer(canvas);
    LandingPageCanvasRenderer.instance = canvasRenderer;
    const _this = canvasRenderer;
    window.addEventListener('mousemove', _this.mouseMove);

    return canvasRenderer;
  }

  static destroyInstance(): void {
    const _this = LandingPageCanvasRenderer.instance;
    if (_this) {
      window.cancelAnimationFrame(_this.frameRequestId);
      window.removeEventListener('mousemove', _this.mouseMove);
    }
    LandingPageCanvasRenderer.instance = null;
  }
}

export default function LandingPageCanvas() {
  const [width, setWidth] = React.useState(scaleFactor * window.innerWidth);
  const [height, setHeight] = React.useState(scaleFactor * window.innerHeight);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    function onResize() {
      setWidth(scaleFactor * window.innerWidth);
      setHeight(scaleFactor * window.innerHeight);
    }

    const canvas = canvasRef.current;
    if (canvas) LandingPageCanvasRenderer.initialize(canvas);
    else console.error('could not init draw');

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      width={width}
      height={height}
      ref={canvasRef}
      style={canvasStyle}
    ></canvas>
  );
}
