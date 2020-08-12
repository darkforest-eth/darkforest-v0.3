import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import dfstyles from '../styles/dfstyles';
import Typist from 'react-typist';
import TerminalEmitter, {
  TerminalEvent,
  TerminalTextStyle,
} from '../utils/TerminalEmitter';
import _ from 'lodash';
import {
  Green,
  Prompt,
  Blue,
  Sub,
  White,
  Red,
  Invisible,
  BasicLink,
} from '../components/Text';

const TerminalContainer = styled.div`
  height: 100%;
  width: 100%;
  margin: 0 auto;
  overflow: scroll;
  white-space: pre-wrap;
  overflow-wrap: break-word;

  // & .myinput {
  //   &:focus {
  //     background: ${dfstyles.colors.backgroundlight} !important;
  //   }
  // }

  & span {
    word-break: break-all;
  }

  & div.Typist {
    display: inline;
  }

  @media (max-width: ${dfstyles.screenSizeS}) {
    font-size: ${dfstyles.fontSizeXS};
  }
`;
type TypistProps = {
  startDelay: number;
  avgTypingDelay: number;
  stdTypingDelay: number;
  cursor: { show: boolean };
};
type FragmentData = {
  fragment: React.ReactNode;
  skipTyping: boolean;
  typistProps: TypistProps;
};

export const defaultTypistProps = {
  startDelay: 0,
  avgTypingDelay: 0,
  stdTypingDelay: 0,
  cursor: { show: false },
};

export const shellProps = defaultTypistProps;

// export const shellProps = {
//   startDelay: 125,
//   avgTypingDelay: 75,
//   stdTypingDelay: 35,
//   cursor: { show: false },
// };

const ENTER_KEY_CODE = 13;

type FragmentHook = [number, (fn: (x: number) => number) => void];
function TerminalFragment({
  fragment,
  fragmentHook,
  skipAllTyping,
  idx,
  onCharTyped,
}: {
  fragment: FragmentData;
  fragmentHook: FragmentHook;
  skipAllTyping: boolean;
  idx: number;
  onCharTyped: () => void;
}) {
  const [fragmentNo, setFragmentNo] = fragmentHook;

  if (idx < fragmentNo) {
    return <span>{fragment.fragment}</span>;
  }
  if (idx === fragmentNo) {
    if (!fragment.skipTyping && !skipAllTyping) {
      return (
        <Typist
          onCharacterTyped={onCharTyped}
          onTypingDone={() => {
            setFragmentNo((x) => x + 1);
          }}
          {...fragment.typistProps}
        >
          {fragment.fragment}
        </Typist>
      );
    } else {
      setFragmentNo((x) => x + 1);
      return <span></span>;
    }
  }

  return <span></span>;
}

