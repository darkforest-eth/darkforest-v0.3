import React, { useState, useEffect, useRef } from 'react';
import GameManager from '../api/GameManager';
import GameUIManagerContext from './board/GameUIManagerContext';
import GameUIManager, { GameUIManagerEvent } from './board/GameUIManager';
import AbstractGameManager from '../api/AbstractGameManager';
import {
  doesBrowserHaveAccountData,
  unsupportedFeatures,
  Incompatibility,
  enableEthereum,
} from '../api/BrowserChecks';
import {
  isAddressWhitelisted,
  submitWhitelistKey,
  submitInterestedEmail,
  submitPlayerEmail,
  EmailResponse,
} from '../api/UtilityServerAPI';
import {
  getAddress,
  handleEthereumConfigChanges,
} from '../utils/EthereumUtils';
import _ from 'lodash';
import TerminalEmitter, {
  TerminalTextStyle,
  TerminalEvent,
} from '../utils/TerminalEmitter';
import Terminal from './Terminal';
import { useHistory } from 'react-router-dom';
import ModalWindow from './ModalWindow';
import GameWindow from './GameWindow';
import {
  Wrapper,
  TerminalWrapper,
  Hidden,
  GameWindowWrapper,
} from './GameLandingPageComponents';
import UIEmitter, { UIEmitterEvent } from '../utils/UIEmitter';

enum InitState {
  NONE,
  COMPATIBILITY_CHECKS_PASSED,
  ASKING_HAS_WHITELIST_KEY,
  ASKING_WAITLIST_EMAIL,
  ASKING_WHITELIST_KEY,
  ASKING_PLAYER_EMAIL,
  FETCHING_ETH_DATA,
  ASK_ADD_ACCOUNT,
  ADD_ACCOUNT,
  NO_HOME_PLANET,
  SEARCHING_FOR_HOME_PLANET,
  ALL_CHECKS_PASS,
  COMPLETE,
  TERMINATED,
}

// doing it this way because I plan to add more later
enum ModalState {
  NONE,
  GAS_PRICES,
}

export enum InitRenderState {
  NONE,
  LOADING,
  COMPLETE,
}

