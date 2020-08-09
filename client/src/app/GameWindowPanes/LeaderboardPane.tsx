import React, { useContext, useState, useEffect } from 'react';
import styled from 'styled-components';
import { ModalPane, ModalHook, ModalName } from './ModalPane';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { EthAddress, Planet } from '../../_types/global/GlobalTypes';
import { Sub } from '../../components/Text';

const LeaderboardWrapper = styled.div`
  width: 36em;
  min-height: 15em;

  & > div {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    & > span {
      margin-left: 0.25em;
      &:last-child {
        margin-left: 0;
      }
    }

    & > span:nth-child(1) {
      flex-grow: 1;
    }
    & > span:nth-child(2) {
      width: 6em;
    }
    & > span:nth-child(3) {
      width: 4em;
    }
  }
`;

type ScoreboardEntry = {
  playerId: EthAddress;
  twitter?: string;
  score: number;
  sortedPlanets: Planet[];
};

export default function LeaderboardPane({ hook }: { hook: ModalHook }) {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);

  const [visible] = hook;

  useEffect(() => {
    if (uiManager) {
      const players = uiManager.getAllPlayers();
      const planets = uiManager.getAllOwnedPlanets();
      const scoreboardMap: Record<EthAddress, ScoreboardEntry> = [];
      for (const player of players) {
        scoreboardMap[player.address] = {
          playerId: player.address,
          score: 0,
          sortedPlanets: [],
        };
        if (player.twitter) {
          scoreboardMap[player.address].twitter = player.twitter;
        }
      }
      for (const planet of planets) {
        const owner = planet.owner;
        if (scoreboardMap[owner]) {
          scoreboardMap[owner].sortedPlanets.push(planet);
        }
      }
      for (const player of players) {
        const entry: ScoreboardEntry = scoreboardMap[player.address];
        entry.sortedPlanets.sort((a, b) => b.populationCap - a.populationCap);
        const nPlanets = entry.sortedPlanets.length;
        for (let i = 0; i < nPlanets; i += 1) {
          const planet = entry.sortedPlanets[i];
          entry.score += (planet.silverSpent + planet.silver) / 10; // silver spent or held on this planet
          if (i < 10) {
            entry.score += planet.populationCap;
          }
        }
      }
      const entries: ScoreboardEntry[] = Object.values(scoreboardMap);
      entries.sort((a, b) => b.score - a.score);
      setScoreboard(entries);
    }
  }, [uiManager, visible]);

  return (
    <ModalPane hook={hook} title='Leaderboard' name={ModalName.Leaderboard}>
      <LeaderboardWrapper>
        <div>
          <span>
            <Sub>
              <u>Player</u>
            </Sub>
          </span>
          <span>
            <Sub>
              <u>Score</u>
            </Sub>
          </span>
          <span>
            <Sub>
              <u>Planets</u>
            </Sub>
          </span>
        </div>
        {scoreboard.map((entry, idx) => (
          <div key={idx}>
            <span>{entry.twitter ? '@' + entry.twitter : entry.playerId}</span>
            <span>{Math.floor(entry.score)}</span>
            <span>
              <Sub>{entry.sortedPlanets.length}</Sub>
            </span>
          </div>
        ))}
      </LeaderboardWrapper>
    </ModalPane>
  );
}
