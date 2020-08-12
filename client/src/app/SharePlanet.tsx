import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import styled from 'styled-components';
import { Planet } from '../_types/global/GlobalTypes';
import { PlanetScape } from './GameWindowPanes/PlanetScape';
import { getPlanetShortHash } from '../utils/Utils';
import {
  getPlanetName,
  getPlanetBlurb,
  getPlanetTagline,
} from '../utils/ProcgenUtils';
import LandingPageCanvas from './LandingPageCanvas';
import dfstyles from '../styles/dfstyles';
import { Sub } from '../components/Text';

const PlanetCard = styled.div`
  width: 36em;
  margin: 2em auto;
  font-size: 14pt;
  z-index: 1000;
  background: ${dfstyles.colors.background};
  border-radius: 3px;
  border: 1px solid ${dfstyles.colors.text};

  & > div {
    width: 100%;
    padding: 0.5em;
    &:nth-child(1) {
      // header
      border-bottom: 1px solid ${dfstyles.colors.subtext};
    }
    &:nth-child(2) {
      // scape
      height: 350px;
    }
  }
`;

const SharePlanetWrapper = styled.div`
  width: 100%;
  height: 100%;

  & p {
    margin: 0.5em 0;
    & a {
      color: ${dfstyles.colors.dfblue};
      &:hover {
        text-decoration: underline;
      }
    }
  }
`;

export function SharePlanet({ match }: RouteComponentProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { location } = match.params as any;

  const planet = { locationId: location } as Planet;

  return (
    <SharePlanetWrapper>
      <LandingPageCanvas />
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          zIndex: 2,
        }}
      >
        <PlanetCard>
          <div>
            {getPlanetShortHash(planet)} {getPlanetName(planet)}
          </div>
          <div>
            <PlanetScape planet={planet} keepDrawing={true} />
          </div>
          <div>
            <p>
              <em>A {getPlanetTagline(planet)}...</em>
              <p>
                <Sub>{getPlanetBlurb(planet)}</Sub>
              </p>
            </p>
            <p>
              Find this planet in-game at <a href='/'>http://zkga.me</a> to read
              more!
            </p>
          </div>
        </PlanetCard>
      </div>
    </SharePlanetWrapper>
  );
}
