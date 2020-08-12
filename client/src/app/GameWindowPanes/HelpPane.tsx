import React from 'react';
import { ModalName, ModalPane, ModalHook } from './ModalPane';
import styled from 'styled-components';
import dfstyles from '../../styles/dfstyles';
import { White, Blue } from '../../components/Text';
import { TargetIcon } from '../Icons';

const HelpWrapper = styled.div`
  width: 36em;
  height: 30em;
  overflow-y: scroll;

  & p,
  ul {
    color: ${dfstyles.colors.subtext};
    margin-top: 0.5em;
    &.title {
      color: ${dfstyles.colors.text};
      margin: 0.75em 0 0.5em 0;
      text-decoration: underline;
    }
  }
  & ul {
    list-style: inside;
    list-style-position: outside;
    margin-left: 1em;
    margin-right: 1em;
    & > li {
      margin: 0 1em;
    }
  }
`;

const BlueBG = styled.span`
  background: ${dfstyles.colors.dfblue};
  color: ${dfstyles.colors.text};
`;
export default function HelpPane({ hook }: { hook: ModalHook }) {
  return (
    <ModalPane hook={hook} title='Help' name={ModalName.Help}>
      <HelpWrapper>
        <p className='title'>Tooltips</p>
        <p>
          Hold down <White>SHIFT</White> and hover over anything that is
          highlighted <BlueBG>Blue</BlueBG> to learn more about it!
        </p>
        <p className='title'>Welcome to Dark Forest v0.3!</p>
        <p>
          This playtest will run from <White>08/08/2020</White> to{' '}
          <White>08/15/2020</White>.
        </p>
        <p>
          This window gives additional information about the game. When you are
          done reading, click the <White>X</White> in the upper-right corner to
          close this window.
        </p>
        <p>(Scroll down to read more!)</p>
        <p>
          You can reopen this window anytime by clicking the question mark icon
          on the <White>Menu Bar</White>.
        </p>
        <p className='title'>Patch Notes: 08/11/20</p>
        <ul>
          <li>
            <Blue>You can now view tooltips!</Blue> Hold <White>SHIFT</White> to
            see more.
          </li>
          <li>
            Added <White>planet badges</White> to <White>Planet Info</White> and{' '}
            <White>Planet Details</White>. These show helpful information about
            planets - you'll also get more the rarer your planet is!
          </li>
          <li>
            Made the 'L' in 'Lv' capital on <White>Upgrade Details</White>
          </li>
          <li>
            Fixed an issue where population would sometimes render as negative
            on <White>Manage Fleets</White>.
          </li>
          <li>
            Client will cap move transactions at 98% of silver/population - this
            fixes an issue where transactions would revert if your browser's
            Date.now() was out of sync.
          </li>
          <li>
            Silver Growth is now shown as per minute, rather than per second.
          </li>
          <li>
            Added text to <White>Range Rings</White> in order to clarify how
            they show maximum range of sending forces from a planet at certain
            population levels.
          </li>
          <li>
            Made small planets no longer render text at large zoom levels. This
            should improve performance on large maps.
          </li>
          <li>Disabled upgrade button on fully-upgraded planets.</li>
        </ul>

        <p className='title'>Getting Started</p>
        <p>
          You will primarily play the game through the{' '}
          <White>Game Screen</White>, behind this window. Clicking planets will
          allow you to select them. Additional info about these planets can be
          seen on the <White>Toolbar</White>, at the bottom of the screen.
        </p>
        <p>
          Additional windows can be opened from the <White>Menu Bar</White> on
          the top-left. The <White>Terminal</White> can be found on the
          right-side of the screen, and will log your game actions.
        </p>
        <p>
          You can move this window by clicking and dragging on the{' '}
          <White>
            <u>Help</u>
          </White>{' '}
          label at the top of the window.
        </p>
        <p className='title'>The Universe</p>
        <p>
          Dark Forest is a vast universe, obfuscated by zero-knowledge
          cryptography. Your <White>Miner</White> explores the universe,
          searching for <White>Planets</White> and other players.
        </p>
        <p>
          All planets produce <White>Population</White>. You can move population
          from planets you own to new planets to conquer them.
        </p>
        <p>
          Planets with rings also produce <White>Silver</White>, once they reach
          50% of their maximum population. Silver can be moved between planets,
          and can be spent on <White>Upgrades</White>. Producing and spending
          silver increases your score.
        </p>
        <p className='title'>Prizes and Scoring</p>
        <p>
          Dark Forest v0.3 will end on 8/15/2020. At that time, the top 15
          highest-scoring players will be awarded prizes from a pool of 1024
          DAI. Your score is determined by the value of your largest 10 planets,
          plus the silver you've produced and spent during the game.
        </p>
        <p className='title'>Controls</p>
        <p>
          <White>Click</White> on a planet to select it.
        </p>
        <p>
          <White>Click and Drag</White> from one planet to another to move
          forces.
        </p>
        <p>
          <White>Click</White> the{' '}
          <White>
            <TargetIcon /> Icon
          </White>{' '}
          in the{' '}
          <White>
            <u>Mining</u>
          </White>{' '}
          sidebar window to move your miner.
        </p>
      </HelpWrapper>
    </ModalPane>
  );
}
