import React, { useContext, useState, useEffect } from 'react';
import { Planet } from '../../_types/global/GlobalTypes';
import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';

import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import styled from 'styled-components';
import { emptyAddress } from '../../utils/CheckedTypeUtils';

const TRight = styled.p`
  text-align: right;
`;

export default function DetailsWindow() {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);

  const [planet, setPlanet] = useState<Planet | null>(null);

  useEffect(() => {
    const update = () => {
      if (!uiManager) {
        console.error('GameUIManager context is null');
        return;
      }
      const selectedPlanet = uiManager.getSelectedPlanet();
      setPlanet(selectedPlanet);
    };
    const uiEmitter = UIEmitter.getInstance();
    uiEmitter.on(UIEmitterEvent.GamePlanetSelected, update);
    // this.frameRequestId = window.requestAnimationFrame(this.animate);

    return () => {
      const uiEmitter = UIEmitter.getInstance();
      uiEmitter.removeListener(UIEmitterEvent.GamePlanetSelected, update);

      // if (this.frameRequestId) window.cancelAnimationFrame(this.frameRequestId);
    };
  }, [uiManager]);

  const getOwner: () => string = () => {
    const owner = planet ? planet.owner : emptyAddress;
    const unformatted = owner ? owner : emptyAddress;

    return unformatted.slice(0, 6) + '...' + unformatted.slice(-3);
  };

  const getPopulation: () => string = () => {
    return planet ? Math.round(planet.population).toString() : '0';
  };
  const getSilver: () => string = () => {
    return planet ? Math.round(planet.silver).toString() : '0';
  };

  // TODO this is bad because Typescript won't complain if the prop doesn't exist
  const getProp: (string) => number = (prop) => {
    return planet ? planet[prop] : 0;
  };

  return planet ? (
    <table style={{ width: '100%' }}>
      <tr>
        <td>Owner</td>
        <TRight>{getOwner()}</TRight>
      </tr>
      <tr>
        <td>Population</td>
        <TRight>
          {getPopulation()}/{Math.floor(getProp('populationCap'))}
        </TRight>
      </tr>
      <tr>
        <td>&nbsp;&nbsp;Growth</td>
        <TRight>{Math.floor(getProp('populationGrowth'))}</TRight>
      </tr>
      <tr>
        <td>Silver</td>
        <TRight>
          {getSilver()}/{getProp('silverCap')}
        </TRight>
      </tr>
      <tr>
        <td>&nbsp;&nbsp;Growth</td>
        <TRight>{getProp('silverGrowth').toFixed(2)}</TRight>
      </tr>
      <tr>
        <td>Max Silver</td>
        <TRight>{getProp('maxSilver')}</TRight>
      </tr>
      <tr>
        <td>Range</td>
        <TRight>{getProp('range')}</TRight>
      </tr>
    </table>
  ) : (
    <div>Select a planet to view details.</div>
  );
}