export default function GameLandingPage(_props: { replayMode: boolean }) {
  const history = useHistory();
  /* terminal stuff */
  let initState = InitState.NONE;
  const [initRenderState, setInitRenderState] = useState<InitRenderState>(
    InitRenderState.NONE
  );
  useEffect(() => {
    const uiEmitter = UIEmitter.getInstance();
    uiEmitter.emit(UIEmitterEvent.UIChange);
  }, [initRenderState]);

  const [modal, setModal] = useState<ModalState>(ModalState.NONE);
  const modalClose = () => setModal(ModalState.NONE);

  const gameUIManagerRef = useRef<GameUIManager | null>(null);
  const emailFormRef = useRef<HTMLFormElement>(document.createElement('form'));
  const emailInputRef = useRef<HTMLInputElement>(
    document.createElement('input')
  );
  const emailPopupWindowName = 'popupwindow';

  const getUserInput = async () => {
    const terminalEmitter = TerminalEmitter.getInstance();
    terminalEmitter.enableUserInput();
    const ret: string = await new Promise((resolve) => {
      terminalEmitter.once(TerminalEvent.UserEnteredInput, resolve);
    });
    terminalEmitter.disableUserInput();

    return ret.trim();
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const animEllipsis = async () => {
    const terminalEmitter = TerminalEmitter.getInstance();
    const delay = 0; // TODOPR 250
    for (const _i in _.range(3)) {
      await wait(delay).then(() => terminalEmitter.print('.'));
    }
    await wait(delay * 1.5);
    return;
  };

  const submitHiddenEmailForm = async (email: string) => {
    const terminalEmitter = TerminalEmitter.getInstance();

    terminalEmitter.println(
      "Follow the instructions on the email confirmation page. Close the window when you're done.",
      TerminalTextStyle.White
    );
    const popup = window.open(
      'https://tinyletter.com/darkforest-eth',
      emailPopupWindowName,
      'scrollbars=yes,width=800,height=600'
    );
    emailInputRef.current.value = email;
    emailFormRef.current.submit();
    if (!popup) return;
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (popup.closed) {
          resolve();
          clearInterval(interval);
        }
      }, 100);
    });
  };

  const advanceStateFromNone = async () => {
    const terminalEmitter = TerminalEmitter.getInstance();

    const lastUpdated = localStorage.getItem('lastUpdated');
    if (lastUpdated) {
      const diff = Date.now() - parseInt(lastUpdated);
      // 10 min
      if (diff < 1000 * 60 * 10)
        terminalEmitter.emit(TerminalEvent.SkipAllTyping);
    }
    terminalEmitter.shell('df init');
    terminalEmitter.println('Initializing Dark Forest...');

    terminalEmitter.print('Loading zkSNARK proving key');
    await animEllipsis();
    terminalEmitter.print(' ');
    terminalEmitter.println(
      'Proving key loaded. (14.3MB)',
      TerminalTextStyle.Blue
    );

    terminalEmitter.print('Verifying zkSNARK params');
    await animEllipsis();
    terminalEmitter.print(' ');
    terminalEmitter.println(
      '28700 constraints verified.',
      TerminalTextStyle.Blue
    );

    terminalEmitter.print('Connecting to Ethereum network');
    await animEllipsis();
    terminalEmitter.print(' ');
    terminalEmitter.println('Connected to Ethereum.', TerminalTextStyle.Blue);

    terminalEmitter.print('Installing flux capacitor');
    await animEllipsis();
    terminalEmitter.print(' ');
    terminalEmitter.println(
      'Flux capacitor installed.',
      TerminalTextStyle.Blue
    );

    terminalEmitter.println('Initialization complete.');
    terminalEmitter.newline();
    const issues = await unsupportedFeatures();
    handleEthereumConfigChanges(); // this reloads the page if network/account changes, so no cleanup needed

    // $ df check
    terminalEmitter.shell('df check');

    terminalEmitter.print('Checking compatibility');
    await animEllipsis();
    terminalEmitter.print(' ');
    terminalEmitter.println(
      'Initiating (6) compatibility checks.',
      TerminalTextStyle.Blue
    );

    terminalEmitter.print('Checking if device is compatible');
    await animEllipsis();
    terminalEmitter.print(' ');
    if (issues.includes(Incompatibility.MobileOrTablet)) {
      terminalEmitter.println(
        'ERROR: Mobile or tablet device detected. Please use desktop.',
        TerminalTextStyle.Red
      );
    } else {
      terminalEmitter.println(
        'Desktop detected. Device OK.',
        TerminalTextStyle.White
      );
    }

    terminalEmitter.print('Checking if IndexedDB is present');
    await animEllipsis();
    terminalEmitter.print(' ');
    if (issues.includes(Incompatibility.NoIDB)) {
      terminalEmitter.println(
        'ERROR: IndexedDB not found. Try using a different browser.',
        TerminalTextStyle.Red
      );
    } else {
      terminalEmitter.println('IndexedDB detected.', TerminalTextStyle.White);
    }

    terminalEmitter.print('Checking if browser is supported');
    await animEllipsis();
    terminalEmitter.print(' ');
    if (issues.includes(Incompatibility.UnsupportedBrowser)) {
      terminalEmitter.println(
        'ERROR: Browser unsupported. Try Brave, Firefox, or Chrome.',
        TerminalTextStyle.Red
      );
    } else {
      terminalEmitter.println('Browser Supported.', TerminalTextStyle.White);
    }

    terminalEmitter.print('Checking for Metamask');
    await animEllipsis();
    terminalEmitter.print(' ');
    if (issues.includes(Incompatibility.NoMetamaskInstalled)) {
      terminalEmitter.println(
        'ERROR: Could not find Metamask. Please install Metamask.',
        TerminalTextStyle.Red
      );
    } else {
      terminalEmitter.println('Metamask found.', TerminalTextStyle.White);
    }

    terminalEmitter.print('Checking if Ethereum is enabled');
    await animEllipsis();
    terminalEmitter.print(' ');
    if (issues.includes(Incompatibility.NotLoggedInOrEnabled)) {
      terminalEmitter.print(
        'ERROR: Ethereum is not enabled. ',
        TerminalTextStyle.Red
      );
      terminalEmitter.printLink(
        'Click here to enable Ethereum',
        enableEthereum.bind(this),
        TerminalTextStyle.Red
      );
      terminalEmitter.println('.', TerminalTextStyle.Red);
    } else {
      terminalEmitter.println('Ethereum enabled.', TerminalTextStyle.White);
    }

    if (issues.includes(Incompatibility.NotRopsten)) {
      terminalEmitter.print('Connecting to Ropsten Testnet');
      await animEllipsis();
      terminalEmitter.print(' ');
      terminalEmitter.println(
        'ERROR: Ropsten not selected. Please select Ropsten and try again.',
        TerminalTextStyle.Red
      );
    } else {
      terminalEmitter.print('Checking Ethereum Mainnet');
      await animEllipsis();
      terminalEmitter.print(' ');
      terminalEmitter.printLink(
        'ERROR: Gas prices too high!',
        () => setModal(ModalState.GAS_PRICES),
        TerminalTextStyle.White
      );
      terminalEmitter.newline();
      terminalEmitter.print('Falling back to Ropsten');
      await animEllipsis();
      terminalEmitter.print(' ');
      terminalEmitter.println('Ropsten selected.', TerminalTextStyle.White);
    }

    if (issues.length > 0) {
      terminalEmitter.print(
        `${issues.length.toString()} errors found. `,
        TerminalTextStyle.Red
      );
      terminalEmitter.println('Please resolve them and refresh the page.');
      initState = InitState.ASKING_WAITLIST_EMAIL;
    } else {
      terminalEmitter.println('All checks passed.', TerminalTextStyle.Green);
      terminalEmitter.newline();
      initState = InitState.COMPATIBILITY_CHECKS_PASSED;
    }
  };

  const advanceStateFromCompatibilityPassed = async () => {
    const terminalEmitter = TerminalEmitter.getInstance();
    terminalEmitter.shell('df log');
    terminalEmitter.newline();
    terminalEmitter.print('    ');
    terminalEmitter.print('Version', TerminalTextStyle.Underline);
    terminalEmitter.print('    ');
    terminalEmitter.print('Date', TerminalTextStyle.Underline);
    terminalEmitter.print('              ');
    terminalEmitter.print('Champion', TerminalTextStyle.Underline);
    terminalEmitter.newline();

    terminalEmitter.print('    v0.1       ');
    terminalEmitter.println(
      '02/05/2020        Dylan Field',
      TerminalTextStyle.White
    );
    terminalEmitter.print('    v0.2       ');
    terminalEmitter.println(
      '06/06/2020        Nate Foss',
      TerminalTextStyle.White
    );
    terminalEmitter.print('    v0.3       ');
    terminalEmitter.print('08/07/2020        ', TerminalTextStyle.White);
    terminalEmitter.println('<tbd>', TerminalTextStyle.Blue);
    terminalEmitter.newline();

    const address = await getAddress();
    const isWhitelisted = await isAddressWhitelisted(address);

    terminalEmitter.shell('df join v0.3');
    terminalEmitter.print('Checking if whitelisted... (address ');
    terminalEmitter.print(address, TerminalTextStyle.White);
    terminalEmitter.println(')');

    if (isWhitelisted) {
      terminalEmitter.println('Player whitelisted.', TerminalTextStyle.Green);
      terminalEmitter.println(
        `Welcome, player ${address}.`,
        TerminalTextStyle.White
      );
      initState = InitState.FETCHING_ETH_DATA;
    } else {
      initState = InitState.ASKING_HAS_WHITELIST_KEY;
    }
  };

  const advanceStateFromAskHasWhitelistKey = async () => {
    const terminalEmitter = TerminalEmitter.getInstance();

    terminalEmitter.print(
      'Do you have a whitelist key?',
      TerminalTextStyle.White
    );
    terminalEmitter.println(' (y/n)');
    const userInput = await getUserInput();
    if (userInput === 'y') {
      initState = InitState.ASKING_WHITELIST_KEY;
    } else if (userInput === 'n') {
      initState = InitState.ASKING_WAITLIST_EMAIL;
    } else {
      terminalEmitter.println('Unrecognized input. Please try again.');
    }
  };

  const advanceStateFromAskWhitelistKey = async () => {
    const terminalEmitter = TerminalEmitter.getInstance();
    const address = await getAddress();

    terminalEmitter.println(
      'Please enter your invite key. (XXXXX-XXXXX-XXXXX-XXXXX-XXXXX)',
      TerminalTextStyle.Sub
    );

    const key = await getUserInput();

    terminalEmitter.print('Processing key... (this may take up to 30s)');
    const response = await (async () => {
      const intervalId = setInterval(() => terminalEmitter.print('.'), 3000);
      const ret = await submitWhitelistKey(key, address);
      clearInterval(intervalId);
      return ret;
    })();
    terminalEmitter.newline();

    if (!response) {
      terminalEmitter.println('ERROR: Not a valid key.', TerminalTextStyle.Red);
      initState = InitState.ASKING_WAITLIST_EMAIL;
    } else {
      terminalEmitter.print(
        'Successfully joined game. ',
        TerminalTextStyle.Green
      );
      terminalEmitter.print(`Welcome, player `);
      terminalEmitter.println(address, TerminalTextStyle.White);
      initState = InitState.ASKING_PLAYER_EMAIL;
    }
  };

  const advanceStateFromAskWaitlistEmail = async () => {
    const terminalEmitter = TerminalEmitter.getInstance();
    terminalEmitter.println(
      'Enter your email address to sign up for the whitelist.',
      TerminalTextStyle.White
    );
    const email = await getUserInput();
    terminalEmitter.print('Response pending... ');
    const response = await submitInterestedEmail(email);
    if (response === EmailResponse.Success) {
      await submitHiddenEmailForm(email);
      terminalEmitter.println(
        'Email successfully recorded. ',
        TerminalTextStyle.Green
      );
      terminalEmitter.println(
        'Keep an eye out for updates and invite keys in the next few weeks. Press ENTER to return to the homepage.',
        TerminalTextStyle.Sub
      );
      initState = InitState.TERMINATED;
      await getUserInput();
      history.push('/');
    } else if (response === EmailResponse.Invalid) {
      terminalEmitter.println(
        'Email invalid. Please try again.',
        TerminalTextStyle.Red
      );
    } else {
      terminalEmitter.print('ERROR: Server error. ', TerminalTextStyle.Red);
      terminalEmitter.print(
        'Press ENTER to return to homepage.',
        TerminalTextStyle.Sub
      );
      await getUserInput();
      initState = InitState.TERMINATED;
      history.push('/');
    }
  };

  const advanceStateFromAskPlayerEmail = async () => {
    const terminalEmitter = TerminalEmitter.getInstance();
    const address = await getAddress();

    terminalEmitter.print(
      'Enter your email address. ',
      TerminalTextStyle.White
    );
    terminalEmitter.println(
      "We'll use this email address to notify you if you win a prize."
    );
    const email = await getUserInput();
    const response = await submitPlayerEmail(email, address);
    if (response === EmailResponse.Success) {
      await submitHiddenEmailForm(email);
      terminalEmitter.println('Email successfully recorded.');
      initState = InitState.FETCHING_ETH_DATA;
    } else if (response === EmailResponse.Invalid) {
      terminalEmitter.println(
        'Email invalid. Please try again.',
        TerminalTextStyle.Red
      );
    } else {
      terminalEmitter.println(
        'Server error. Please try again, or contact administrator if problem persists.',
        TerminalTextStyle.Red
      );
    }
  };

  const advanceStateFromFetchingEthData = async () => {
    const terminalEmitter = TerminalEmitter.getInstance();

    terminalEmitter.println('Downloading data from Ethereum blockchain...');
    const newGameManager: AbstractGameManager = await GameManager.create();
    const gameUIManager = GameUIManager.create(newGameManager);

    terminalEmitter.println('Connected to DarkForestCore contract.');
    gameUIManagerRef.current = gameUIManager;
    if (!newGameManager.hasJoinedGame()) {
      initState = InitState.NO_HOME_PLANET;
    } else {
      terminalEmitter.println('Validating secret local data...');
      const browserHasData = await doesBrowserHaveAccountData(
        newGameManager.getContractAddress()
      );
      if (!browserHasData) {
        terminalEmitter.println(
          'ERROR: Account data for this player is not associated with this browser.',
          TerminalTextStyle.Red
        );
        initState = InitState.ASK_ADD_ACCOUNT;
        return;
      }
      terminalEmitter.println('Initializing game...');
      initState = InitState.ALL_CHECKS_PASS;
    }
  };

  const advanceStateFromAskAddAccount = async () => {
    const terminalEmitter = TerminalEmitter.getInstance();

    terminalEmitter.println(
      'Import account home coordinates? (y/n)',
      TerminalTextStyle.White
    );
    terminalEmitter.println(
      "If you're importing an account, make sure you know what you're doing."
    );
    const userInput = await getUserInput();
    if (userInput === 'y') {
      initState = InitState.ADD_ACCOUNT;
    } else if (userInput === 'n') {
      terminalEmitter.println('Try using a different account and reload.');
      initState = InitState.TERMINATED;
    } else {
      terminalEmitter.println('Unrecognized input. Please try again.');
    }
  };

  const advanceStateFromAddAccount = async () => {
    const terminalEmitter = TerminalEmitter.getInstance();
    const gameUIManager = gameUIManagerRef.current;
    if (gameUIManager) {
      try {
        terminalEmitter.println('x: ', TerminalTextStyle.Blue);
        const x = parseInt(await getUserInput());
        terminalEmitter.println('y: ', TerminalTextStyle.Blue);
        const y = parseInt(await getUserInput());
        if (
          Number.isNaN(x) ||
          Number.isNaN(y) ||
          Math.abs(x) > 2 ** 32 ||
          Math.abs(y) > 2 ** 32
        ) {
          throw 'Invalid home coordinates.';
        }
        if (await gameUIManager.addAccount({ x, y })) {
          terminalEmitter.println('Successfully added account.');
          terminalEmitter.println('Initializing game...');
          initState = InitState.ALL_CHECKS_PASS;
        } else {
          throw 'Invalid home coordinates.';
        }
      } catch (e) {
        terminalEmitter.println(`ERROR: ${e}`, TerminalTextStyle.Red);
        terminalEmitter.println('Please try again.');
      }
    } else {
      terminalEmitter.println(
        'ERROR: Game UI Manager not found. Terminating session.'
      );
      initState = InitState.TERMINATED;
    }
  };

  const advanceStateFromNoHomePlanet = async () => {
    const terminalEmitter = TerminalEmitter.getInstance();

    terminalEmitter.println('Welcome to DARK FOREST.');

    const gameUIManager = gameUIManagerRef.current;
    if (!gameUIManager) {
      terminalEmitter.println(
        'ERROR: Game UI Manager not found. Terminating session.'
      );
      initState = InitState.TERMINATED;
      return;
    }

    if (Date.now() / 1000 > gameUIManager.getEndTimeSeconds()) {
      terminalEmitter.println(
        'ERROR: This game has ended. Terminating session.'
      );
      initState = InitState.TERMINATED;
      return;
    }

    terminalEmitter.println(
      'Press ENTER to find a home planet. This may take up to 120s.'
    );
    await getUserInput();
    const success = await new Promise((resolve) => {
      gameUIManager
        .onJoinGameClicked()
        .once(GameUIManagerEvent.InitializedPlayer, () => {
          resolve(true);
        })
        .once(GameUIManagerEvent.InitializedPlayerError, (error) => {
          terminalEmitter.println(
            `[ERROR] An unexpected error occurred: ${error}`,
            TerminalTextStyle.Red
          );
          resolve(false);
        });
    });
    if (success) {
      terminalEmitter.println('Found suitable home planet!');
      terminalEmitter.println('Initializing game...');
      initState = InitState.ALL_CHECKS_PASS;
    }
  };

  const advanceStateFromAllChecksPass = async () => {
    const terminalEmitter = TerminalEmitter.getInstance();
    terminalEmitter.println('Press ENTER to begin.');
    await getUserInput();
    initState = InitState.COMPLETE;

    terminalEmitter.emit(TerminalEvent.SkipAllTyping);

    setInitRenderState(InitRenderState.COMPLETE);

    terminalEmitter.println(
      'Welcome to the universe of Dark Forest.',
      TerminalTextStyle.Green
    );
  };

  const advanceState = async () => {
    if (initState === InitState.NONE) {
      await advanceStateFromNone();
    } else if (initState === InitState.COMPATIBILITY_CHECKS_PASSED) {
      await advanceStateFromCompatibilityPassed();
    } else if (initState === InitState.ASKING_HAS_WHITELIST_KEY) {
      await advanceStateFromAskHasWhitelistKey();
    } else if (initState === InitState.ASKING_WHITELIST_KEY) {
      await advanceStateFromAskWhitelistKey();
    } else if (initState === InitState.ASKING_WAITLIST_EMAIL) {
      await advanceStateFromAskWaitlistEmail();
    } else if (initState === InitState.ASKING_PLAYER_EMAIL) {
      await advanceStateFromAskPlayerEmail();
    } else if (initState === InitState.FETCHING_ETH_DATA) {
      await advanceStateFromFetchingEthData();
    } else if (initState === InitState.ASK_ADD_ACCOUNT) {
      await advanceStateFromAskAddAccount();
    } else if (initState === InitState.ADD_ACCOUNT) {
      await advanceStateFromAddAccount();
    } else if (initState === InitState.NO_HOME_PLANET) {
      await advanceStateFromNoHomePlanet();
    } else if (initState === InitState.ALL_CHECKS_PASS) {
      await advanceStateFromAllChecksPass();
    }

    if (
      initState !== InitState.TERMINATED &&
      initState !== InitState.COMPLETE
    ) {
      advanceState();
    }
  };

  useEffect(() => {
    advanceState();

    return () => {
      if (gameUIManagerRef.current) {
        gameUIManagerRef.current.destroy();
        gameUIManagerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Wrapper initRender={initRenderState}>
      {modal === ModalState.GAS_PRICES && (
        <ModalWindow close={modalClose}>
          <img
            style={{ margin: '0 auto' }}
            src={'/public/img/toodamnhigh.jpg'}
          />
        </ModalWindow>
      )}

      {/* everything inside of GameWindowWrapper and TerminalWrapper
          should basically assume that they are in a fresh div. 
          the children should never exceed the contents of that div.
      */}
      <GameWindowWrapper initRender={initRenderState}>
        <GameUIManagerContext.Provider value={gameUIManagerRef.current}>
          <GameWindow />
        </GameUIManagerContext.Provider>
      </GameWindowWrapper>
      <TerminalWrapper initRender={initRenderState}>
        <Terminal />
      </TerminalWrapper>

      <Hidden>
        <form
          action={'https://tinyletter.com/darkforest-eth'}
          method={'post'}
          target={emailPopupWindowName}
          ref={emailFormRef}
        >
          <input type='text' name='email' id='tlemail' ref={emailInputRef} />
        </form>
      </Hidden>
    </Wrapper>
  );
}
