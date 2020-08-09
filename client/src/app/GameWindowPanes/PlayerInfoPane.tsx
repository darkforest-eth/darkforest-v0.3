import React, { useContext, useState, useEffect } from 'react';
import { SidebarPane } from '../GameWindowComponents';
import styled from 'styled-components';
import dfstyles from '../../styles/dfstyles';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { EthAddress } from '../../_types/global/GlobalTypes';
import { formatNumber } from '../../utils/Utils';
import { ModalIcon, ModalName, ModalHook } from './ModalPane';

const PlayerInfoWrapper = styled.table`
  width: 100%;
  & > div {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    & > span {
      display: flex;
      flex-direction: row;
      align-items: center;
      &:first-child {
        color: ${dfstyles.colors.subtext};
      }
    }
  }

  & span.twitter-button-wrap {
    & > div {
      margin-right: 0.5em;
    }
  }

  & span.twitter-connect {
    color: ${dfstyles.colors.subtext};
    &: hover {
      text-decoration: underline;
      cursor: pointer;
    }
  }
`;

export default function PlayerInfoPane({
  _updater,
  hook: twitterHook,
}: {
  _updater: number;
  hook: ModalHook;
}) {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const [account, setAccount] = useState<EthAddress | null>(null);
  const [twitter, setTwitter] = useState<string | null>(null);

  // sync account and twitter
  useEffect(() => {
    if (!uiManager) return;
    setAccount(uiManager.getAccount());
    setTwitter(uiManager.getTwitter(null));
  }, [uiManager, _updater]);

  return (
    <SidebarPane title='Player Info' headerItems={<></>}>
      <PlayerInfoWrapper>
        <div>
          <span>Population</span>
          <span>
            {account && uiManager
              ? formatNumber(uiManager.getPopOfPlayer(account))
              : '...'}
          </span>
        </div>
        <div>
          <span>Silver</span>
          <span>
            {account && uiManager
              ? formatNumber(uiManager.getSilverOfPlayer(account))
              : '...'}
          </span>
        </div>
        <div>
          <span className='twitter-button-wrap'>
            <ModalIcon
              hook={twitterHook}
              modal={ModalName.TwitterVerification}
            />{' '}
            Handle
          </span>
          <span>
            {twitter ? (
              <span>@{twitter}</span>
            ) : (
              <span
                onClick={() => twitterHook[1]((b) => !b)}
                className='twitter-connect'
              >
                Connect
              </span>
            )}
          </span>
        </div>
      </PlayerInfoWrapper>
    </SidebarPane>
  );
}
