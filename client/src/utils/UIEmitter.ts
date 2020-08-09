import { EventEmitter } from 'events';

export enum UIEmitterEvent {
  GamePlanetSelected = 'GamePlanetSelected',
  CenterPlanet = 'CenterPlanet',
  WindowResize = 'WindowResize',

  UIChange = 'UIChange', // whenever you collapse, etc.

  CanvasMouseDown = 'CanvasMouseDown',
  CanvasMouseMove = 'CanvasMouseMove',
  CanvasMouseUp = 'CanvasMouseUp',
  CanvasMouseOut = 'CanvasMouseOut',
  CanvasScroll = 'CanvasScroll',

  WorldMouseDown = 'WorldMouseDown',
  WorldMouseMove = 'WorldMouseMove',
  WorldMouseUp = 'WorldMouseUp',
  WorldMouseOut = 'WorldMouseOut',
}

class UIEmitter extends EventEmitter {
  static instance: UIEmitter;

  private constructor() {
    super();
  }

  static getInstance(): UIEmitter {
    if (!UIEmitter.instance) {
      UIEmitter.instance = new UIEmitter();
    }

    return UIEmitter.instance;
  }

  static initialize(): UIEmitter {
    const uiEmitter = new UIEmitter();

    return uiEmitter;
  }
}

export default UIEmitter;
