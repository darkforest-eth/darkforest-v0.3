import React from 'react';
import styled from 'styled-components';
import dfstyles from '../styles/dfstyles';

const ModalWrapper = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;

  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;

  z-index: 9999;
`;

const ModalBackground = styled.div`
  position: relative;
  pointer-events: all;

  height: fit-content;
  width: fit-content;
  padding: 2em;

  background: ${dfstyles.colors.background};
  border: 1px solid ${dfstyles.colors.text};
  border-radius: 3px;
`;

const ModalContent = styled.div``;

const CloseButton = styled.span`
  color: ${dfstyles.colors.text};
  position: absolute;
  right: 6px;
  top: 0px;
  font-size: 16pt;
  cursor: pointer;
`;

export default function ModalWindow({
  children,
  close,
}: {
  children: React.ReactNode;
  close: () => void;
}) {
  return (
    <ModalWrapper>
      <ModalBackground>
        <CloseButton onClick={close}>x</CloseButton>
        <ModalContent>{children}</ModalContent>
      </ModalBackground>
    </ModalWrapper>
  );
}
