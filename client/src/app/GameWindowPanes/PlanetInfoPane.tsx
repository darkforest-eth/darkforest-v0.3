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
import { TooltipTrigger } from './Tooltip';
import { TooltipName } from '../../utils/WindowManager';

const DataRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
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
  width: 22em;
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
    if (!uiManager || !selected) return 'No planet selected.';

    const planetname = getPlanetName(selected);
    const shorthash = getPlanetShortHash(selected);
    const shortaddress = getPlayerShortHash(selected.owner);

    if (selected.owner === emptyAddress)
      return `Unclaimed ${shorthash} ${planetname}`;
    if (selected.owner === account) return `${shorthash} ${planetname}`;

    const twitter = uiManager.getTwitter(selected.owner);
    if (!twitter) return `${shortaddress}'s ${shorthash} ${planetname}`;
    else return `@${twitter}'s ${shorthash} ${planetname}`;
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
            <TooltipTrigger name={TooltipName.Population} display='inline-flex'>
              <PopulationIcon />
            </TooltipTrigger>
            <TooltipTrigger name={TooltipName.SelectedPopulation}>
              <span>
                {getFormatProp(selected, 'population')} <Sub>/</Sub>{' '}
                {getFormatProp(selected, 'populationCap')}
              </span>
            </TooltipTrigger>
          </Data>
          <Data>
            <TooltipTrigger name={TooltipName.Silver} display='inline-flex'>
              <SilverIcon />
            </TooltipTrigger>
            <TooltipTrigger name={TooltipName.SelectedSilver}>
              <span>
                {getFormatProp(selected, 'silver')} <Sub>/</Sub>{' '}
                {getFormatProp(selected, 'silverMax')}
              </span>
            </TooltipTrigger>
          </Data>
        </DataRow>
      </PlanetInfoWrapper>
    </ToolbarPane>
  );
}
