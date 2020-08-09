import React, { useContext, useState, useEffect } from 'react';
import { ModalPane, ModalName, ModalHook } from './GameWindowPanes/ModalPane';
import styled from 'styled-components';
import { Planet, EthAddress } from '../_types/global/GlobalTypes';
import GameUIManager from './board/GameUIManager';
import GameUIManagerContext from './board/GameUIManagerContext';
import dfstyles from '../styles/dfstyles';
import { Btn } from './GameWindowComponents';
import { Sub, Red } from '../components/Text';
import { emptyAddress } from '../utils/CheckedTypeUtils';
import { getPlanetName } from '../utils/ProcgenUtils';
import { getPlanetShortHash } from '../utils/Utils';

const BroadcastWrapper = styled.div`
  width: 30em;
  & .row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    & > span {
      &:first-child {
        color: ${dfstyles.colors.subtext};
        padding-right: 1em;
      }
    }
  }
  & .message {
    height: 4em;
    margin: 1em 0;

    & p {
      margin: 0.5em 0;

      &:last-child {
        margin-bottom: 1em;
      }
    }
  }
`;

export default function TwitterBroadcastPane({
  hook,
  selected,
}: {
  hook: ModalHook;
  selected: Planet | null;
}) {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);

  const getLoc = () => {
    if (!selected || !uiManager) return { x: 0, y: 0 };
    const loc = uiManager.getLocationOfPlanet(selected.locationId);
    if (!loc) return { x: 0, y: 0 };
    return loc.coords;
  };

  const getOwner = () => {
    if (!selected || !uiManager) return;
    const twitter = uiManager.getTwitter(selected.owner);
    let name = selected.owner as string;
    if (twitter) name = '@' + twitter;

    return name;
  };

  const broadcast = () => {
    if (!selected || !uiManager) return;
    const loc = uiManager.getLocationOfPlanet(selected.locationId);
    if (!loc) return;
    const { x, y } = loc.coords;
    const twitter = uiManager.getTwitter(selected.owner);
    let name = selected.owner as string;
    if (twitter) name = '@' + twitter;

    const str = `I've found ${name}'s planet at (${x}, ${y})! Verify my ZK proofs at @darkforest_eth (https://zkga.me)`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURI(str)}`);
  };

  const [account, setAccount] = useState<EthAddress | null>(null); // consider moving this one to parent

  useEffect(() => {
    if (!uiManager) return;
    setAccount(uiManager.getAccount());
  }, [uiManager]);

  const windowName = (): string => {
    const str = 'Broadcast Coordinates';
    if (!selected || !account) return str;
    if (selected.owner !== account) return str;

    const planetname = getPlanetName(selected);
    const shorthash = getPlanetShortHash(selected);

    return `${shorthash} ${planetname} - ${str}`;
  };

  return (
    <ModalPane
      hook={hook}
      title={windowName()}
      name={ModalName.TwitterVerification}
    >
      {selected && selected.owner !== emptyAddress ? (
        <BroadcastWrapper>
          <div className='row'>
            <span>Coordinates</span>
            <span>{`(${getLoc().x}, ${getLoc().y})`}</span>
          </div>
          <div className='row'>
            <span>Owner</span>
            <span>{getOwner()}</span>
          </div>
          <div className='message'>
            <p>
              <em>
                <Red>WARNING:</Red>{' '}
                <Sub>
                  Broadcasting the coordinates of this planet will leave it and
                  neighboring planets vulnerable to attack!
                </Sub>
              </em>
            </p>
            {selected.owner === account && (
              <p>
                <em>
                  <Red>WARNING:</Red> <Sub>You own this planet!</Sub>
                </em>
              </p>
            )}
          </div>
          <p style={{ textAlign: 'right' }}>
            <Btn onClick={broadcast}>Broadcast to Twitter</Btn>
          </p>
        </BroadcastWrapper>
      ) : (
        <p>Please select an occupied planet to broadcast coordinates.</p>
      )}
    </ModalPane>
  );
}
