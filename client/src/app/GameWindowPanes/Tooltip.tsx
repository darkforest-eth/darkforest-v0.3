import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import dfstyles from '../../styles/dfstyles';
import WindowManager, {
  TooltipName,
  WindowManagerEvent,
} from '../../utils/WindowManager';
import { GameWindowZIndex } from '../GameWindow';

// activate TooltipName on mouseenter, deactivate on mouse leave
type TooltipProps = {
  children: React.ReactNode;
  name: TooltipName;
  needsShift?: boolean;
  display?: 'inline' | 'block' | 'inline-block' | 'inline-flex' | 'flex';
  style?: React.CSSProperties;
};

const fadeShift = keyframes`
  from {
    background: ${dfstyles.colors.dfblue}; 
  }
  to {
    background: ${dfstyles.colors.backgroundlight};
  }
`;

type TriggerProps = {
  anim?: boolean;
};

const animation = css`
  animation: ${fadeShift} 1s ${dfstyles.game.styles.animProps};
`;

const _TooltipTrigger = styled.span`
  border-radius: 2px;
  transition: background 0.2s;
  ${(props: TriggerProps) => (props.anim ? animation : 'animation: none;')}
`;

export function TooltipTrigger({
  children,
  name,
  needsShift,
  display,
  style,
}: TooltipProps) {
  // the model for this is a state machine on the state of {shift, hovering}
  const [shift, setShift] = useState<boolean>(false);
  const [hovering, setHovering] = useState<boolean>(false);

  const [pushed, setPushed] = useState<boolean>(false);

  const windowManager = WindowManager.getInstance();

  useEffect(() => {
    const doShiftDown = () => setShift(true);
    const doShiftUp = () => setShift(false);

    windowManager.on(WindowManagerEvent.ShiftDown, doShiftDown);
    windowManager.on(WindowManagerEvent.ShiftUp, doShiftUp);
    return () => {
      windowManager.removeListener(WindowManagerEvent.ShiftDown, doShiftDown);
      windowManager.removeListener(WindowManagerEvent.ShiftUp, doShiftUp);
    };
  }, [windowManager]);

  // manage state machine
  useEffect(() => {
    const getShift = () => {
      if (!needsShift) return true;
      else return shift;
    };

    if (!pushed) {
      // not pushed yet
      if (hovering && getShift()) {
        windowManager.pushTooltip(name);
        setPushed(true);
      }
    } else {
      // is pushed already
      if (!hovering || !getShift()) {
        windowManager.popTooltip();
        setPushed(false);
      }
    }
  }, [hovering, shift, pushed, windowManager, name, needsShift]);

  return (
    <_TooltipTrigger
      style={{
        ...style,
        display: display || 'inline',
      }}
      anim={shift}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {children}
    </_TooltipTrigger>
  );
}

const _TooltipPane = styled.div``;
export function TooltipPane({
  children,
  name,
}: {
  children: React.ReactNode;
  name: TooltipName;
}) {
  const [visible, setVisible] = useState<boolean>(false);
  const windowManager = WindowManager.getInstance();
  useEffect(() => {
    const checkTooltip = () => {
      const current = windowManager.getTooltip();
      if (current === name) setVisible(true);
      else setVisible(false);
    };
    windowManager.on(WindowManagerEvent.TooltipUpdated, checkTooltip);
    return () => {
      windowManager.removeListener(
        WindowManagerEvent.TooltipUpdated,
        checkTooltip
      );
    };
  }, [windowManager, name]);

  return (
    <_TooltipPane style={{ display: visible ? 'block' : 'none' }}>
      {children}
    </_TooltipPane>
  );
}

const _Tooltip = styled.div`
  position: absolute;
  width: fit-content;
  height: fit-content;
  min-height: 1em;
  min-width: 5em;
  border: 1px solid ${dfstyles.colors.text};
  background: ${dfstyles.colors.background};
  padding: 0.5em;
  border-radius: 3px;

  z-index: ${GameWindowZIndex.Tooltip};
`;

export default function Tooltip({ children }: { children: React.ReactNode }) {
  const [top, setTop] = useState<number>(0);
  const [left, setLeft] = useState<number>(0);

  const [visible, setVisible] = useState<boolean>(false);

  const windowManager = WindowManager.getInstance();

  const [leftOffset, setLeftOffset] = useState<number>(10);
  const [topOffset, setTopOffset] = useState<number>(10);

  const elRef = useRef<HTMLDivElement>(document.createElement('div'));
  const [height, setHeight] = useState<number>(20);
  const [width, setWidth] = useState<number>(20);

  useEffect(() => {
    const doMouseMove = (e) => {
      setLeft(e.clientX);
      setTop(e.clientY);
    };

    const checkTooltip = () => {
      const current = windowManager.getTooltip();
      if (current === TooltipName.None) setVisible(false);
      else setVisible(true);
    };

    window.addEventListener('mousemove', doMouseMove);
    windowManager.on(WindowManagerEvent.TooltipUpdated, checkTooltip);

    return () => {
      window.removeEventListener('mousemove', doMouseMove);
      windowManager.removeListener(
        WindowManagerEvent.TooltipUpdated,
        checkTooltip
      );
    };
  }, [windowManager, height, width]);

  useLayoutEffect(() => {
    setHeight(elRef.current.offsetHeight);
    setWidth(elRef.current.offsetWidth);
  }, [elRef.current.offsetHeight, elRef, visible]);

  useLayoutEffect(() => {
    if (left < window.innerWidth / 2) {
      setLeftOffset(10);
    } else {
      setLeftOffset(-10 - width);
    }

    if (top < window.innerHeight / 2) {
      setTopOffset(10);
    } else {
      setTopOffset(-10 - height);
    }
  }, [left, top, width, height]);

  return (
    <_Tooltip
      ref={elRef}
      onMouseEnter={(e) => e.preventDefault()}
      onMouseLeave={(e) => e.preventDefault()}
      style={{
        top: `${top + topOffset}px`,
        left: `${left + leftOffset}px`,
        display: visible ? 'block' : 'none',
      }}
    >
      {children}
    </_Tooltip>
  );
}
