import React, { useState, useContext, useEffect } from 'react';
import { ModalPane, ModalName, ModalHook } from './ModalPane';
import GameUIManagerContext from '../board/GameUIManagerContext';
import GameUIManager from '../board/GameUIManager';
import { Green, Sub, White, Red } from '../../components/Text';
import styled from 'styled-components';
import { Btn } from '../GameWindowComponents';
import dfstyles from '../../styles/dfstyles';

const TwitterWrapper = styled.div`
  width: 30em;
  height: 15em;

  & > .row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    & .input-twitter {
      transition: background 0.2s, color 0.2s, width: 0.2s !important;
      outline: none;
      background: ${dfstyles.colors.background};
      color: ${dfstyles.colors.subtext};
      border-radius: 4px;
      border: 1px solid ${dfstyles.colors.text};
      margin-left: 0.75em;
      width: 6em;
      padding: 2px 6px;

      &:focus {
        background: ${dfstyles.colors.backgroundlight};
        color: ${dfstyles.colors.text};
        width: 8em;
      }
    }
  }

  & span.clickable {
    &:hover {
      cursor: pointer;
      text-decoration: underline;
    }
  }
  & > div,
  & > p {
    margin: 0.5em 0;
    &:first-child {
      margin-top: 0;
    }
  }
`;
export default function TwitterVerifyPane({ hook }: { hook: ModalHook }) {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const [twitter, setTwitter] = useState<string | null>(null);
  const [twitterInput, setTwitterInput] = useState<string>('');
  const [tweeted, setTweeted] = useState<boolean>(false);
  const [failedVerify, setFailedVerify] = useState<boolean>(false);

  useEffect(() => {
    if (!uiManager) return;
    setTwitter(uiManager.getTwitter(null));
  }, [uiManager]);

  const onTweetClick = async () => {
    if (uiManager) {
      const tweetText = await uiManager.generateVerificationTweet(twitterInput);
      const str = `I'm verifying my Dark Forest account on @darkforest_eth (https://zkga.me): ${tweetText}`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURI(str)}`);
      setTweeted(true);
    }
  };

  const onVerifyClick = async () => {
    if (uiManager) {
      const success = await uiManager.verifyTwitter(twitterInput);
      if (success) {
        setTwitter(twitterInput);
      } else {
        setFailedVerify(true);
      }
    }
  };

  const alreadyTweetedClick = () => {
    setTweeted(true);
  };

  return (
    <ModalPane
      hook={hook}
      title='Twitter Verification'
      name={ModalName.TwitterVerification}
    >
      <TwitterWrapper>
        <div className='row'>
          <p>Connect to Twitter by signing a public tweet.</p>
        </div>
        {twitter && (
          <p>
            <Sub>
              <Green>You are connected.</Green> Thank you for verifying your
              twitter account, <White>@{twitter}</White>.
            </Sub>
          </p>
        )}
        {!twitter && (
          <>
            <div className='row'>
              <Sub>Verify using this handle:</Sub>
              <span>
                @
                <input
                  className='input-twitter'
                  style={{
                    borderRadius: '3px',
                  }}
                  value={twitterInput}
                  onChange={(e) => setTwitterInput(e.target.value)}
                  placeholder={'my-twitter'}
                />
              </span>
            </div>
            <div className='row'>
              <Sub onClick={alreadyTweetedClick} className='clickable'>
                (I've already tweeted)
              </Sub>
              <Btn onClick={onTweetClick}>Tweet</Btn>
            </div>
            <p>Once you've tweeted, you can verify your account.</p>
            <div className='row'>
              <span> </span>
              <Btn
                onClick={tweeted ? onVerifyClick : () => {}}
                className={tweeted ? '' : 'btn-disabled'}
              >
                Verify
              </Btn>
            </div>
            {failedVerify && (
              <p>
                <Red>ERROR: failed to verify signature.</Red>{' '}
                <Sub>Please try again.</Sub>
              </p>
            )}
          </>
        )}
      </TwitterWrapper>
    </ModalPane>
  );
}
