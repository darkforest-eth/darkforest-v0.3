import React from 'react';
import styled from 'styled-components';
import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';
import dfstyles from '../../styles/dfstyles';

const _ZoomPane = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.5em;
  padding-top: 0;
  margin-top: 0;
  display: flex;
  font-size: 1.5em;
  flex-direction: row;
  justify-content: flex-end;
  & > a:first-child {
    margin-right: 0.75em;
  }
  & > a {
    &:hover {
      color ${dfstyles.colors.subtext};
      cursor: pointer;
    }
    &:active {
      color ${dfstyles.colors.subbertext};
    }
  }
`;
export default function ZoomPane() {
  const uiEmitter = UIEmitter.getInstance();
  return (
    <_ZoomPane>
      <a onClick={() => uiEmitter.emit(UIEmitterEvent.ZoomOut)}>-</a>
      <a onClick={() => uiEmitter.emit(UIEmitterEvent.ZoomIn)}>+</a>
    </_ZoomPane>
  );
}
