import React, { useContext, useEffect, useState } from 'react';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { EthAddress, Planet } from '../../_types/global/GlobalTypes';

interface LeaderboardProps {
  visible: boolean;
}
const wrapperStyle: React.CSSProperties = {
  position: 'fixed',
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  pointerEvents: 'none',
  zIndex: 1,
};
const leaderboardStyle: React.CSSProperties = {
  background: '#888',
  margin: '2em auto',
  border: '2px solid white',
  borderRadius: '2px',
  width: '40em',
  padding: '1em 2em',
};

type ScoreboardEntry = {
  playerId: EthAddress;
  score: number;
  sortedPlanets: Planet[];
};

export default function Leaderboard({ visible }: LeaderboardProps) {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);

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
      }
      for (const planet of planets) {
        const owner = planet.owner;
        if (scoreboardMap[owner]) {
          scoreboardMap[owner].sortedPlanets.push(planet);
        }
      }
      for (const player of players) {
        const entry: ScoreboardEntry = scoreboardMap[player.address];
        entry.sortedPlanets.sort(
          (a, b) => b.silverSpent + b.silver - (a.silverSpent + a.silver)
        );
        const nPlanets = entry.sortedPlanets.length;
        for (let i = 0; i < nPlanets; i += 1) {
          const planet = entry.sortedPlanets[i];
          entry.score +=
            planet.silverSpent - planet.populationCap + planet.silver; // silver produced and held on this planet
          if (i < 10) {
            entry.score += planet.populationCap;
          }
        }
      }
      const entries: ScoreboardEntry[] = Object.values(scoreboardMap);
      entries.sort((a, b) => b.score - a.score);
      console.log(entries);
      setScoreboard(entries);
    }
  }, [visible, uiManager]);

  return (
    <div
      style={{
        ...wrapperStyle,
        display: visible ? wrapperStyle.display : 'none',
      }}
    >
      <div style={leaderboardStyle}>
        <p>This is a Leaderboard!</p>
        {scoreboard.map((entry, idx) => (
          <div key={idx}>
            <span>{entry.playerId}</span> <span>{Math.floor(entry.score)}</span>{' '}
            <span>{entry.sortedPlanets.length}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/*TODO: refactor leaderboard <div
        className={
          'absolute top-0 left-0 w-full h-full ' +
          (showLeaderboard ? 'block' : 'hidden')
        }
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 999,
        }}
      >
        <div
          className='bg-gray-900 border border-white rounded-sem p-2'
          style={{
            margin: '0 auto',
            marginTop: '2em',
            width: '600px',
          }}
        >
          <p
            onClick={() => {
              setShowLeaderboard(false);
            }}
          >
            <u>Close Leaderboard</u>
          </p>
          <h3>Leaderboard</h3>
          <div className='flex flex-col'>
            {gameManager.getAssetsOfPlayers().map((playerIdAndAssets, i) => {
              return (
                <div className='flex flex-row justify-between' key={i}>
                  <p>{playerIdAndAssets[0]}</p>
                  <p className='align-right'>
                    {Math.round(playerIdAndAssets[1] / 100)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>*/
