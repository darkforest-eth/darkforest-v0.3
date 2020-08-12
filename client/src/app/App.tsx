import React from 'react';

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import GameLandingPage from './GameLandingPage';
import dfstyles from '../styles/dfstyles';
import styled from 'styled-components';
import { SharePlanet } from './SharePlanet';

function App() {
  return (
    <Router>
      <Switch>
        <Route path='/game1' component={GameLandingPage} />
        <Route
          path='/replay1'
          render={() => <GameLandingPage replayMode={true} />}
        />
        <Route path='/' exact component={LandingPage} />
        <Route path='/planet:location' component={SharePlanet} />
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
