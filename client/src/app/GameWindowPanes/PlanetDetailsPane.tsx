import React, { useContext, useState, useEffect } from 'react';
import { PlanetSelectMessage, Btn } from '../GameWindowComponents';
import {
  Planet,
  PlanetResource,
  EthAddress,
  Bonus,
  StatIdx,
} from '../../_types/global/GlobalTypes';
import { PlanetScape } from './PlanetScape';
import styled from 'styled-components';
import { Sub, Green } from '../../components/Text';
import {
  getFormatProp,
  formatNumber,
  getPlanetShortHash,
  bonusFromHex,
} from '../../utils/Utils';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { ModalPane, ModalHook, ModalName } from './ModalPane';
import { getPlanetName } from '../../utils/ProcgenUtils';
import { emptyAddress } from '../../utils/CheckedTypeUtils';
import { TooltipTrigger } from './Tooltip';
import { TooltipName } from '../../utils/WindowManager';

const PlanetscapeWrapper = styled.div`
  width: 100%;
  height: 180px;
`;

const DetailsTable = styled.table`
  margin-top: 0.5em;

  & tr > td {
    &:nth-child(2n) {
      text-align: right;
    }
    &:nth-child(3) {
      padding-left: 1em;
    }
  }

  & tr {
    padding: 0;
    margin: 0;
    line-height: 1.25em;
  }
  // this boi will define width
  width: 30em;
`;
const TimesTwo = () => (
  <TooltipTrigger name={TooltipName.Bonus}>
    <Green>x2</Green>
  </TooltipTrigger>
);

