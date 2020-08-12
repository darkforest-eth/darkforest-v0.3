import React from 'react';
import { useHistory } from 'react-router-dom';
import Button from '../components/Button';
import {
  Text,
  Sub,
  HideSmall,
  Invisible,
  BlinkCursor,
} from '../components/Text';
import { EmailCTA } from './Email';
import dfstyles from '../styles/dfstyles';
import styled from 'styled-components';
import Typist from 'react-typist';
import LandingPageCanvas from './LandingPageCanvas';

export const enum LandingPageZIndex {
  Background = 0,
  Canvas = 1,
  BasePage = 2,
}

const styles: {
  [name: string]: React.CSSProperties;
} = {
  // container stuff
  wrapper: {
    width: '100%',
    height: '100%',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: dfstyles.colors.background,
    zIndex: LandingPageZIndex.Background,
  },
  basePage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    color: dfstyles.colors.text,
    fontSize: dfstyles.fontSize,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: LandingPageZIndex.BasePage,
  },

  // hall of fame
  hofTitle: {
    color: dfstyles.colors.subtext,
    display: 'inline-block',
    borderBottom: `1px solid ${dfstyles.colors.subtext}`,
    lineHeight: '1em',
  },
};

const links = {
  twitter: 'http://twitter.com/darkforest_eth',
  email: 'mailto:contact@zkga.me',
  blog: 'https://blog.zkga.me/',
  telegram: 'https://t.me/zk_forest',
  github: 'https://github.com/darkforest-eth',
};

// note: prefer styled-components when possible because semantically easier to debug
const Header = styled.div`
  text-align: center;
`;

const EmailWrapper = styled.div`
  display: flex;
  flex-direction: row;
`;

const TRow = styled.tr`
  & td:first-child {
    color: ${dfstyles.colors.subtext};
  }
  & td:nth-child(2) {
    padding-left: 12pt;
  }
  & td:nth-child(3) {
    text-align: right;
    padding-left: 16pt;
  }
`;

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  & > div {
    margin-top: 16pt;
  }
`;

const TextLinks = styled.div`
  & a {
    &:first-child {
      margin-left 0;
    }
    margin-left: 7pt;
    &:after {
      margin-left: 7pt;
      content: '-';
      color: ${dfstyles.colors.subtext};
    }
    &:last-child:after {
      display: none;
    }

    transition: color 0.2s;
    &:hover {
      color: ${dfstyles.colors.dfblue};
    }
  }
`;

const IconLinks = styled.div`
  font-size: 18pt;

  & a {
    margin: 0 6pt;
    transition: color 0.2s;
    &: hover {
      cursor: pointer;
      &.link-twitter {
        color: ${dfstyles.colors.icons.twitter};
      }
      &.link-github {
        color: ${dfstyles.colors.icons.github};
      }
      &.link-telegram {
        color: ${dfstyles.colors.icons.telegram};
      }
      &.link-blog {
        color: ${dfstyles.colors.icons.blog};
      }
      &.link-email {
        color: ${dfstyles.colors.icons.email};
      }
    }
  }
`;

const CTA = styled.div`
  display: inline-block;
  font-size: ${dfstyles.fontH2};
  border-bottom: 1px solid ${dfstyles.colors.text};
  line-height: 1em;
  margin-top: 16px;
  cursor: pointer;
  transition: color 0.2s, border-bottom 0.2s;
  &:hover {
    color: ${dfstyles.colors.dfgreen};
    border-bottom: 1px solid ${dfstyles.colors.dfgreen};
  }
`;

const Title = styled.div`
  font-size: ${dfstyles.fontH1};
  font-family: ${dfstyles.titleFont};
  @media (max-width: ${dfstyles.screenSizeS}) {
    font-size: ${dfstyles.fontH1S};
  }
  position: relative;

  & h1 {
    white-space: nowrap;
  }

  & h1:first-child {
    position: absolute;
  }
  & h1:last-child {
    &: before {
      content: '>';
      position: absolute;
      top: 0;
      left: -1em;
      color: #00ff08;
    }
  }
