import React, { useState, useEffect } from 'react';
import { WorldCoords } from '../../utils/Coordinates';
import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';
import styled from 'styled-components';

export function CoordsText() {
  const uiEmitter = UIEmitter.getInstance();
  const [coords, setCoords] = useState<WorldCoords | null>(null);

  useEffect(() => {
    uiEmitter.on(UIEmitterEvent.WorldMouseMove, setCoords);
    return () => {
      uiEmitter.removeListener(UIEmitterEvent.WorldMouseMove, setCoords);
    };
  }, [uiEmitter]);

  return (
    <span>
      {coords ? `(${Math.round(coords.x)}, ${Math.round(coords.y)})` : '(x, y)'}
    </span>
  );
}

const _CoordsPane = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 0.5em;
`;
export default function CoordsPane() {
  return (
    <_CoordsPane>
      <CoordsText />
    </_CoordsPane>
  );
}
