import _ from 'lodash';
import React, { useContext, useEffect, useState, useCallback } from 'react';
import UIEmitter, { UIEmitterEvent } from '../utils/UIEmitter';
import { Planet } from '../_types/global/GlobalTypes';
import ControllableCanvas from './board/ControllableCanvas';
import GameUIManager from './board/GameUIManager';
import GameUIManagerContext from './board/GameUIManagerContext';
import {
  CanvasContainer,
  CanvasWrapper,
  MainWindow,
  MenuBar,
  ModalWrapper,
  Sidebar,
  Toolbar,
  WindowWrapper,
} from './GameWindowComponents';
import CoordsPane from './GameWindowPanes/CoordsPane';
import MiningPane from './GameWindowPanes/MiningPane';
import PlanetDetailsPane from './GameWindowPanes/PlanetDetailsPane';
import PlanetFlavorPane from './GameWindowPanes/PlanetFlavorPane';
import PlanetInfoPane from './GameWindowPanes/PlanetInfoPane';
import PlayerInfoPane from './GameWindowPanes/PlayerInfoPane';
import UpgradeInfoPane from './GameWindowPanes/UpgradeInfoPane';
import FleetPane from './GameWindowPanes/FleetPane';
import { ModalIcon, ModalName } from './GameWindowPanes/ModalPane';
import HelpPane from './GameWindowPanes/HelpPane';
import LeaderboardPane from './GameWindowPanes/LeaderboardPane';
import PlanetDexPane from './GameWindowPanes/PlanetDexPane';
import UpgradeDetailsPane from './GameWindowPanes/UpgradeDetailsPane';
import TwitterVerifyPane from './GameWindowPanes/TwitterVerifyPane';
import TwitterBroadcastPane from './TwitterBroadcastPane';
import ZoomPane from './GameWindowPanes/ZoomPane';
import Tooltip from './GameWindowPanes/Tooltip';
import {
  SilverTooltipPane,
  PopulationTooltipPane,
  RangeTooltipPane,
  ModalHelpTooltipPane,
  ModalPlanetDetailsTooltipPane,
  ModalPlanetDexTooltipPane,
  ModalUpgradeDetailsTooltipPane,
  ModalLeaderboardTooltipPane,
  ModalTwitterVerificationTooltipPane,
  ModalTwitterBroadcastTooltipPane,
  SelectedSilverTooltipPane,
  SelectedPopulationTooltipPane,
  RankTooltipPane,
  ScoreTooltipTooltipPane,
  TwitterHandleTooltipPane,
  MiningPauseTooltipPane,
  MiningTargetTooltipPane,
  HashesPerSecTooltipPane,
  CurrentMiningTooltipPane,
  MinPopTooltipPane,
  Time90TooltipPane,
  Time50TooltipPane,
  BonusTooltipPane,
  PopGrowthTooltipPane,
  SilverGrowthTooltipPane,
  SilverCapTooltipPane,
  SilverMaxTooltipPane,
  PiratesTooltipPane,
  UpgradesTooltipPane,
  BonusPopCapTooltipPane,
  PlanetRankTooltipPane,
  BonusPopGroTooltipPane,
  BonusSilCapTooltipPane,
  BonusSilGroTooltipPane,
  BonusRangeTooltipPane,
  MaxLevelTooltipPane,
  SilverProdTooltipPane,
  ClownTooltipPane,
} from './GameWindowPanes/TooltipPanes';

export const enum GameWindowZIndex {
  Toggler = 3,
  MenuBar = 4,
  Modal = 1000,

  Tooltip = 16000000,
}