export default function PlanetDetailsPane({
  selected,
  hook,
}: {
  selected: Planet | null;
  hook: ModalHook;
}) {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const [account, setAccount] = useState<EthAddress | null>(null); // consider moving this one to parent
  const [planetOwnerTwitter, setPlanetOwnerTwitter] = useState<string | null>(
    null
  );

  const [bonus, setBonus] = useState<Bonus | null>(null);

  // sync selected with bonus
  useEffect(() => {
    if (!selected) setBonus(null);
    else setBonus(bonusFromHex(selected.locationId));
  }, [selected]);

  useEffect(() => {
    if (!uiManager) return;
    setAccount(uiManager.getAccount());
  }, [uiManager]);

  useEffect(() => {
    if (!uiManager || !account) return;
    if (!selected) {
      setPlanetOwnerTwitter(null);
      return;
    }
    setPlanetOwnerTwitter(uiManager.getTwitter(selected.owner));
  }, [uiManager, selected, account]);

  if (!uiManager) return <>ERROR: UIManager NULL</>;
  // total length 40 - 3 = 37
  const formatLocId = (loc: string): string => {
    return '0x' + loc.slice(0, 35) + '...' + loc.slice(-2);
  };
  const formatOwner = (owner: string): string => {
    return owner;
  };

  const formatTimeUntil = (timeSeconds: number | null) => {
    if (timeSeconds === null || Number.isNaN(timeSeconds)) {
      return '0s';
    }
    const nowSeconds = Date.now() / 1000;
    if (nowSeconds > timeSeconds) {
      return '0s';
    }
    return `${Math.floor(timeSeconds - nowSeconds)}s`;
  };

  const getPop = (p) => {
    if (selected?.owner === emptyAddress) return 0;
    return formatTimeUntil(
      selected ? uiManager.getPopulationCurveAtPercent(selected, p) : 0
    );
  };
  const getSilver = (p) => {
    if (selected?.owner === emptyAddress) return 0;
    return formatTimeUntil(
      selected ? uiManager.getSilverCurveAtPercent(selected, p) : 0
    );
  };

  const getLoc = (): string => {
    if (!selected) return '(0, 0)';
    const loc = uiManager.getLocationOfPlanet(selected.locationId);
    if (!loc) return '(0, 0)';
    return `(${loc.coords.x}, ${loc.coords.y})`;
  };

  const windowName = (): string => {
    const str = 'Planet Details';
    if (!uiManager) return str;
    if (!selected || !account) return str;
    const planetname = getPlanetName(selected);
    const shorthash = getPlanetShortHash(selected);
    const twitter = uiManager.getTwitter(selected.owner);

    if (selected.owner === emptyAddress)
      return `Unclaimed ${shorthash} ${planetname} - ${str}`;

    if (!twitter) return `${shorthash} ${planetname} - ${str}`;
    else return `@${twitter}'s ${shorthash} ${planetname} - ${str}`;
  };

  const sharePlanet = (): void => {
    const str = `I found an awesome level ${
      selected?.planetLevel
    } planet named ${getPlanetName(
      selected
    )}! @darkforest_eth (https://zkga.me/planet${selected?.locationId})`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURI(
        str
      )}&hashtags=darkforest`
    );
  };

  return (
    <ModalPane hook={hook} title={windowName()} name={ModalName.PlanetDetails}>
      <div
        style={{
          display: selected ? 'none' : 'block',
        }}
      >
        <PlanetSelectMessage />
      </div>
      <div
        style={{
          opacity: selected ? '1' : '0',
          pointerEvents: selected ? 'auto' : 'none',
          // display: selected ? 'block' : 'none',
        }}
      >
        <PlanetscapeWrapper>
          <PlanetScape planet={selected} />
        </PlanetscapeWrapper>
        <DetailsTable>
          <tbody>
            <tr>
              <td>
                <Sub>Owner</Sub>
              </td>
              <td>
                {selected
                  ? planetOwnerTwitter
                    ? '@' + planetOwnerTwitter
                    : formatOwner(selected.owner)
                  : '0'}
              </td>
            </tr>
            <tr>
              <td>
                <Sub>Location ID</Sub>
              </td>
              <td>{selected ? formatLocId(selected.locationId) : '0'}</td>
            </tr>
          </tbody>
        </DetailsTable>
        <DetailsTable>
          <tbody>
            <tr>
              <td>
                <Sub>Level</Sub>
              </td>
              <td>{selected ? selected.planetLevel : 0}</td>
              <td>
                <Sub>Coordinates</Sub>
              </td>
              <td>{getLoc()}</td>
            </tr>
          </tbody>
        </DetailsTable>
        <DetailsTable>
          <tbody>
            <tr>
              <td>
                <Sub>
                  <TooltipTrigger name={TooltipName.Population} needsShift>
                    Population
                  </TooltipTrigger>{' '}
                  {bonus && bonus[StatIdx.PopCap] && <TimesTwo />}
                </Sub>
              </td>
              <td>
                {selected?.owner === emptyAddress && selected.population > 0 ? (
                  <TooltipTrigger
                    name={TooltipName.Pirates}
                    display='inline-flex'
                  >
                    <span>{getFormatProp(selected, 'population')}</span>
                  </TooltipTrigger>
                ) : (
                  <>{getFormatProp(selected, 'population')}</>
                )}{' '}
                <Sub>/</Sub> {getFormatProp(selected, 'populationCap')}
              </td>
              <td>
                <Sub>
                  <TooltipTrigger
                    name={TooltipName.PopulationGrowth}
                    needsShift
                  >
                    Growth {bonus && bonus[StatIdx.PopGro] && <TimesTwo />}
                  </TooltipTrigger>
                </Sub>
              </td>
              <td>{getFormatProp(selected, 'populationGrowth')}</td>
            </tr>
            <tr>
              <td>
                <TooltipTrigger name={TooltipName.Time50} needsShift>
                  <Sub>Time to 50%</Sub>
                </TooltipTrigger>
              </td>
              <td>{getPop(50)}</td>
              <td>
                <TooltipTrigger name={TooltipName.Time90} needsShift>
                  <Sub>Time to 90%</Sub>
                </TooltipTrigger>
              </td>
              <td>{getPop(90)}</td>
            </tr>
          </tbody>
        </DetailsTable>
        {selected && selected.planetResource === PlanetResource.SILVER && (
          <DetailsTable>
            <tbody>
              <tr>
                <td>
                  <Sub>
                    <TooltipTrigger name={TooltipName.Silver} needsShift>
                      Silver
                    </TooltipTrigger>{' '}
                    {bonus && bonus[StatIdx.ResCap] && <TimesTwo />}
                  </Sub>
                </td>
                <td>
                  {getFormatProp(selected, 'silver')} <Sub>/</Sub>{' '}
                  {getFormatProp(selected, 'silverMax')}
                </td>
                <td>
                  <Sub>Growth</Sub>
                </td>
                <td>{getFormatProp(selected, 'silverGrowth')}</td>
              </tr>
              <tr>
                <td>
                  <Sub>
                    Will grow to{' '}
                    {bonus && bonus[StatIdx.ResGro] && <TimesTwo />}
                  </Sub>
                </td>
                <td>{getFormatProp(selected, 'silverCap')}</td>
                <td>
                  <Sub>Time left</Sub>
                </td>
                <td>{getSilver(100)}</td>
              </tr>
            </tbody>
          </DetailsTable>
        )}
        <DetailsTable>
          <tbody>
            <tr>
              <td>
                <Sub>
                  <TooltipTrigger name={TooltipName.Range} needsShift>
                    Range
                  </TooltipTrigger>{' '}
                  {bonus && bonus[StatIdx.Range] && <TimesTwo />}
                </Sub>
              </td>
              <td>{getFormatProp(selected, 'range')}</td>
              <td>
                <Sub>
                  <TooltipTrigger name={TooltipName.MinPop} needsShift>
                    Min. Pop
                  </TooltipTrigger>
                </Sub>
              </td>
              <td>
                {selected ? formatNumber(selected.populationCap * 0.05) : ''}
              </td>
            </tr>
          </tbody>
        </DetailsTable>
        <DetailsTable>
          <tbody>
            <tr>
              <td></td>
              <td>
                <Btn
                  onClick={() => window.open('/planet' + selected?.locationId)}
                  style={{ marginRight: '0.75em' }}
                >
                  View Planet Card
                </Btn>
                <Btn onClick={sharePlanet}>Share Planet</Btn>
              </td>
            </tr>
          </tbody>
        </DetailsTable>
      </div>
    </ModalPane>
  );
}
