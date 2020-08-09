import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import styled from 'styled-components';
import dfstyles from '../../styles/dfstyles';
import WindowManager from '../../utils/WindowManager';
import { PaneProps } from '../GameWindowComponents';
import { GameWindowZIndex } from '../GameWindow';
import {
  HelpIcon,
  PlanetIcon,
  LeaderboardIcon,
  PlanetdexIcon,
  UpgradeIcon,
  TwitterIcon,
  BroadcastIcon,
} from '../Icons';

export const IconButton = styled.div`
  width: 1.5em;
  height: 1.5em;
  display: inline-flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;

  border-radius: 2px;
  border: 1px solid ${dfstyles.colors.text};

  transition: color 0.2s, background 0.2s;

  &:hover,
  &.active {
    background: ${dfstyles.colors.text};
    color: ${dfstyles.colors.background};
    & svg path {
      fill: ${dfstyles.colors.background};
    }
    cursor: pointer;
  }

  &:active {
    ${dfstyles.game.styles.active};
  }
`;

type ModalIconStateFn = (arg: ((b: boolean) => boolean) | boolean) => void;

export type ModalHook = [boolean, ModalIconStateFn];

export enum ModalName {
  Help,
  PlanetDetails,
  Leaderboard,
  PlanetDex,
  UpgradeDetails,
  TwitterVerification,
  TwitterBroadcast,
}

export function ModalIcon({
  modal,
  hook: [active, setActive],
}: {
  modal: ModalName;
  hook: ModalHook;
}) {
  const child = (): React.ReactNode => {
    if (modal === ModalName.Help) return <HelpIcon />;
    else if (modal === ModalName.PlanetDetails) return <PlanetIcon />;
    else if (modal === ModalName.Leaderboard) return <LeaderboardIcon />;
    else if (modal === ModalName.PlanetDex) return <PlanetdexIcon />;
    else if (modal === ModalName.UpgradeDetails) return <UpgradeIcon />;
    else if (modal === ModalName.TwitterVerification) return <TwitterIcon />;
    else if (modal === ModalName.TwitterBroadcast) return <BroadcastIcon />;
    return <span>T</span>;
  };

  return (
    <IconButton
      onClick={() => setActive((b) => !b)}
      className={active ? 'active' : undefined}
    >
      {child()}
    </IconButton>
  );
}

const _Modal = styled.div`
  position: absolute;
  width: fit-content;
  height: fit-content;
  background: ${dfstyles.colors.background};
  border-radius: 3px;
  border: 1px solid ${dfstyles.colors.text};
  z-index: ${GameWindowZIndex.Modal};

  & > div {
    padding: 0.5em;
  }

  display: flex;
  flex-direction: column;

  & .modal-header {
    width: 100%;
    height: 2.5em;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid ${dfstyles.colors.subtext};

    &:hover {
      background: ${dfstyles.colors.backgroundlight};
    }

    & > p {
      cursor: grab;
    }

    & > span {
      margin-right: 0.2em;
      transition: color 0.2s;

      line-height: 1.5em;

      &: hover {
        color: ${dfstyles.colors.subtext};
        cursor: pointer;
      }
    }
  }
  & .modal-container {
    margin-top: 4pt;
    width: fit-content;
    min-width: 18em;
    height: fit-content;
    min-height: 10em;
  }
`;

export type ModalProps = {
  hook: ModalHook;
  name: ModalName;
};

type Coords = { x: number; y: number };

export function ModalPane({
  children,
  title,
  hook: [visible, setVisible],
  name: _id,
}: PaneProps & ModalProps) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [delCoords, setDelCoords] = useState<Coords | null>(null);

  const [styleClicking, setStyleClicking] = useState<boolean>(false);

  const [zIndex, setZIndex] = useState<number>(GameWindowZIndex.Modal);

  const containerRef = useRef<HTMLDivElement>(document.createElement('div'));
  const headerRef = useRef<HTMLDivElement>(document.createElement('div'));

  const windowManager = WindowManager.getInstance();

  const clipX = (x, delX) => {
    let newLeft = x + delX;
    if (newLeft + containerRef.current.offsetWidth > window.innerWidth) {
      newLeft = window.innerWidth - containerRef.current.offsetWidth;
    } else if (newLeft < 0) newLeft = 0;
    return newLeft;
  };
  const getLeft = () => {
    if (!coords) return;
    if (!delCoords) return coords.x;
    return clipX(coords.x, delCoords.x);
  };
  const clipY = (y, delY) => {
    let newTop = y + delY;
    if (newTop + containerRef.current.offsetHeight > window.innerHeight) {
      newTop = window.innerHeight - containerRef.current.offsetHeight;
    } else if (newTop < 0) newTop = 0;
    return newTop;
  };
  const getTop = () => {
    if (!coords) return;
    if (!delCoords) return coords.y;
    return clipY(coords.y, delCoords.y);
  };

  useEffect(() => {
    if (!coords) return;

    const myCurrent = headerRef.current;
    let oldMouse: null | { x: number; y: number } = null;
    const myCoords = coords;
    let delX = 0;
    let delY = 0;

    const doMouseDown = (e) => {
      oldMouse = { x: e.clientX, y: e.clientY };
    };
    const doMouseUp = () => {
      if (!oldMouse) return; // is null, something messed up

      const newCoords = {
        x: clipX(myCoords.x, delX),
        y: clipY(myCoords.y, delY),
      };

      oldMouse = null;
      setDelCoords(null);
      setCoords(newCoords);
    };
    const doMouseMove = (e) => {
      if (!oldMouse) return; // is null, something messed up

      delX = e.clientX - oldMouse.x;
      delY = e.clientY - oldMouse.y;
      setDelCoords({ x: delX, y: delY });
    };

    myCurrent.addEventListener('mousedown', doMouseDown);
    window.addEventListener('mouseup', doMouseUp);
    window.addEventListener('mouseleave', doMouseUp);
    window.addEventListener('mousemove', doMouseMove);

    return () => {
      myCurrent.removeEventListener('mousedown', doMouseDown);
      window.removeEventListener('mouseup', doMouseUp);
      window.addEventListener('mouseleave', doMouseUp);
      window.removeEventListener('mousemove', doMouseMove);
    };
  }, [coords]);

  // inits at center
  useLayoutEffect(() => {
    const newX = 0.5 * (window.innerWidth - containerRef.current.offsetWidth);
    const newY = 0.5 * (window.innerHeight - containerRef.current.offsetHeight);
    setCoords({ x: newX, y: newY });
    setZIndex(windowManager.getIndex());
  }, [containerRef, windowManager]);

  // push to top
  useLayoutEffect(() => {
    setZIndex(windowManager.getIndex());
  }, [visible, windowManager]);

  return (
    <_Modal
      style={{
        left: getLeft() + 'px',
        top: getTop() + 'px',
        zIndex: visible ? zIndex : -1000,
      }}
      ref={containerRef}
      onMouseDown={(_e) => setZIndex(windowManager.getIndex())}
    >
      <div
        ref={headerRef}
        className='modal-header'
        style={{ cursor: styleClicking ? 'grabbing' : 'grab' }}
        // need these to prevent highlight shenanigans
        onMouseLeave={(_e) => {
          setStyleClicking(false);
        }}
        onClick={(e) => e.preventDefault()}
        onMouseUp={(e) => {
          e.preventDefault();
          setStyleClicking(false);
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          setStyleClicking(true);
        }}
      >
        <p>
          <u>{title}</u>
        </p>
        <span onClick={() => setVisible(false)}>X</span>
      </div>
      <div className='modal-container'>{children}</div>
    </_Modal>
  );
}
