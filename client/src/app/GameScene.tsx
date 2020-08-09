import React, { useState, useContext } from 'react';

import Spinner from 'react-spinkit';
import Button from '../components/Button';
import { Corner } from '../components/Corner';
import ControllableCanvas from './board/ControllableCanvas';

import DetailsWindow from './ui/DetailsWindow';
import MiningWindow from './ui/MiningWindow';
import Leaderboard from './ui/Leaderboard';

import GameUIManagerContext from './board/GameUIManagerContext';
import GameUIManager from './board/GameUIManager';

import colors from '../styles/colors';
import styled from 'styled-components';
import FleetWindow from './ui/FleetWindow';
import UpgradeWindow from './ui/UpgradeWindow';

const Header = styled.p`
  text-decoration: underline;
`;

const Pane = styled.div`
  color: ${colors.white};
  background-color: ${colors.black};
  border: 2px solid white;
  border-radius: 0.2rem;
  padding: 0.5rem 0.75rem;
  margin: 4px;
`;

const styles: { [key: string]: React.CSSProperties } = {
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
  },
  flexCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  leaderboard: {},
  button: {
    background: 'black',
    border: '2px solid white',
    padding: '0.5rem 0.75rem',
    margin: '4px',
    borderRadius: '0.2rem',
  },
};

export default function GameScene() {
  const gameUIManager = useContext<GameUIManager | null>(GameUIManagerContext);

  const [exploring, setExploring] = useState<boolean>(true);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  if (!gameUIManager) {
    console.error('GameUIManager context is null');
    return <div />;
  }

  return (
    <React.Fragment>
      <Leaderboard visible={showLeaderboard} />

      <Corner top left style={styles.flexCol}>
        <div
          style={{
            ...styles.flexRow,
            alignItems: 'center',
          }}
        >
          <Button
            onClick={() => {
              exploring
                ? gameUIManager.stopExplore()
                : gameUIManager.startExplore();

              setExploring(!exploring);
            }}
            style={styles.button}
          >
            {exploring ? 'Stop' : 'Start'} exploring
          </Button>

          {exploring && (
            <div style={{ margin: '6px 0 0 30px' }}>
              <Spinner name='ball-clip-rotate-multiple' fadeIn='none' />
            </div>
          )}
        </div>

        <Button
          onClick={() => {
            setShowLeaderboard(!showLeaderboard);
          }}
          style={{
            ...styles.button,
          }}
        >
          Leaderboard
        </Button>
        <Button
          onClick={() => {
            window.alert(
              'This feature will be available in a future mainnet release!'
            );
          }}
          style={{
            ...styles.button,
          }}
        >
          Cash out
        </Button>
      </Corner>

      <Corner top right style={{ width: '22em' }}>
        <Pane>
          <Header>Mining Patterns</Header>
          <MiningWindow />
        </Pane>
        {/*
        <Link to='/tutorial' style={{ margin: '4px' }}>
          Tutorial
        </Link>
        */}
      </Corner>

      <Corner bottom left style={{ width: '22em' }}>
        <Pane>
          <Header>Planet Upgrades</Header>
          <UpgradeWindow />
        </Pane>
        <Pane>
          <Header>Planet Details</Header>
          <DetailsWindow />
        </Pane>
      </Corner>

      <Corner
        bottom
        right
        style={{
          ...styles.flexCol,
          width: '22em',
        }}
      >
        <Pane>
          <Header>Fleet Management</Header>
          <FleetWindow />
        </Pane>
      </Corner>

      <ControllableCanvas />
    </React.Fragment>
  );
}
