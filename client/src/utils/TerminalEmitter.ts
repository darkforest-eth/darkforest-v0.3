import { EventEmitter } from 'events';
import { defaultTypistProps, shellProps } from '../app/Terminal';

export enum TerminalTextStyle {
  Green,
  Sub,
  White,
  Red,
  Blue,
  Invisible,
  Default,
  Underline,
}

export enum TerminalEvent {
  Print = 'Print',
  PrintLink = 'PrintLink',
  PrintLn = 'PrintLn',
  Newline = 'Newline',
  Shell = 'Shell',
  EnableUserInput = 'EnableUserInput',
  DisableUserInput = 'DisableUserInput',
  UserEnteredInput = 'UserEnteredInput',
  SkipAllTyping = 'SkipAllTyping',
}

class TerminalEmitter extends EventEmitter {
  static instance: TerminalEmitter;

  private constructor() {
    super();
  }

  static getInstance(): TerminalEmitter {
    if (!TerminalEmitter.instance) {
      TerminalEmitter.instance = new TerminalEmitter();
    }

    return TerminalEmitter.instance;
  }

  static initialize(): TerminalEmitter {
    const terminalEmitter = new TerminalEmitter();

    return terminalEmitter;
  }

  print(
    str: string,
    style: TerminalTextStyle = TerminalTextStyle.Default,
    skipTyping = false,
    typistProps = defaultTypistProps
  ) {
    this.emit(TerminalEvent.Print, str, style, skipTyping, typistProps);
  }

  newline() {
    this.emit(TerminalEvent.Newline);
  }

  println(
    str: string,
    style: TerminalTextStyle = TerminalTextStyle.Default,
    skipTyping = false,
    typistProps = defaultTypistProps
  ) {
    this.emit(TerminalEvent.Print, str, style, skipTyping, typistProps);
    this.emit(TerminalEvent.Newline);
  }

  printLink(
    str: string,
    onClick: () => void,
    style: TerminalTextStyle = TerminalTextStyle.Default,
    skipTyping = false
  ) {
    this.emit(TerminalEvent.PrintLink, str, onClick, style, skipTyping);
  }

  shell(str: string) {
    this.emit(
      TerminalEvent.Print,
      '$ ',
      TerminalTextStyle.Green,
      false,
      shellProps
    );
    this.emit(
      TerminalEvent.Print,
      str,
      TerminalTextStyle.White,
      false,
      shellProps
    );
    this.emit(TerminalEvent.Newline);
  }

  enableUserInput() {
    this.emit(TerminalEvent.EnableUserInput);
  }

  disableUserInput() {
    this.emit(TerminalEvent.DisableUserInput);
  }
}

export default TerminalEmitter;
