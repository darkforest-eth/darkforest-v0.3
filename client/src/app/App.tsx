import React from 'react';

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import GameLandingPage from './GameLandingPage';
import Tutorial from './tutorial/Tutorial';
import dfstyles from '../styles/dfstyles';
import styled from 'styled-components';
import { PlanetCard } from './PlanetCard';

function App() {
  return (
    <Router>
      <Switch>
        <Route path='/tutorial' component={Tutorial} />
        <Route path='/game1' component={GameLandingPage} />
        <Route
          path='/replay1'
          render={() => <GameLandingPage replayMode={true} />}
        />
        <Route path='/' exact component={LandingPage} />
        <Route path='/planet/:location' component={PlanetCard} />
      </Switch>
    </Router>
  );
}

const AppContainer = styled.div`
  height: 100%;
  width: 100%;
  color: ${dfstyles.colors.text};
  background: ${dfstyles.colors.backgrounddark};
`;

export default function _App() {
  return (
    <AppContainer>
      <App />
    </AppContainer>
  );
}