export default function GameWindow() {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const [selected, setSelected] = useState<Planet | null>(null);

  const planetDetHook = useState<boolean>(false);
  const helpHook = useState<boolean>(true);
  const leaderboardHook = useState<boolean>(false);
  const planetdexHook = useState<boolean>(false);
  const upgradeDetHook = useState<boolean>(false);
  const twitterVerifyHook = useState<boolean>(false);
  const twitterBroadcastHook = useState<boolean>(false);

  const [score, setScore] = useState<number>(0);
  const [rank, setRank] = useState<number>(0);

  useEffect(() => {
    if (!uiManager) return;

    const onKeypress = (e) => {
      if (e.key === 'Escape') {
        setSelected(null);
        uiManager?.setSelectedPlanet(null);
      }
    };

    document.addEventListener('keydown', onKeypress);
    return () => {
      document.removeEventListener('keydown', onKeypress);
    };
  }, [uiManager]);

  const [tick, setTick] = useState<number>(0);
  const update = useCallback(() => {
    setTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    const updateSelected = () => {
      if (!uiManager) {
        console.error('GameUIManager context is null');
        return;
      }
      setSelected(uiManager.getSelectedPlanet());
    };

    const refreshUI = () => {
      update();
      if (!uiManager) return;
      // need to copy in order to refresh the refs for react
      setSelected(_.clone(uiManager.getSelectedPlanet()));
      localStorage.setItem('lastUpdated', Date.now().toString());
    };

    const intervalId = setInterval(refreshUI, 2000);
    // const intervalId = 0;

    const uiEmitter = UIEmitter.getInstance();
    uiEmitter.on(UIEmitterEvent.GamePlanetSelected, updateSelected);

    return () => {
      uiEmitter.removeListener(
        UIEmitterEvent.GamePlanetSelected,
        updateSelected
      );
      clearInterval(intervalId);
    };
  }, [uiManager, update]);

  return (
    <WindowWrapper>
      <Tooltip>
        <SilverTooltipPane />
        <PopulationTooltipPane />
        <RangeTooltipPane />

        <SelectedSilverTooltipPane selected={selected} />
        <SelectedPopulationTooltipPane selected={selected} />

        <RankTooltipPane />
        <ScoreTooltipTooltipPane />
        <TwitterHandleTooltipPane />
        <MiningPauseTooltipPane />
        <MiningTargetTooltipPane />
        <BonusTooltipPane />
        <PlanetRankTooltipPane selected={selected} />

        <HashesPerSecTooltipPane />
        <CurrentMiningTooltipPane />

        <PiratesTooltipPane />
        <UpgradesTooltipPane />

        <BonusPopCapTooltipPane />
        <BonusPopGroTooltipPane />
        <BonusSilCapTooltipPane selected={selected} />
        <BonusSilGroTooltipPane selected={selected} />
        <BonusRangeTooltipPane />
        <MaxLevelTooltipPane />
        <SilverProdTooltipPane />

        <ClownTooltipPane selected={selected} />

        <MinPopTooltipPane />
        <Time50TooltipPane />
        <Time90TooltipPane />

        <PopGrowthTooltipPane />
        <SilverGrowthTooltipPane />
        <SilverCapTooltipPane />
        <SilverMaxTooltipPane />

        <ModalHelpTooltipPane />
        <ModalPlanetDetailsTooltipPane />
        <ModalLeaderboardTooltipPane />
        <ModalPlanetDexTooltipPane />
        <ModalUpgradeDetailsTooltipPane />
        <ModalTwitterVerificationTooltipPane />
        <ModalTwitterBroadcastTooltipPane />
      </Tooltip>

      {/* modals */}
      <ModalWrapper>
        <PlanetDetailsPane hook={planetDetHook} selected={selected} />
        <HelpPane hook={helpHook} />
        <LeaderboardPane
          hook={leaderboardHook}
          setScore={setScore}
          setRank={setRank}
        />
        <PlanetDexPane
          selected={selected}
          hook={planetdexHook}
          _updater={tick}
        />
        <UpgradeDetailsPane hook={upgradeDetHook} selected={selected} />
        <TwitterVerifyPane hook={twitterVerifyHook} />
        <TwitterBroadcastPane hook={twitterBroadcastHook} selected={selected} />
      </ModalWrapper>

      <MainWindow>
        {/* sidebar */}
        <Sidebar>
          <PlayerInfoPane
            _updater={tick}
            hook={twitterVerifyHook}
            score={score}
            rank={rank}
          />
          <MiningPane _updater={tick} />
          <FleetPane selected={selected} />
          <PlanetDexPane
            selected={selected}
            small
            hook={planetdexHook}
            _updater={tick}
          />
        </Sidebar>

        {/* canvas and stuff */}
        <CanvasContainer>
          <MenuBar>
            <ModalIcon hook={helpHook} modal={ModalName.Help} />
            <ModalIcon hook={planetDetHook} modal={ModalName.PlanetDetails} />
            <ModalIcon hook={leaderboardHook} modal={ModalName.Leaderboard} />
            <ModalIcon hook={planetdexHook} modal={ModalName.PlanetDex} />
            <ModalIcon hook={upgradeDetHook} modal={ModalName.UpgradeDetails} />
            <ModalIcon
              hook={twitterVerifyHook}
              modal={ModalName.TwitterVerification}
            />
            <ModalIcon
              hook={twitterBroadcastHook}
              modal={ModalName.TwitterBroadcast}
            />
          </MenuBar>
          <CanvasWrapper>
            <ControllableCanvas />
          </CanvasWrapper>
          <CoordsPane />
          <ZoomPane />
        </CanvasContainer>
      </MainWindow>

      {/* toolbar */}
      <Toolbar>
        <PlanetInfoPane selected={selected} hook={planetDetHook} />
        <UpgradeInfoPane selected={selected} hook={upgradeDetHook} />
        <PlanetFlavorPane selected={selected} hook={planetDetHook} />
      </Toolbar>
    </WindowWrapper>
  );
}
