import styled from 'styled-components';
import dfstyles from '../styles/dfstyles';
import React from 'react';
import { InitRenderState } from './GameLandingPage';

export function Wrapper({ children, initRender }: LandingWrapperProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        margin: '0',
        padding: '0',
        display: 'flex',
        flexDirection: 'row',
        justifyContent:
          initRender !== InitRenderState.NONE
            ? 'space-between'
            : 'space-around',
      }}
    >
      {children}
    </div>
  );
}

type LandingWrapperProps = {
  children: React.ReactNode;
  initRender: InitRenderState;
};

export function TerminalWrapper({ children, initRender }: LandingWrapperProps) {
  const stylesNoInit = {
    maxWidth: '60em',
    width: '60%',
    padding: '2em 0',
    fontSize: dfstyles.fontSizeS,
  } as React.CSSProperties;

  const stylesInit = {
    position: 'absolute',
    width: dfstyles.game.terminalWidth,
    right: '0',
    top: '0',
    padding: '1em',
    fontSize: dfstyles.game.terminalFontSize,
  } as React.CSSProperties;
  return (
    <div
      style={{
        ...(initRender !== InitRenderState.NONE ? stylesInit : stylesNoInit),
        height: '100%',
        overflow: 'hidden',
        background: dfstyles.colors.background,
      }}
      className='terminal-wrapper'
    >
      {children}
    </div>
  );
}

export function GameWindowWrapper({
  children,
  initRender,
}: LandingWrapperProps) {
  return (
    <div
      style={{
        display: initRender !== InitRenderState.NONE ? 'block' : 'none',
        background: dfstyles.colors.background,
        position: 'absolute',
        left: 0,
        top: 0,
        width: `calc(100% - ${dfstyles.game.terminalWidth})`,
        height: '100%',
        borderRight: `1px solid ${dfstyles.colors.text}`,
      }}
    >
      {initRender && <>{children}</>}
    </div>
  );
}

export const Hidden = styled.div`
  display: none;
  position: absolute;
  top: -10000;
  left: -10000;
`;
