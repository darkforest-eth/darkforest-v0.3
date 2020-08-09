import React, { useContext, useState, useEffect } from 'react';
import { Planet, EthAddress } from '../../_types/global/GlobalTypes';
import { ToolbarPane } from '../GameWindowComponents';
import dfstyles from '../../styles/dfstyles';
import styled from 'styled-components';
import { Sub } from '../../components/Text';
import {
  getPlanetTagline,
  getPlanetBlurb,
  getPlanetBlurb2,
} from '../../utils/ProcgenUtils';
import { ModalName, ModalHook } from './ModalPane';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';

const PlanetFlavorWrapper = styled.div`
  width: 24em;

  & .blurb {
    line-height: 1.25em;
    margin-top: 0.2em;
  }
`;
export default function PlanetFlavorPane({
  selected,
  hook,
}: {
  selected: Planet | null;
  hook: ModalHook;
}) {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const [account, setAccount] = useState<EthAddress | null>(null);
  useEffect(() => {
    if (!uiManager) return;
    setAccount(uiManager.getAccount());
  }, [uiManager]);

  return (
    <ToolbarPane
      title='Planet Lore'
      headerStyle={{ color: dfstyles.colors.subtext }}
      hook={hook}
      modal={ModalName.PlanetDetails}
    >
      <PlanetFlavorWrapper>
        <p>
          <em>
            {selected
              ? `A ${getPlanetTagline(selected)}`
              : getPlanetTagline(selected)}
            ...
          </em>
        </p>
        <p className='blurb'>
          <Sub>{getPlanetBlurb(selected)}</Sub>
        </p>

        <p className='blurb' style={{ marginTop: '0.5em' }}>
          {selected ? (
            selected.owner === account ? (
              <Sub>{getPlanetBlurb2(selected)}</Sub>
            ) : (
              <Sub>
                <em>Capture this planet to read more...</em>
              </Sub>
            )
          ) : null}
        </p>
      </PlanetFlavorWrapper>
    </ToolbarPane>
  );
}
