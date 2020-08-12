import { EventEmitter } from 'events';
import { GameWindowZIndex } from '../app/GameWindow';
import { WorldCoords } from './Coordinates';

/*
  technically these should be number | null since this thing will init before
  the first mousemove event, but the probability of this mattering is so low idc
*/

// these should be relative to window
export type MousePos = {
  x: number;
  y: number;
};

export enum WindowManagerEvent {
  StateChanged = 'StateChanged',
  MiningCoordsUpdate = 'MiningCoordsUpdate',
  TooltipUpdated = 'TooltipUpdated',

  ShiftDown = 'ShiftDown',
  ShiftUp = 'ShiftUp',
}

export enum CursorState {
  Normal,
  Asking,
  Targeting,
}

export enum TooltipName {
  None,
  SilverGrowth,
  SilverCap,
  Silver,
  SilverMax,
  Population,
  PopulationGrowth,
  Range,
  TwitterHandle,
  Bonus,
  MinPop,
  Time50,
  Time90,
  PopGrowth,
  Pirates,
  Upgrades,
  PlanetRank,
  MaxLevel,

  SelectedSilver,
  SelectedPopulation,
  Rank,
  Score,
  MiningPause,
  MiningTarget,
  HashesPerSec,
  CurrentMining,
  SilverProd,

  BonusPopCap,
  BonusPopGro,
  BonusSilCap,
  BonusSilGro,
  BonusRange,

  Clowntown,

  // note that we actually add ModalName to ModalHelp, and that everything after
  // is not referenced directly. for this reason the relative ordring matters.
  ModalHelp,
  ModalPlanetDetails,
  ModalLeaderboard,
  ModalPlanetDex,
  ModalUpgradeDetails,
  ModalTwitterVerification,
  ModalTwitterBroadcast,
}

// the purpose of this class is to manage all ui pane events
// TODO wire all the mouse events from the game into this guy
class WindowManager extends EventEmitter {
  static instance: WindowManager;
  private mousePos: MousePos;
  private mousedownPos: MousePos | null;

  private lastZIndex: number;
  private cursorState: CursorState;

  private shiftPressed: boolean;

  private tooltipStack: TooltipName[];

  private constructor() {
    super();
    this.mousePos = { x: 0, y: 0 };
    this.mousedownPos = null;
    this.lastZIndex = 0;
    this.tooltipStack = [];
    this.shiftPressed = false;

    // this might be slow, consider refactor
    this.setMaxListeners(40); // however many tooltips there are

    // is it bad that this doesn't get cleaned up?
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Shift') {
        this.shiftPressed = true;
        this.emit(WindowManagerEvent.ShiftDown);
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === 'Shift') {
        this.shiftPressed = false;
        this.emit(WindowManagerEvent.ShiftUp);
      }
    });
  }

  static getInstance(): WindowManager {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager();
    }

    return WindowManager.instance;
  }

  static initialize(): WindowManager {
    const terminalEmitter = new WindowManager();

    return terminalEmitter;
  }

  // tooltip stuff
  pushTooltip(tooltip: TooltipName): void {
    this.tooltipStack.push(tooltip);
    this.emit(WindowManagerEvent.TooltipUpdated, this.getTooltip());
  }

  popTooltip(): void {
    this.tooltipStack.pop();
    this.emit(WindowManagerEvent.TooltipUpdated, this.getTooltip());
  }

  getTooltip(): TooltipName {
    if (this.tooltipStack.length === 0) return TooltipName.None;
    return this.tooltipStack[this.tooltipStack.length - 1];
  }

  // getters
  getClickDelta(): MousePos {
    if (!this.mousedownPos) return { x: 0, y: 0 };
    else
      return {
        x: this.mousePos.x - this.mousedownPos.x,
        y: this.mousePos.y - this.mousedownPos.y,
      };
  }

  getIndex(): number {
    this.lastZIndex++;
    return this.lastZIndex + GameWindowZIndex.Modal;
  }

  getCursorState(): CursorState {
    return this.cursorState;
  }

  // setters / mutators
  setCursorState(newstate: CursorState): void {
    this.cursorState = newstate;
    this.emit(WindowManagerEvent.StateChanged, newstate);
  }

  acceptInputForTarget(input: WorldCoords) {
    if (this.cursorState !== CursorState.Targeting) return;
    this.emit(WindowManagerEvent.MiningCoordsUpdate, input);
    this.setCursorState(CursorState.Normal);
  }
}

export default WindowManager;
