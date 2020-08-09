import React from 'react';

interface CornerProps {
  children: React.ReactNode;
  top?: boolean;
  left?: boolean;
  right?: boolean;
  bottom?: boolean;
  style?: React.CSSProperties;
}

const cornerStyle: React.CSSProperties = {
  position: 'absolute',
  margin: '4px',
};

export function Corner({
  children,
  style = {},
  top = false,
  bottom = false,
  left = false,
  right = false,
}: CornerProps) {
  const posStyles: React.CSSProperties = {
    top: top ? 0 : undefined,
    bottom: bottom ? 0 : undefined,
    left: left ? 0 : undefined,
    right: right ? 0 : undefined,
  };
  return (
    <div
      style={{
        ...posStyles,
        ...cornerStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
