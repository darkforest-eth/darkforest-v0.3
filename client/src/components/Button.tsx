import React, { useState } from 'react';

interface ButtonProps {
  onClick?(event: React.MouseEvent<HTMLButtonElement>): Promise<void> | void;
  children: React.ReactNode;
  style?: React.CSSProperties;
  hoverStyle?: React.CSSProperties;
}

export default function Button({
  children,
  onClick: _onClick = () => {},
  style = {},
  hoverStyle = {},
  ...rest
}: ButtonProps) {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [hover, setHover] = useState<boolean>(false);

  return (
    <button
      disabled={submitting}
      onClick={async (e) => {
        setSubmitting(true);
        await _onClick(e);
        setSubmitting(false);
      }}
      style={{
        cursor: submitting ? 'not-allowed' : '',
        width: 'fit-content',
        ...style,
        ...(hover ? hoverStyle : {}),
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...rest}
    >
      {children}
    </button>
  );
}