export default function Terminal() {
  const ref = useRef(document.createElement('div'));
  const inputRef = useRef(document.createElement('input'));

  const [fragments, setFragments] = useState<FragmentData[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const [userInputEnabled, setUserInputEnabled] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const fragmentHook = useState<number>(0);
  const [fragmentNo, _setFragmentNo] = fragmentHook;

  const [skipAllTyping, setSkipAllTyping] = useState<boolean>(false);

  const newline = () => {
    setFragments((lines) =>
      _.concat(lines, [
        {
          fragment: <br />,
          skipTyping: true,
          typistProps: defaultTypistProps,
        },
      ])
    );
  };

  const print = (
    str,
    style: TerminalTextStyle = TerminalTextStyle.Default,
    skipTyping = false,
    onClick: (() => void) | undefined = undefined,
    typistProps: TypistProps | undefined = undefined
  ) => {
    setFragments((fragments) => {
      let fragment: React.ReactNode;
      let innerFragment: React.ReactNode = <span>{str}</span>;

      if (onClick !== undefined) {
        innerFragment = (
          <BasicLink onClick={onClick}>{innerFragment}</BasicLink>
        );
      }

      switch (style) {
        case TerminalTextStyle.Green:
          fragment = <Green>{innerFragment}</Green>;
          break;
        case TerminalTextStyle.Blue:
          fragment = <Blue>{innerFragment}</Blue>;
          break;
        case TerminalTextStyle.Sub:
          fragment = <Sub>{innerFragment}</Sub>;
          break;
        case TerminalTextStyle.White:
          fragment = <White>{innerFragment}</White>;
          break;
        case TerminalTextStyle.Red:
          fragment = <Red>{innerFragment}</Red>;
          break;
        case TerminalTextStyle.Invisible:
          fragment = <Invisible>{innerFragment}</Invisible>;
          break;
        case TerminalTextStyle.Underline:
          fragment = (
            <Sub>
              <u>{innerFragment}</u>
            </Sub>
          ); // only sub u for now
          break;
        default:
          fragment = <Sub>{innerFragment}</Sub>;
      }
      return _.concat(fragments, [
        {
          fragment,
          skipTyping,
          typistProps: typistProps || defaultTypistProps,
        },
      ]);
    });
  };

  const doEnter = (e) => {
    (async () => {
      if (e.keyCode === ENTER_KEY_CODE && !isTyping) {
        print('> ', TerminalTextStyle.Blue, true);
        print(inputText, TerminalTextStyle.White, true);
        newline();
        TerminalEmitter.getInstance().emit(
          TerminalEvent.UserEnteredInput,
          inputText
        );
        inputRef.current.value = '';
        setInputText('');
      }
    })();
  };

  useEffect(() => {
    const terminalEmitter = TerminalEmitter.getInstance();

    terminalEmitter
      .on(
        TerminalEvent.Print,
        (
          str: string,
          style?: TerminalTextStyle,
          skipTyping?: boolean,
          typistProps?: TypistProps
        ) => {
          print(str, style, skipTyping, undefined, typistProps);
        }
      )
      .on(
        TerminalEvent.PrintLink,
        (
          str: string,
          onClick: () => void,
          style: TerminalTextStyle,
          skipTyping: boolean
        ) => {
          print(str, style, skipTyping, onClick);
        }
      )
      .on(TerminalEvent.Newline, newline)
      .on(TerminalEvent.EnableUserInput, () => {
        setUserInputEnabled(true);
      })
      .on(TerminalEvent.DisableUserInput, () => {
        setUserInputEnabled(false);
      })
      .on(TerminalEvent.SkipAllTyping, () => {
        setSkipAllTyping(true);
      });
  }, []);

  useEffect(() => {
    if (userInputEnabled) {
      inputRef.current.focus();
    }
  }, [userInputEnabled]);

  const scrollToEnd = () => {
    const el = ref.current;
    el.scrollTo(0, el.scrollHeight);
  };

  useEffect(() => {
    setIsTyping(fragmentNo < fragments.length);
    scrollToEnd();
  }, [fragmentNo, fragments]);

  return (
    <TerminalContainer ref={ref}>
      {fragments.map(
        // this allows us to print only the last 200 messages without react yelling at us
        (fragment, idx) =>
          idx > fragments.length - 200 && (
            <span key={idx}>
              <TerminalFragment
                fragment={fragment}
                fragmentHook={fragmentHook}
                skipAllTyping={skipAllTyping}
                idx={idx}
                onCharTyped={scrollToEnd}
              />
            </span>
          )
      )}

      {/* User input prompt */}

      <p
        style={{
          opacity: userInputEnabled ? 1 : 0,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-start',
        }}
        onClick={() => {
          if (userInputEnabled && !isTyping) inputRef.current.focus();
        }}
      >
        <Prompt />
        {/* <span>{inputText}</span> */}
        <input
          type='text'
          style={{
            background: 'none',
            outline: 'none',
            border: 'none',
            color: dfstyles.colors.text,
            // caretColor: 'transparent',
            flexGrow: 1,
          }}
          className={'myinput'}
          ref={inputRef}
          onBlur={() => {
            if (userInputEnabled) inputRef.current.focus();
          }}
          onFocus={() => {
            if (!userInputEnabled) inputRef.current.blur();
          }}
          onKeyDown={doEnter}
          onChange={() => {
            if (userInputEnabled) {
              setInputText(inputRef.current.value);
            }
          }}
        />
        {/* <BlinkCursor /> */}
      </p>
    </TerminalContainer>
  );
}