`;

const Fat = styled.span`
  display: inline-block;
  transform: scale(1, 1.2);
`;

const TypistWrapper = styled.div`
  display: inline;
  & div.Typist,
  & div {
    display: inline;
  }
`;

// color: ${dfstyles.colors.dfgreen};

const typistProps = {
  startDelay: 0,
  avgTypingDelay: 97,
  stdTypingDelay: 4,
  cursor: { show: false },
};

export default function LandingPage() {
  const history = useHistory();
  return (
    <div style={styles.wrapper}>
      <div style={styles.background} />
      <LandingPageCanvas />

      <div style={styles.basePage}>
        {/* Spacer */}
        <div></div>

        {/* Title + CTA */}
        <Header>
          <Title>
            <h1>
              <TypistWrapper>
                <Typist
                  startDelay={300}
                  avgTypingDelay={69}
                  stdTypingDelay={6.9}
                  cursor={{ show: false }}
                >
                  dark forest
                </Typist>
              </TypistWrapper>
              <Fat>
                <Sub>
                  <BlinkCursor />
                </Sub>
              </Fat>
            </h1>
            <h1>
              <Invisible>dark forest</Invisible>
            </h1>
          </Title>

          <Typist {...typistProps}>
            <p>
              <Sub>
                zkSNARK space warfare <HideSmall>(v0.3)</HideSmall>
              </Sub>
            </p>
          </Typist>
          <CTA
            onClick={() => {
              history.push('/game1');
            }}
          >
            <Typist {...typistProps}>Enter</Typist>
          </CTA>
        </Header>

        {/* Footer */}
        <Footer>
          {/* Hall of Fame */}
          <div>
            <p style={styles.hofTitle}>Space Masters</p>
            <table>
              <tbody>
                <TRow>
                  <td>
                    <HideSmall>dfv</HideSmall>0.1
                  </td>
                  <td>
                    02/22/<HideSmall>20</HideSmall>20
                  </td>
                  <td>Dylan Field</td>
                </TRow>
                <TRow>
                  <td>
                    <HideSmall>dfv</HideSmall>0.2
                  </td>
                  <td>
                    06/24/<HideSmall>20</HideSmall>20
                  </td>
                  <td>Nate Foss</td>
                </TRow>
              </tbody>
            </table>
          </div>

          {/* Email CTA */}
          <EmailWrapper>
            <EmailCTA />
          </EmailWrapper>
          <TextLinks>
            <a href={links.email}>email</a>
            <a href={links.blog}>blog</a>
          </TextLinks>
          <IconLinks>
            <a className={'link-twitter'} href={links.twitter}>
              <span className={'icon-twitter'}></span>
            </a>
            <a className={'link-telegram'} href={links.telegram}>
              <span className={'icon-telegram'}></span>
            </a>
            <a className={'link-github'} href={links.github}>
              <span className={'icon-github'}></span>
            </a>
          </IconLinks>
        </Footer>
      </div>

      {/*
      <div style={styles.linksRow}>
        <Link to='/tutorial' size='lg' style={{ marginRight: '2rem' }}>
          Tutorial
        </Link>
        <Link to='/' size='lg'>
          About
        </Link>
          <BasicEmailInput isPlayer={false} /> 
      </div>
      */}
    </div>
  );
}

function _GamesTable() {
  const history = useHistory();
  const games = ['Dark Forest 0.0', 'EF Workshop 2/21', 'ETHGlobal 4/29'];
  return (
    <div style={styles.gamesTable}>
      {games.map((name, ind) => (
        <div
          key={name}
          style={{
            ...styles.gamesTableRow,
            borderBottom:
              ind !== games.length - 1 ? '2px solid #9f9f9f' : undefined,
          }}
        >
          <div style={styles.gamesTableRowContents}>
            <Text>{name}</Text>
            <div>
              <Button
                style={{ margin: '0 1rem' }}
                onClick={() => {
                  history.push('/game1');
                }}
              >
                Enter
              </Button>
              <Button
                onClick={() => {
                  history.push('/replay1');
                }}
              >
                Replay
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
