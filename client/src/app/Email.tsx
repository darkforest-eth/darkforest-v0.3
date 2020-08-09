import React, { useState, useRef } from 'react';
import Button from '../components/Button';
import dfstyles from '../styles/dfstyles';
import { EmailResponse, submitInterestedEmail } from '../api/UtilityServerAPI';

const styles: {
  [name: string]: React.CSSProperties;
} = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  hwrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    background: 'rgba(0, 0, 0, 0)',
    color: dfstyles.colors.text,
    marginLeft: '8pt',
    width: '24pt',
    height: '24pt',
    borderRadius: '12pt',
    lineHeight: '24pt',
    transition: 'background 0.2s, color 0.2s',
  },
  btnHov: {
    color: dfstyles.colors.background,
    background: dfstyles.colors.text,
  },
  input: {
    padding: '2px 4px',
    borderRadius: '5px',
    border: `1px solid ${dfstyles.colors.text}`,
    transition: 'color 0.2s, background 0.2s, width 0.2s',
  },
};

export const EmailCTA = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<EmailResponse | null>(null);

  const [focus, setFocus] = useState<boolean>(false);

  const emailPopupWindowName = 'popupwindow';
  const emailFormRef = useRef<HTMLFormElement>(document.createElement('form'));

  const doSubmit = async () => {
    const response = await submitInterestedEmail(email);
    setStatus(response);
    if (response === EmailResponse.Success) {
      setEmail('');
    }
    window.open(
      'https://tinyletter.com/darkforest-eth',
      emailPopupWindowName,
      'scrollbars=yes,width=800,height=600'
    );
    emailFormRef.current.submit();
  };

  const responseToMessage = (response: EmailResponse): string => {
    if (response === EmailResponse.Success)
      return 'email successfully recorded';
    else if (response === EmailResponse.Invalid) return 'invalid address';
    else if (response === EmailResponse.ServerError) return 'server error';
    else {
      console.error('invalid email outcome');
      return '';
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.hwrapper}>
        <p
          style={{
            marginRight: '14pt',
          }}
        >
          info:
        </p>

        <form
          action={'https://tinyletter.com/darkforest-eth'}
          method={'post'}
          target={emailPopupWindowName}
          ref={emailFormRef}
        >
          <input
            style={{
              ...styles.input,
              color: focus ? dfstyles.colors.text : dfstyles.colors.subtext,
              background: focus
                ? dfstyles.colors.backgroundlighter
                : 'rgba(0, 0, 0, 0)',
              width: focus ? '9em' : '7em',
            }}
            type='text'
            name={email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={'name@email.com'}
            onKeyDown={(e) => {
              if (e.keyCode === 13) e.preventDefault();
            }}
            onKeyUp={(e) => {
              e.preventDefault();
              if (e.keyCode === 13) doSubmit();
            }}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
          />
        </form>
        <Button
          onClick={doSubmit}
          style={styles.btn}
          hoverStyle={styles.btnHov}
        >
          <span>{'>'}</span>
        </Button>
      </div>

      <p style={{ marginTop: '8px' }}>
        {status !== null ? responseToMessage(status) : <span>&nbsp;</span>}
      </p>
    </div>
  );
};
