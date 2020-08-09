import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Sub } from '../../components/Text';
import dfstyles from '../../styles/dfstyles';
import { formatNumber, getPlanetShortHash } from '../../utils/Utils';
import { EthAddress, Planet } from '../../_types/global/GlobalTypes';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { SidebarPane } from '../GameWindowComponents';

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const FleetPaneWrapper = styled.div`
  & .input-row {
    & p:first-child {
      flex-grow: 1;
      display: flex;
      flex-direction: row;
      align-items: center;
      & input {
        width: 100%;
      }
    }
    & p:last-child {
      text-align: right;
      width: 2.5em;
      margin-left: 1em;
    }
  }

  & > div {
    margin-top: 0.5em;
  }

  & .preview-row {
    & p:first-child {
      width: 4em;
    }
    & p:last-child {
      flex-grow: 1;
      text-align: right;
    }
  }
`;

const SLIDER_DIM = '15px';
const Slider = styled.input`
  -webkit-appearance: none; /* Override default CSS styles */
  appearance: none;
  width: 100%; /* Full-width */
  height: 5px; /* Specified height */
  background: ${dfstyles.colors.subbesttext}; /* Grey background */
  border-radius: 3px;
  outline: none; /* Remove outline */
  transition: background 0.2s;

  &:hover {
    background: ${dfstyles.colors.subbertext};
    &::-webkit-slider-thumb {
      background: ${dfstyles.colors.dfblue};
    }
    &::-moz-range-thumb {
      background: ${dfstyles.colors.dfblue};
    }
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none; /* Override default look */
    appearance: none;
    width: ${SLIDER_DIM}; /* Set a specific slider handle width */
    height: ${SLIDER_DIM}; /* Slider handle height */
    background: ${dfstyles.colors.subtext};
    border-radius: 10px;
  }

  &::-moz-range-thumb {
    width: ${SLIDER_DIM}; /* Set a specific slider handle width */
    height: ${SLIDER_DIM}; /* Slider handle height */
    background: ${dfstyles.colors.subtext};
    cursor: pointer; /* Cursor on hover */
    border-radius: 10px;
  }
`;

const rangeProps = {
  type: 'range',
  min: '0',
  max: '100',
  step: '1',
};

const DEFAULT_POP_PERCENT = 50;
const DEFAULT_SILVER_PERCENT = 0;
export default function FleetPane({ selected }: { selected: Planet | null }) {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const [account, setAccount] = useState<EthAddress | null>(null); // consider moving this one to parent

  useEffect(() => {
    if (!uiManager) return;
    setAccount(uiManager.getAccount());
  }, [uiManager]);

  const [popPercent, setPopPercent] = useState<number>(DEFAULT_POP_PERCENT);
  const [silverPercent, setSilverPercent] = useState<number>(
    DEFAULT_SILVER_PERCENT
  );

  useEffect(() => {
    if (!uiManager) return;
    if (!selected) {
      setPopPercent(DEFAULT_POP_PERCENT);
      setSilverPercent(DEFAULT_SILVER_PERCENT);
    } else {
      setPopPercent(uiManager?.getForcesSending(selected.locationId));
      setSilverPercent(uiManager?.getSilverSending(selected.locationId));
    }
  }, [selected, uiManager]);

  useEffect(() => {
    if (!selected) return;
    uiManager?.setForcesSending(selected.locationId, popPercent);
    uiManager?.setSilverSending(selected.locationId, silverPercent);
  }, [popPercent, silverPercent, selected, uiManager]);

  const getSendingPop = () => {
    if (!selected) return 0;
    const base = selected.population * (popPercent / 100);
    if (selected.population - base < 1) return selected.population - 1;
    else return base;
  };

  return (
    <SidebarPane title='Manage Fleets'>
      {selected && selected.owner === account ? (
        <FleetPaneWrapper>
          <Row>
            <p>
              <Sub>Selected</Sub>
            </p>
            <p>{getPlanetShortHash(selected)}</p>
          </Row>

          {/* sending pop */}
          <div>
            <Row>
              <p>
                <Sub>
                  <u>Population</u>
                </Sub>
              </p>
            </Row>
            <Row className='preview-row'>
              <p>
                <Sub>Sending</Sub>
              </p>
              <p>
                {formatNumber(getSendingPop())} <Sub>/</Sub>{' '}
                {formatNumber(selected.population)}
              </p>
            </Row>
            <Row className='input-row'>
              <p>
                <Slider
                  {...rangeProps}
                  value={popPercent}
                  onChange={(e) => setPopPercent(parseInt(e.target.value))}
                />
              </p>
              <p>{popPercent}%</p>
            </Row>
          </div>

          {/* sending silver */}
          <div>
            <Row>
              <p>
                <Sub>
                  <u>Silver</u>
                </Sub>
              </p>
            </Row>
            <Row className='preview-row'>
              <p>
                <Sub>Sending</Sub>
              </p>
              <p>
                {formatNumber(selected.silver * (silverPercent / 100))}{' '}
                <Sub>/</Sub> {formatNumber(selected.silver)}
              </p>
            </Row>
            <Row className='input-row'>
              <p>
                <Slider
                  {...rangeProps}
                  value={silverPercent}
                  onChange={(e) => setSilverPercent(parseInt(e.target.value))}
                />
              </p>
              <p>{silverPercent}%</p>
            </Row>
          </div>
        </FleetPaneWrapper>
      ) : (
        <p>
          <Sub>Please select a planet you own to manage fleets.</Sub>
        </p>
      )}
    </SidebarPane>
  );
}
