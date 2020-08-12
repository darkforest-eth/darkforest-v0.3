import { RefObject } from 'react';
import GameUIManager from './GameUIManager';
import Viewport from './Viewport';
import { CanvasCoords, WorldCoords } from '../../utils/Coordinates';
import {
  Location,
  QueuedArrival,
  LocationId,
  Planet,
  ExploredChunkData,
  PlanetType,
  PlanetResource,
} from '../../_types/global/GlobalTypes';
import { hasOwner, moveShipsDecay, bonusFromHex } from '../../utils/Utils';
import autoBind from 'auto-bind';
import { PlanetColorInfo } from '../../_types/darkforest/app/board/utils/UtilsTypes';
import { addToChunkMap } from '../../utils/ChunkUtils';
import dfstyles from '../../styles/dfstyles';
import { getPlanetColors, getOwnerColor } from '../../utils/ProcgenUtils';
import { emptyAddress } from '../../utils/CheckedTypeUtils';

class CanvasRenderer {
  static instance: CanvasRenderer | null;

  // cached for faster rendering
  planetToHue: Record<LocationId, PlanetColorInfo>;

  renderableChunkMap: Map<string, ExploredChunkData>;

  canvasRef: RefObject<HTMLCanvasElement>;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  frameRequestId: number;
  gameUIManager: GameUIManager;

  private constructor(canvas: HTMLCanvasElement, gameUIManager: GameUIManager) {
    this.canvas = canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Not a 2D canvas.');
    }
    this.ctx = ctx;

    this.gameUIManager = gameUIManager;
    this.planetToHue = {};
    this.renderableChunkMap = new Map<string, ExploredChunkData>();

