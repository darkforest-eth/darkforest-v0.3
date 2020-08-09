import React, { useState, useContext, useEffect } from 'react';
import { ToolbarPane } from '../GameWindowComponents';
import styled from 'styled-components';
import { Sub } from '../../components/Text';
import { PlanetScape } from './PlanetScape';
import { Planet, EthAddress } from '../../_types/global/GlobalTypes';
import { SilverIcon, PopulationIcon } from '../Icons';
import {
  getFormatProp,
  getPlanetShortHash,
  getPlayerShortHash,
} from '../../utils/Utils';
import { ModalHook, ModalName } from './ModalPane';
import { emptyAddress } from '../../utils/CheckedTypeUtils';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { getPlanetName } from '../../utils/ProcgenUtils';

const DataRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  & > div:last-child {
    margin-left: 1.5em;
  }
`;

const Data = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  & > span:last-child {
    margin-left: 0.5em;
  }
`;

const PlanetInfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  width: 20em;
  overflow-y: hidden;
`;

const PlanetscapeWrapper = styled.div`
  flex-grow: 1;
  position: relative;
`;
export default function PlanetInfoPane({
  selected,
  hook,
}: {
  selected: Planet | null;
  hook: ModalHook;
}) {
  const [account, setAccount] = useState<EthAddress | null>(null);
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  useEffect(() => {
    if (!uiManager) return;
    setAccount(uiManager.getAccount());
  }, [uiManager]);

  const planetName = (): string => {
    if (!uiManager) return 'No planet selected.';
    if (!selected) return 'No planet selected.';
    const planetname = getPlanetName(selected);
    const shorthash = getPlanetShortHash(selected);
    const shortaddress = getPlayerShortHash(selected.owner);

    if (selected.owner === emptyAddress) return `Unclaimed ${shorthash}`;
    if (selected.owner === account) return `${shorthash} ${planetname}`;

    const twitter = uiManager.getTwitter(selected.owner);
    if (!twitter) return `${shortaddress}'s ${shorthash}`;
    else return `@${twitter}'s ${shorthash}`;
  };

  return (
    <ToolbarPane
      title={planetName()}
      hook={hook}
      modal={ModalName.PlanetDetails}
    >
      <PlanetInfoWrapper>
        <PlanetscapeWrapper>
          <PlanetScape planet={selected} />
        </PlanetscapeWrapper>

        <DataRow>
          <Data>
            <PopulationIcon />
            <span>
              {getFormatProp(selected, 'population')} <Sub>/</Sub>{' '}
              {getFormatProp(selected, 'populationCap')}
            </span>
          </Data>
          <Data>
            <SilverIcon />
            <span>
              {getFormatProp(selected, 'silver')} <Sub>/</Sub>{' '}
              {getFormatProp(selected, 'silverMax')}
            </span>
          </Data>
        </DataRow>
      </PlanetInfoWrapper>
    </ToolbarPane>
  );
}
