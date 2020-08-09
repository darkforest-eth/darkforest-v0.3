import React, { useRef } from 'react';

import { useScroll } from 'react-use';
import { useHistory } from 'react-router-dom';

import { Header, Link, Paragraph, List, Item } from '../../components/Text';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import colors from '../../styles/colors';

const styles: { [name: string]: React.CSSProperties } = {
  container: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorialBox: {
    height: '90%',
    width: '65%',
    overflowY: 'scroll',
    backgroundColor: colors['gray-900'],
    border: '2px solid #9f9f9f',
    borderColor: colors['gray-500'],
    borderRadius: '4px',
    padding: '2rem 2.5rem',
    position: 'relative',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
  },
};

interface TutorialProps {
  // If specified, will redirect user to this page when "X" is clicked
  redirectTo?: string;
}

export default function Tutorial({ redirectTo = '/' }: TutorialProps) {
  const history = useHistory();
  const tutorialBoxRef = useRef(null);
  const { y: scrollOffset } = useScroll(tutorialBoxRef);

  return (
    <div style={styles.container}>
      <div style={styles.tutorialBox} ref={tutorialBoxRef}>
        <div style={styles.closeButtonContainer}>
          <CloseOutlined
            style={{
              fontSize: '1.5rem',
              marginTop: `${scrollOffset}px`,
            }}
            onClick={() => {
              history.push(redirectTo);
            }}
          />
        </div>

        <Header>Welcome to the Dark Forest tutorial!</Header>
        <Paragraph>
          Dark Forest is a space conquest game built on Ethereum using{' '}
          <Link href='https://z.cash/technology/zksnarks/'>zkSNARKs</Link>.
        </Paragraph>
        <Header>Getting Started</Header>
        <Paragraph>
          Connect to Ropsten on MetaMask and load up{' '}
          <Link href='https://zkga.me'>https://zkga.me</Link>. If you are
          participating in the contest, please also fill out{' '}
          <Link href='https://forms.gle/dwH1nQaymhSgmfrj8'>
            this Google form
          </Link>{' '}
          to claim your winnings once the game has ended.
        </Paragraph>
        <Header>Contest Rules</Header>
        <Paragraph>
          A pool of e (2.718) ETH will be distributed at the end of 48 hours
          based on the following calculations:
        </Paragraph>
        <Paragraph>
          <List>
            <Item>Reward for playing:</Item>
            <List>
              <Item>reward = (forces_owned / total_forces) * 2.718 ETH</Item>
            </List>
            <Item>Simulated "transaction fees":</Item>
            <List>
              <Item>cost = number_transactions * 0.25 USD</Item>
            </List>
            <Item>Total prize:</Item>
            <List>
              <Item>sum = max(reward - cost, 0)</Item>
            </List>
          </List>
        </Paragraph>
        <Paragraph>
          We encourage you to be hacky, and to write code to gain an advantage
          (see "Hints"). However, any hack that is clearly not in the spirit of
          the game (please use sensible discretion) may be grounds for
          disqualification. If in doubt, please ask!
        </Paragraph>
        <Header>How to Play</Header>
        <Paragraph>
          You will be spawned at a home planet at a random location in the
          universe.
        </Paragraph>
        <Paragraph>
          <List style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <Item>
              Click-and-drag from one planet to another to send forces.
            </Item>
            <Item>Click-and-drag on the map to pan around.</Item>
            <Item>Scroll to zoom in and out.</Item>
          </List>
        </Paragraph>
        <Paragraph>
          You can move forces from one of your own planets to another, conquer
          unowned planets, or attack enemy planets. Attacking enemy planets with
          enough forces will allow you to conquer them.
        </Paragraph>
        <Paragraph>
          You can change how many forces to send from one planet to another in
          the "Forces" tab.
        </Paragraph>
        <Header>Planet Details</Header>
        <Paragraph>
          Planets you own are denoted with a blue ring. Enemy planets have a
          differently-colored ring.
        </Paragraph>
        <Paragraph>
          Planets have various stats, shown in the "Details" tab:
        </Paragraph>
        <Paragraph>
          <List>
            <Item>
              Capacity: total # of forces that can this planet can hold
            </Item>
            <Item>Growth: the maximum growth rate of this planet</Item>
            <Item>Attack: how much damage attacks from this planet do</Item>
            <Item>Defense: how resistant your planet is to enemy attacks</Item>
          </List>
        </Paragraph>
        <Paragraph>
          Larger planets have higher attack, smaller planets have higher
          defense.
        </Paragraph>
        <Header>Miners</Header>
        <Paragraph>
          The web client uses a "miner" to uncover the locations of planets and
          players in the universe.
        </Paragraph>
        <Paragraph>
          Your miner can explore space in different patterns, controllable in
          the "Miners" tab.
        </Paragraph>
        <Header>Hints</Header>
        <Paragraph>
          The universe is a 8192 x 8192 grid of cells. Each cell (x, y) is
          uniquely identified by its hash, MiMC(x, y). Rather than publishing
          the coordinates of planets they own, players publish the hashes of
          planets to the blockchain, along with Zero-Knowledge Proofs that the
          planets are legitimate. In this way, player locations are kept secret,
          up to brute force computation.
        </Paragraph>
        <Paragraph>
          "Planets" exist at all cells whose coordinates hash to under a
          difficulty threshold. This threshold specified in the Dark Forest
          Ethereum contract.
        </Paragraph>
        <Paragraph>
          The web client miner lifts the "cryptographic fog of war" on the
          universe by computing hashes. These hashes are stored in browser local
          storage (IndexedDB). Note that you may compute hashes offline and
          enter them into local storage yourself as well.
        </Paragraph>
        <Paragraph>
          The repository for this project can be found{' '}
          <Link href='https://github.com/briangu33/darkforest'>here</Link>.
        </Paragraph>
        <Paragraph>
          If you have any questions about the game or the repository, please
          don't hesitate to ask us!
        </Paragraph>
      </div>
    </div>
  );
}