    this.frame();
    autoBind(this);
  }

  static getInstance(): CanvasRenderer {
    if (!CanvasRenderer.instance) {
      throw new Error(
        'Attempted to get CanvasRenderer object before initialized'
      );
    }

    return CanvasRenderer.instance;
  }

  static destroyInstance(): void {
    if (CanvasRenderer.instance) {
      window.cancelAnimationFrame(CanvasRenderer.instance.frameRequestId);
    }
    CanvasRenderer.instance = null;
  }

  static initialize(canvas: HTMLCanvasElement, gameUIManager: GameUIManager) {
    const canvasRenderer = new CanvasRenderer(canvas, gameUIManager);
    CanvasRenderer.instance = canvasRenderer;

    return canvasRenderer;
  }

  private frame() {
    const viewport = Viewport.getInstance();

    const exploredChunks = this.gameUIManager.getExploredChunks();
    this.renderableChunkMap = new Map<string, ExploredChunkData>();
    let planetLocations: Location[] = [];
    for (const exploredChunk of exploredChunks) {
      if (viewport.intersectsViewport(exploredChunk)) {
        addToChunkMap(this.renderableChunkMap, exploredChunk, false);
        for (const planetLocation of exploredChunk.planetLocations) {
          planetLocations.push(planetLocation);
        }
      }
    }

    planetLocations = planetLocations.sort((a, b) => {
      const aLevel = this.gameUIManager.getPlanetLevel(a.hash);
      const bLevel = this.gameUIManager.getPlanetLevel(b.hash);
      // TODO: throw error if either is null
      if (aLevel === null) {
        return 1;
      }
      if (bLevel === null) {
        return -1;
      }
      return bLevel - aLevel;
    });

    this.drawCleanBoard();
    this.drawKnownChunks(this.renderableChunkMap.values());

    this.drawSelectedRangeRing();
    this.drawVoyages();
    this.drawPlanets(planetLocations);

    this.drawSelectedRect();
    this.drawHoveringRect();
    this.drawMousePath();
    this.drawBorders();

    this.frameRequestId = window.requestAnimationFrame(this.frame.bind(this));
  }

  private drawCleanBoard() {
    const viewport = Viewport.getInstance();

    this.ctx.clearRect(0, 0, viewport.viewportWidth, viewport.viewportHeight);
    this.ctx.fillStyle = 'grey';
    this.ctx.fillRect(0, 0, viewport.viewportWidth, viewport.viewportHeight);
  }

  private drawKnownChunks(knownChunks: Iterable<ExploredChunkData>) {
    for (const chunk of knownChunks) {
      const chunkLoc = chunk.chunkFootprint;
      const center = {
        x: chunkLoc.bottomLeft.x + chunkLoc.sideLength / 2,
        y: chunkLoc.bottomLeft.y + chunkLoc.sideLength / 2,
      };
      this.drawRectWithCenter(
        center,
        chunkLoc.sideLength,
        chunkLoc.sideLength,
        dfstyles.game.canvasbg
      );
    }
  }

  private drawPlanets(planetLocations: Location[]) {
    for (const location of planetLocations) {
      this.drawPlanetAtLocation(location);
    }
  }

  private drawPlanetAtLocation(location: Location) {
    const planetLevel = this.gameUIManager.getPlanetDetailLevel(location.hash);
    if (
      planetLevel === null ||
      planetLevel < this.gameUIManager.getDetailLevel()
    ) {
      return; // so we don't call getPlanetWithLocation, which triggers updates every second
    }
    const planet = this.gameUIManager.getPlanetWithLocation(location);
    if (!planet) {
      return null;
    }

    const population = planet ? Math.ceil(planet.population) : 0;

    const silver = planet ? Math.floor(planet.silver) : 0;
    const center = { x: location.coords.x, y: location.coords.y };

    const radius = this.gameUIManager.getRadiusOfPlanetLevel(
      planet.planetLevel
    );

    if (!this.planetToHue[planet.locationId]) {
      this.planetToHue[planet.locationId] = getPlanetColors(planet);
    }
    const colors = this.planetToHue[planet.locationId];

    let color = colors.previewColor;
    if (planet.planetType === PlanetType.TRADING_POST) {
      color = 'gray';
      this.drawText('TP', 15, center, 'red');
      this.drawText(
        planet.population.toString(),
        15,
        { x: center.x, y: center.y + 15 },
        'red'
      );
    }

    // const colorIndex = [
    //   colors.secondaryColor,
    //   colors.baseColor2,
    //   colors.secondaryColor2,
    //   colors.baseColor3,
    //   colors.secondaryColor3,
    // ];
    // const offset = colors.baseHue % colorIndex.length;

    const myRotation = (-40 + (colors.baseHue % 80)) * (Math.PI / 180);

    // this.ctx.rotate(myRotation);

    /* draw ring back */
    const totalSilverLevel =
      planet.planetResource === PlanetResource.SILVER ? 1 : 0;
    //(planet.silverGrowth !== 0 ? 1 : 0) + planet.level[2] + planet.level[3];
    for (let i = 0; i < totalSilverLevel; i++)
      this.drawHalfRingWithCenter(
        center,
        radius,
        i,
        myRotation,
        true,
        // colorIndex[offset + i]
        colors.backgroundColor
      );

    /* draw planet */

    if (hasOwner(planet)) {
      if (this.gameUIManager.isOwnedByMe(planet)) {
        this.drawLoopWithCenter(center, radius * 1.2, 2, 'blue');
      } else {
        this.drawLoopWithCenter(center, radius * 1.2, 2, getOwnerColor(planet));
      }
    }

    this.drawCircleWithCenter(center, radius, color);

    /* draw ring front */
    for (let i = 0; i < totalSilverLevel; i++)
      this.drawHalfRingWithCenter(
        center,
        radius,
        i,
        myRotation,
        false,
        // colorIndex[offset + i]
        colors.backgroundColor
      );

    this.drawAsteroidBelt(center, radius, planet);

    const current = this.gameUIManager.getDetailLevel();
    const det = this.gameUIManager.getPlanetDetailLevel(planet.locationId);
    if (det === null) return;
    if (det > current + 1) {
      if (hasOwner(planet) && population > 0) {
        let popString = population.toString();
        let lockedPop = 0;
        for (const unconfirmedMove of planet.unconfirmedDepartures) {
          lockedPop += unconfirmedMove.forces;
        }
        if (lockedPop > 0) {
          popString += ` (-${Math.floor(lockedPop)})`;
        }
        this.drawText(
          popString,
          15,
          {
            x: center.x,
            y: center.y - 1.1 * radius - (planet.owner ? 0.75 : 0.25),
          },
          this.gameUIManager.isOwnedByMe(planet)
            ? 'white'
            : getOwnerColor(planet)
        );
      } else if (!hasOwner(planet) && population > 0) {
        const current = this.gameUIManager.getDetailLevel();
        const det = this.gameUIManager.getPlanetDetailLevel(planet.locationId);
        if (det === null) return;
        if (det > current) {
          this.drawText(
            population.toString(),
            15,
            {
              x: center.x,
              y: center.y - 1.1 * radius - (planet.owner ? 0.75 : 0.25),
            },
            '#444455'
          );
        }
      }

      if (hasOwner(planet) && (planet.silverGrowth > 0 || planet.silver > 0)) {
        this.drawText(
          silver.toString(),
          15,
          {
            x: center.x,
            y: center.y + 1.1 * radius + (planet.owner ? 0.75 : 0.25),
          },
          'gold'
        );
      }
    }
  }

  private drawVoyages() {
    const voyages = this.gameUIManager.getAllVoyages();
    for (const voyage of voyages) {
      const now = Date.now() / 1000;
      if (now < voyage.arrivalTime) {
        const isMyVoyage = voyage.player === this.gameUIManager.getAccount();
        this.drawVoyagePath(
          voyage.fromPlanet,
          voyage.toPlanet,
          true,
          isMyVoyage
        );
        this.drawFleet(voyage);
      }
    }

    const unconfirmedDepartures = this.gameUIManager.getUnconfirmedMoves();
    for (const unconfirmedMove of unconfirmedDepartures) {
      this.drawVoyagePath(
        unconfirmedMove.from,
        unconfirmedMove.to,
        false,
        true
      );
    }
  }

  private drawFleet(voyage: QueuedArrival) {
    const fromLoc = this.gameUIManager.getLocationOfPlanet(voyage.fromPlanet);
    const fromPlanet = this.gameUIManager.getPlanetWithId(voyage.fromPlanet);
    const toLoc = this.gameUIManager.getLocationOfPlanet(voyage.toPlanet);
    if (!fromPlanet || !fromLoc || !toLoc) {
      return;
    }

    const myMove = voyage.player === this.gameUIManager.getAccount();
    const now = Date.now() / 1000;
    let proportion =
      (now - voyage.departureTime) /
      (voyage.arrivalTime - voyage.departureTime);
    proportion = Math.max(proportion, 0.01);
    proportion = Math.min(proportion, 0.99);

    const shipsLocationX =
      (1 - proportion) * fromLoc.coords.x + proportion * toLoc.coords.x;
    const shipsLocationY =
      (1 - proportion) * fromLoc.coords.y + proportion * toLoc.coords.y;
    const shipsLocation = { x: shipsLocationX, y: shipsLocationY };

    this.drawCircleWithCenter(shipsLocation, 1, myMove ? 'blue' : 'red');
    const timeLeftSeconds = Math.floor(voyage.arrivalTime - now);
    this.drawText(
      `${timeLeftSeconds.toString()}s`,
      15,
      { x: shipsLocationX, y: shipsLocationY - 1.1 },
      'white'
    );
  }

  private drawVoyagePath(
    from: LocationId,
    to: LocationId,
    confirmed: boolean,
    isMyVoyage: boolean
  ) {
    const fromLoc = this.gameUIManager.getLocationOfPlanet(from);
    const fromPlanet = this.gameUIManager.getPlanetWithId(from);
    const toLoc = this.gameUIManager.getLocationOfPlanet(to);
    if (!fromPlanet || !fromLoc || !toLoc) {
      return;
    }

    this.drawLine(
      fromLoc.coords,
      toLoc.coords,
      confirmed ? 2 : 1,
      isMyVoyage ? 'blue' : 'red',
      confirmed ? false : true
    );
  }

  private drawHoveringRect() {
    const uiManager = this.gameUIManager;

    const hoveringOverCoords = uiManager.getHoveringOverCoords();
    if (!hoveringOverCoords) {
      return;
    }

    const hoveringOverPlanet = uiManager.getHoveringOverPlanet();

    const sideLength = hoveringOverPlanet
      ? 2.4 * uiManager.getRadiusOfPlanetLevel(hoveringOverPlanet.planetLevel)
      : 1;

    this.drawRectBorderWithCenter(
      hoveringOverCoords,
      sideLength,
      sideLength,
      2,
      'white'
    );
  }

  private drawSelectedRangeRing() {
    const uiManager = this.gameUIManager;
    const selected = uiManager.getSelectedPlanet();

    if (!selected) return;
    const loc = uiManager.getLocationOfPlanet(selected.locationId);
    if (!loc) return;
    const { x, y } = loc?.coords;

    this.drawLoopWithCenter(
      { x, y },
      4.3219 * selected.range, // log_2 (100/5)
      1,
      dfstyles.game.rangecolors.dash,
      true
    );
    this.drawText(
      '100%',
      15,
      { x, y: y + 4.3219 * selected.range },
      dfstyles.game.rangecolors.dash
    );

    this.drawLoopWithCenter(
      { x, y },
      3.3219 * selected.range, // log_2 (50/5)
      1,
      dfstyles.game.rangecolors.dash,
      true
    );
    this.drawText(
      '50%',
      15,
      { x, y: y + 3.3219 * selected.range },
      dfstyles.game.rangecolors.dash
    );

    this.drawLoopWithCenter(
      { x, y },
      2.3219 * selected.range, // log_2 (25/5)
      1,
      dfstyles.game.rangecolors.dash,
      true
    );
    this.drawText(
      '25%',
      15,
      { x, y: y + 2.3219 * selected.range },
      dfstyles.game.rangecolors.dash
    );

    if (selected.owner === emptyAddress) return;

    const forcesSending = uiManager.getForcesSending(selected.locationId); // [0, 100]
    const scaled =
      (forcesSending * selected.population) / selected.populationCap;
    let ratio = Math.log(scaled / 5) / Math.log(2);
    ratio = Math.max(ratio, 0);

    this.drawLoopWithCenter(
      { x, y },
      ratio * selected.range, // log_2 (25/5)
      1,
      dfstyles.game.rangecolors.dashpop,
      true
    );
    this.drawText(
      `${forcesSending}%`,
      15,
      { x, y: y + ratio * selected.range },
      dfstyles.game.rangecolors.dashpop
    );
  }

  private drawSelectedRect() {
    const uiManager = this.gameUIManager;
    const selectedCoords = uiManager.getSelectedCoords();
    const selectedPlanet = uiManager.getSelectedPlanet();
    if (!selectedPlanet || !selectedCoords) {
      return;
    }

    const sideLength =
      2.4 * uiManager.getRadiusOfPlanetLevel(selectedPlanet.planetLevel);
    this.drawRectBorderWithCenter(
      selectedCoords,
      sideLength,
      sideLength,
      2,
      'red'
    );
  }

  private drawMousePath() {
    const uiManager = this.gameUIManager;
    const from = uiManager.getMouseDownCoords();
    const to = uiManager.getHoveringOverCoords();

    if (from && to) {
      const myPlanet = uiManager.isOverOwnPlanet(from);
      if (myPlanet && to !== from) {
        this.drawLine(from, to, 2);
        let effectivePopulation = myPlanet.population;
        for (const unconfirmedMove of myPlanet.unconfirmedDepartures) {
          effectivePopulation -= unconfirmedMove.forces;
        }
        const shipsMoved =
          (uiManager.getForcesSending(myPlanet.locationId) / 100) *
          effectivePopulation;

        const dist = Math.sqrt((from.x - to.x) ** 2 + (from.y - to.y) ** 2);

        const myAtk: number = moveShipsDecay(shipsMoved, myPlanet, dist);
        this.drawText(
          `Fleet: ${Math.round(myAtk)}`,
          15,
          { x: to.x, y: to.y },
          myAtk > 0 ? 'white' : 'red'
        );
      }
    }
  }

  private drawBorders() {
    const radius = this.gameUIManager.getWorldRadius();
    this.drawLoopWithCenter({ x: 0, y: 0 }, radius, 2, 'white');
  }

  private drawRectWithCenter(
    center: WorldCoords,
    width: number,
    height: number,
    color = 'white'
  ) {
    const viewport = Viewport.getInstance();

    const centerCanvasCoords = viewport.worldToCanvasCoords(center);
    const widthCanvasCoords = viewport.worldToCanvasDist(width);
    const heightCanvasCoords = viewport.worldToCanvasDist(height);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      Math.floor(centerCanvasCoords.x - widthCanvasCoords / 2),
      Math.floor(centerCanvasCoords.y - heightCanvasCoords / 2),
      widthCanvasCoords,
      heightCanvasCoords
    );
  }

  private drawAsteroidBelt(
    center: WorldCoords,
    radius: number,
    planet: Planet
  ) {
    const planetDetailLevel = this.gameUIManager.getPlanetDetailLevel(
      planet.locationId
    );
    const detailLevel = this.gameUIManager.getDetailLevel();
    if (planetDetailLevel === null || planetDetailLevel < detailLevel + 1) {
      return;
    }

    const viewport = Viewport.getInstance();
    const centerCanvasCoords = viewport.worldToCanvasCoords(center);
    const r = viewport.worldToCanvasDist(0.3 * radius);
    const orbit = viewport.worldToCanvasDist(1.2 * radius) + r;

    const [
      popCapBonus,
      popGroBonus,
      silCapBonus,
      silGroBonus,
      rangeBonus,
    ] = bonusFromHex(planet.locationId);

    this.ctx.save();
    this.ctx.translate(centerCanvasCoords.x, centerCanvasCoords.y);

    const angle = Date.now() * 0.001;
    const f = (t) => ({
      x: Math.cos(angle + t),
      y: Math.sin(angle + t),
    });

    if (popCapBonus) {
      const { x, y } = f(0);
      this.ctx.fillStyle = dfstyles.game.bonuscolors.popCap;
      this.ctx.beginPath();
      this.ctx.arc(orbit * x, orbit * y, r, 0, 2 * Math.PI);
      this.ctx.fill();
    }
    if (popGroBonus) {
      const { x, y } = f(1);
      this.ctx.fillStyle = dfstyles.game.bonuscolors.popGro;
      this.ctx.beginPath();
      this.ctx.arc(orbit * x, orbit * y, r, 0, 2 * Math.PI);
      this.ctx.fill();
    }
    if (silCapBonus) {
      const { x, y } = f(2);
      this.ctx.fillStyle = dfstyles.game.bonuscolors.silCap;
      this.ctx.beginPath();
      this.ctx.arc(orbit * x, orbit * y, r, 0, 2 * Math.PI);
      this.ctx.fill();
    }
    if (silGroBonus) {
      const { x, y } = f(3);
      this.ctx.fillStyle = dfstyles.game.bonuscolors.silGro;
      this.ctx.beginPath();
      this.ctx.arc(orbit * x, orbit * y, r, 0, 2 * Math.PI);
      this.ctx.fill();
    }
    if (rangeBonus) {
      const { x, y } = f(4);
      this.ctx.fillStyle = dfstyles.game.bonuscolors.range;
      this.ctx.beginPath();
      this.ctx.arc(orbit * x, orbit * y, r, 0, 2 * Math.PI);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  private drawRectBorderWithCenter(
    center: WorldCoords,
    width: number,
    height: number,
    strokeWidth: number,
    color = 'white'
  ) {
    const viewport = Viewport.getInstance();

    const centerCanvasCoords = viewport.worldToCanvasCoords(center);
    const widthCanvasCoords = viewport.worldToCanvasDist(width);
    const heightCanvasCoords = viewport.worldToCanvasDist(height);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = strokeWidth;
    this.ctx.strokeRect(
      centerCanvasCoords.x - widthCanvasCoords / 2,
      centerCanvasCoords.y - heightCanvasCoords / 2,
      widthCanvasCoords,
      heightCanvasCoords
    );
  }

  private drawCircleWithCenter(
    center: WorldCoords,
    radius: number,
    color = 'white'
  ) {
    const viewport = Viewport.getInstance();

    const centerCanvasCoords = viewport.worldToCanvasCoords(center);
    const radiusCanvasCoords = viewport.worldToCanvasDist(radius);
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(
      centerCanvasCoords.x,
      centerCanvasCoords.y,
      radiusCanvasCoords,
      0,
      2 * Math.PI,
      false
    );
    this.ctx.fill();
  }

  private drawHalfRingWithCenter(
    centerRaw: WorldCoords,
    radiusRaw: number,
    ringNumber: number,
    rotation: number,
    isFlipped: boolean,
    color = 'white'
  ) {
    const ctx = this.ctx;
    const i = ringNumber;
    const viewport = Viewport.getInstance();

    const center = viewport.worldToCanvasCoords(centerRaw);
    const radius = viewport.worldToCanvasDist(radiusRaw);
    ctx.fillStyle = color;

    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(rotation);

    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      (1.4 + 0.45 * i) * radius,
      (0.5 + 0.15 * i) * radius,
      0,
      Math.PI,
      2 * Math.PI,
      !isFlipped
    );
    ctx.ellipse(
      0,
      0,
      (1.1 + 0.45 * i) * radius,
      (0.4 + 0.15 * i) * radius,
      0,
      2 * Math.PI,
      Math.PI,
      isFlipped
    );
    ctx.fill();

    ctx.restore();
  }

  private drawLoopWithCenter(
    center: WorldCoords,
    radius: number,
    width: number,
    color = 'white',
    dotted = false
  ) {
    const viewport = Viewport.getInstance();

    const centerCanvasCoords = viewport.worldToCanvasCoords(center);
    const radiusCanvasCoords = viewport.worldToCanvasDist(radius);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    this.ctx.strokeStyle = color;
    // this.ctx.lineWidth = viewport.worldToCanvasDist(width);
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.arc(
      centerCanvasCoords.x,
      centerCanvasCoords.y,
      radiusCanvasCoords,
      0,
      2 * Math.PI,
      false
    );

    if (dotted) this.ctx.setLineDash([15, 15]);
    else this.ctx.setLineDash([]);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
  }

  private drawLine(
    startCoords: WorldCoords,
    endCoords: WorldCoords,
    lineWidth: number,
    color = 'white',
    dotted = false
  ) {
    const viewport = Viewport.getInstance();

    this.ctx.beginPath();
    // this.ctx.lineWidth = viewport.worldToCanvasDist(lineWidth);
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = color;
    const startCanvasCoords: CanvasCoords = viewport.worldToCanvasCoords(
      startCoords
    );
    this.ctx.moveTo(startCanvasCoords.x, startCanvasCoords.y);
    const endCanvasCoords: CanvasCoords = viewport.worldToCanvasCoords(
      endCoords
    );
    this.ctx.lineTo(endCanvasCoords.x, endCanvasCoords.y);

    if (dotted) this.ctx.setLineDash([15, 15]);
    else this.ctx.setLineDash([]);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
  }

  private drawText(
    text: string,
    fontSize: number,
    center: WorldCoords,
    color = 'white'
  ) {
    const viewport = Viewport.getInstance();

    const centerCanvasCoords = viewport.worldToCanvasCoords(center);

    this.ctx.font = `${fontSize}px sans-serif`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, centerCanvasCoords.x, centerCanvasCoords.y);
  }
}

export default CanvasRenderer;
