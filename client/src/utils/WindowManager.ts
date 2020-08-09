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
  MouseMove = 'MouseMove',
  MouseDown = 'MouseDown',
  MouseUp = 'MouseUp',
  StateChanged = 'StateChanged',

  MiningCoordsUpdate = 'MiningCoordsUpdate',
}

export enum CursorState {
  Normal,
  Asking,
  Targeting,
}

// TODO wire all the mouse events from the game into this guy
class WindowManager extends EventEmitter {
  static instance: WindowManager;
  private mousePos: MousePos;
  private mousedownPos: MousePos | null;

  private lastZIndex: number;
  private cursorState: CursorState;

  private constructor() {
    super();
    this.mousePos = { x: 0, y: 0 };
    this.mousedownPos = null;
    this.lastZIndex = 0;

    window.addEventListener('mousemove', (e) => {
      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;
      this.emit(WindowManagerEvent.MouseMove, this.mousePos);
    });

    window.addEventListener('mousedown', (e) => {
      this.mousedownPos = {
        x: e.clientX,
        y: e.clientY,
      };
      this.emit(WindowManagerEvent.MouseDown, this.mousedownPos);
    });

    window.addEventListener('mouseup', (_e) => {
      this.mousedownPos = null;
      this.emit(WindowManagerEvent.MouseUp, this.mousePos);
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
