import React, { useState, useLayoutEffect } from 'react';
import styled from 'styled-components';
import dfstyles from '../styles/dfstyles';
import { GameWindowZIndex } from './GameWindow';
import UIEmitter, { UIEmitterEvent } from '../utils/UIEmitter';
import { ModalHook, ModalName, ModalIcon } from './GameWindowPanes/ModalPane';

export const WindowWrapper = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: ${dfstyles.colors.background};
  height: 100%;
  width: 100%;

  font-size: ${dfstyles.game.fontSize};
`;

const _Sidebar = styled.div`
  width: fit-content;
  min-width: 1px;
  height: 100%:
  background: ${dfstyles.colors.background};
  position: relative;
`;

const Pane = styled.div`
  padding: 8pt;

  &.sidebar-pane {
    border-bottom: 1px solid ${dfstyles.colors.subtext};
    width: 14em;
    & .pane-header > div > a {
      font-size: 1.5em;
      line-height: 1em;
      color: ${dfstyles.colors.subtext};

      &:hover {
        color: ${dfstyles.colors.text};
        cursor: pointer;
      }
    }
    // for extra header items
    & .pane-header > div {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      & > span,
      & > a {
        margin-left: 0.5em;
        &:first-child {
          margin-left: 0;
        }
      }
    }
  }

  display: flex;
  flex-direction: column;

  &.toolbar-pane {
    justify-content: space-between;
    height: 100%;
    & .pane-content {
      flex-grow: 1;
      overflow-y: auto;
    }
    border-right: 1px solid ${dfstyles.colors.subtext};
  }

  // technically not needed but semantically better
  & .pane-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 1.5em;

    & > p {
      text-decoration: underline;
      line-height: 1em;
    }
  }
  & .pane-content {
    position: relative;
    margin-top: 4pt;
  }
`;

const TOGGLER_WIDTH = '1em';
const _Toggler = styled.div`
  height: 100%;
  width: ${TOGGLER_WIDTH};
  right: -${TOGGLER_WIDTH};
  background: ${dfstyles.colors.text};
  color: ${dfstyles.colors.background};
  position: absolute;
  z-index: ${GameWindowZIndex.Toggler};
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;

  transition: opacity 0.2s;
  opacity: 0;

  &:hover {
    opacity: 1;
    cursor: pointer;
  }

  & span {
    font-size: 1.25em;
    transform: scaleY(2);
  }
`;

export function Toggler({
  sidebarVisible,
  onClick,
}: {
  sidebarVisible: boolean;
  onClick: () => void;
}) {
  return (
    <_Toggler onClick={onClick}>
      <span>{sidebarVisible ? '<' : '>'}</span>
    </_Toggler>
  );
}

const SidebarContent = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
`;

export function Sidebar({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState<boolean>(true);
  const uiEmitter = UIEmitter.getInstance();

  // it's pretty possible we don't actually need this
  useLayoutEffect(() => {
    uiEmitter.emit(UIEmitterEvent.UIChange);
  }, [visible, uiEmitter]);

  const visibleStyles = {
    position: 'relative',
    left: '0',
    borderRight: `1px solid ${dfstyles.colors.text}`,
  } as React.CSSProperties;
  const hiddenStyles = {
    position: 'absolute',
    left: '-1000px',
  } as React.CSSProperties;

  return (
    <_Sidebar>
      <Toggler sidebarVisible={visible} onClick={() => setVisible((v) => !v)} />
      <SidebarContent style={visible ? visibleStyles : hiddenStyles}>
        {children}
      </SidebarContent>
    </_Sidebar>
  );
}
export type PaneProps = {
  children: React.ReactNode;
  title: string;
  headerStyle?: React.CSSProperties;
};

const _PlanetSelectMessage = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-around;

  & p {
    text-align: center;
    width: 20em;
    margin: 0 auto;
  }
`;

export const PlanetSelectMessage = () => (
  <_PlanetSelectMessage>
    <p>Please select a planet to view.</p>
  </_PlanetSelectMessage>
);

const _ModalWrapper = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  // z-index: -1;
  overflow: hidden;
`;

export function ModalWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// no-op on header style
export function SidebarPane({
  children,
  title,
  headerItems,
}: PaneProps & { headerItems?: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  return (
    <Pane className='sidebar-pane'>
      <div className='pane-header'>
        <p>{title}</p>
        <div>
          {headerItems}
          <a onClick={() => setCollapsed((b) => !b)}>{collapsed ? '+' : '-'}</a>
        </div>
      </div>

      {!collapsed && <div className='pane-content'>{children}</div>}
    </Pane>
  );
}

export const MainWindow = styled.div`
  height: calc(100% - ${dfstyles.game.toolbarHeight});
  width: 100%;
  position: absolute;
  top: 0;
  background: ${dfstyles.colors.background};
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

export const CanvasContainer = styled.div`
  flex-grow: 1;
  position: relative;
`;

export const CanvasWrapper = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
`;

export const MenuBar = styled.div`
  position: absolute;
  background: ${dfstyles.colors.background};
  z-index: ${GameWindowZIndex.MenuBar};
  top: 0;
  left: 0;
  padding: 0.5em;
  width: fit-content;
  border-right: 1px solid ${dfstyles.colors.text};
  border-bottom: 1px solid ${dfstyles.colors.text};

  display: flex;
  flex-direction: row;

  & > span {
    margin-left: 4pt;
    &:first-child {
      margin-left: 0;
    }
  }
`;

// TODO clean this up
export const Btn = styled.span`
  display: inline-block;
  border-radius: 3px;
  padding: 0 0.3em;
  border: 1px solid ${dfstyles.colors.text};
  transition: background 0.2s, colors 0.2s;
  &:hover {
    color: ${dfstyles.colors.background};
    background: ${dfstyles.colors.text};
    cursor: pointer;
  }
  &:active {
    ${dfstyles.game.styles.active};
  }

  &.btn-disabled,
  &.btn-disabled:hover,
  &.btn-disabled:active {
    color: ${dfstyles.colors.subtext};
    background: none;
    border: 1px solid ${dfstyles.colors.subtext};
    cursor: default;
    filter: none;
  }
`;

const _Toolbar = styled.div`
  height: ${dfstyles.game.toolbarHeight};
  width: 100%;
  position: absolute;
  bottom: 0;
  background: ${dfstyles.colors.background};

  border-top: 1px solid ${dfstyles.colors.text};
  display: flex;
  flex-direction: row;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  scrollbar-height: none;
`;
export function Toolbar({ children }: { children: React.ReactNode }) {
  return <_Toolbar>{children}</_Toolbar>;
}

// TODO roll this in under Toolbar? also maybe share styles with sidebarpanes
export function ToolbarPane({
  children,
  title,
  headerStyle = undefined,
  hook,
  modal,
}: PaneProps & { hook: ModalHook; modal: ModalName }) {
  return (
    <Pane className='toolbar-pane'>
      <div className='pane-header'>
        <p style={headerStyle}>{title}</p>
        <a>
          <ModalIcon modal={modal} hook={hook} />
        </a>
      </div>
      <div className='pane-content'>{children}</div>
    </Pane>
  );
}
