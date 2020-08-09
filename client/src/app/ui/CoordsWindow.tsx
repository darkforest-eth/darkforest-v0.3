import React, { useState, useEffect } from 'react';
import { WorldCoords } from '../../utils/Coordinates';
import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';
import { CSSProperties } from 'styled-components';

export default function CoordsWindow(props: { style?: CSSProperties }) {
  const uiEmitter = UIEmitter.getInstance();
  const [coords, setCoords] = useState<WorldCoords | null>(null);

  useEffect(() => {
    uiEmitter.on(UIEmitterEvent.WorldMouseMove, setCoords);
    return () => {
      uiEmitter.removeListener(UIEmitterEvent.WorldMouseMove, setCoords);
    };
  }, [uiEmitter]);

  return (
    <span style={props.style}>
      {coords ? `(${Math.round(coords.x)}, ${Math.round(coords.y)})` : ''}
    </span>
  );
}
