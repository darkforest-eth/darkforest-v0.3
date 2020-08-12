import React, { useContext, useState, useEffect } from 'react';
import { SidebarPane } from '../GameWindowComponents';
import styled from 'styled-components';
import dfstyles from '../../styles/dfstyles';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { EthAddress } from '../../_types/global/GlobalTypes';
import { formatNumber } from '../../utils/Utils';
import { ModalHook } from './ModalPane';
import { TooltipTrigger } from './Tooltip';
import { TooltipName } from '../../utils/WindowManager';

const PlayerInfoWrapper = styled.div`
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
  score,
  rank,
}: {
  _updater: number;
  hook: ModalHook;
  score: number;
  rank: number;
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
          <TooltipTrigger name={TooltipName.Population} needsShift>
            <span>Population</span>
          </TooltipTrigger>
          <span>
            {account && uiManager
              ? formatNumber(uiManager.getPopOfPlayer(account))
              : '...'}
          </span>
        </div>
        <div>
          <TooltipTrigger name={TooltipName.Silver} needsShift>
            <span>Silver</span>
          </TooltipTrigger>
          <span>
            {account && uiManager
              ? formatNumber(uiManager.getSilverOfPlayer(account))
              : '...'}
          </span>
        </div>
        <div>
          <TooltipTrigger name={TooltipName.TwitterHandle} needsShift>
            <span>Handle</span>
          </TooltipTrigger>
          <span>
            {twitter ? (
              <span>@{twitter}</span>
            ) : (
              <span
                onClick={() => twitterHook[1]((b) => !b)}
                className='twitter-connect'
              >
                Connect Twitter
              </span>
            )}
          </span>
        </div>
        <div>
          <TooltipTrigger name={TooltipName.Score} needsShift>
            <span>Score</span>
          </TooltipTrigger>
          <span>{Math.floor(score)}</span>
        </div>
        <div>
          <TooltipTrigger name={TooltipName.Rank} needsShift>
            <span>Rank</span>
          </TooltipTrigger>
          <span>{rank}</span>
        </div>
      </PlayerInfoWrapper>
    </SidebarPane>
  );
}
