import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useCallback,
} from 'react';
import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';
import Viewport from './Viewport';
import CanvasRenderer from './CanvasRenderer';
import GameUIManagerContext from './GameUIManagerContext';
import GameUIManager from './GameUIManager';
import WindowManager, {
  CursorState,
  WindowManagerEvent,
} from '../../utils/WindowManager';

export default function ControllableCanvas() {
  // html canvas element width and height. viewport dimensions are tracked by viewport obj
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const uiEmitter: UIEmitter = UIEmitter.getInstance();
  const gameUIManager = useContext<GameUIManager | null>(GameUIManagerContext);

  const windowManager = WindowManager.getInstance();
  const [targeting, setTargeting] = useState<boolean>(false);

  useEffect(() => {
    const updateTargeting = (newstate) => {
      setTargeting(newstate === CursorState.Targeting);
    };
    windowManager.on(WindowManagerEvent.StateChanged, updateTargeting);
    return () => {
      windowManager.removeListener(
        WindowManagerEvent.StateChanged,
        updateTargeting
      );
    };
  }, [windowManager]);

  const doResize = useCallback(() => {
    if (canvasRef.current) {
      setWidth(canvasRef.current.clientWidth);
      setHeight(canvasRef.current.clientHeight);
      uiEmitter.emit(UIEmitterEvent.WindowResize);
    }
  }, [uiEmitter]);

  useLayoutEffect(() => {
    if (canvasRef.current) doResize();
  }, [
    // dep array gives eslint issues, but it's fine i tested it i swear - Alan
    canvasRef,
    doResize,
    /* eslint-disable react-hooks/exhaustive-deps */
    canvasRef.current?.offsetWidth,
    canvasRef.current?.offsetHeight,
    /* eslint-enable react-hooks/exhaustive-deps */
  ]);

  useEffect(() => {
    if (gameUIManager) {
      function onResize() {
        doResize();
        uiEmitter.emit(UIEmitterEvent.WindowResize);
      }

      function onWheel(e: WheelEvent) {
        e.preventDefault();
        const { deltaY } = e;
        uiEmitter.emit(UIEmitterEvent.CanvasScroll, deltaY);
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        console.error('');
        return () => {};
      }

      Viewport.initialize(gameUIManager, 250, canvas);

      CanvasRenderer.initialize(canvas, gameUIManager);
      // We can't attach the wheel event onto the canvas due to:
      // https://www.chromestatus.com/features/6662647093133312
      canvas.addEventListener('wheel', onWheel);
      window.addEventListener('resize', onResize);

      uiEmitter.on(UIEmitterEvent.UIChange, doResize);

      return () => {
        Viewport.destroyInstance();
        CanvasRenderer.destroyInstance();
        canvas.removeEventListener('wheel', onWheel);
        window.removeEventListener('resize', onResize);
        uiEmitter.removeListener(UIEmitterEvent.UIChange, doResize);
      };
    }
  }, [gameUIManager, uiEmitter, doResize]);

  if (!gameUIManager) {
    console.error('GameUIManager context is null');
    return <div />;
  }

  function onMouseEvent(
    emitEventName: UIEmitterEvent,
    mouseEvent: React.MouseEvent
  ) {
    if (!canvasRef.current) {
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = mouseEvent.clientX - rect.left;
    const canvasY = mouseEvent.clientY - rect.top;
    uiEmitter.emit(emitEventName, { x: canvasX, y: canvasY });
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        cursor: targeting ? 'crosshair' : undefined,
      }}
    >
      <canvas
        style={{
          width: '100%',
          height: '100%',
        }}
        id='mycanvas'
        onMouseDown={(e) => {
          onMouseEvent(UIEmitterEvent.CanvasMouseDown, e);
        }}
        onMouseMove={(e) => {
          onMouseEvent(UIEmitterEvent.CanvasMouseMove, e);
        }}
        onMouseUp={(e) => {
          onMouseEvent(UIEmitterEvent.CanvasMouseUp, e);
        }}
        onMouseOut={() => {
          uiEmitter.emit(UIEmitterEvent.CanvasMouseOut);
        }}
        ref={canvasRef}
        width={width}
        height={height}
      />
    </div>
  );
}
