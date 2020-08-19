import React, { useState, useContext, useEffect } from 'react';
import { ModalPane, ModalName, ModalHook } from './ModalPane';
import GameUIManagerContext from '../board/GameUIManagerContext';
import GameUIManager from '../board/GameUIManager';
import { Green, Sub, Red } from '../../components/Text';
import styled from 'styled-components';
import { Btn } from '../GameWindowComponents';
import dfstyles from '../../styles/dfstyles';

const MapShareWrapper = styled.div`
  width: 30em;
  height: 15em;
  display: flex;
  flex-direction: column;

  & > .row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    & .input-twitter {
      transition: background 0.2s, color 0.2s, width: 0.2s !important;
      outline: none;
      background: ${dfstyles.colors.background};
      color: ${dfstyles.colors.subtext};
      border-radius: 4px;
      border: 1px solid ${dfstyles.colors.text};
      margin-left: 0.75em;
      width: 6em;
      padding: 2px 6px;

      &:focus {
        background: ${dfstyles.colors.backgroundlight};
        color: ${dfstyles.colors.text};
        width: 8em;
      }
    }
  }

  & span.clickable {
    &:hover {
      cursor: pointer;
      text-decoration: underline;
    }
  }
  & > div,
  & > p {
    margin: 0.5em 0;
    &:first-child {
      margin-top: 0;
    }
  }

  & > .share-buttons {
    margin-top: auto;
  }
`;
export default function MapSharePane({ hook }: { hook: ModalHook }) {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);

  const [failure, setFailure] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (failure) {
      setSuccess('');
    }
  }, [failure]);

  useEffect(() => {
    if (success) {
      setFailure('');
    }
  }, [success]);

  const onExportMap = async () => {
    if (uiManager) {
      const chunks = uiManager.getExploredChunks();
      const chunksAsArray = Array.from(chunks);
      try {
        const map = JSON.stringify(chunksAsArray);
        await window.navigator.clipboard.writeText(map);
        setSuccess('Your map has been copied to the clipboard.');
      } catch (err) {
        console.error(err);
        setFailure('Failed to export map.');
      }
    } else {
      setFailure('Unable to export map right now.');
    }
  };

  const onImportMap = async () => {
    if (uiManager) {
      let input;
      try {
        input = await window.navigator.clipboard.readText();
      } catch (err) {
        console.error(err);
        setFailure('Unable to import map. Did you allow clipboard access?');
        return;
      }

      let chunks;
      try {
        chunks = JSON.parse(input);
      } catch (err) {
        console.error(err);
        setFailure('Invalid map data. Check the data in your clipboard.');
        return;
      }

      chunks.forEach((chunk) => uiManager.addNewChunk(chunk));
      setSuccess('Successfully imported a map!');
    } else {
      setFailure('Unable to import map right now.');
    }
  };

  return (
    <ModalPane hook={hook} title='Map Share' name={ModalName.MapShare}>
      <MapShareWrapper>
        <div className='row'>
          <p>Export and import explored maps.</p>
        </div>
        <div className='row'>
          <p>
            <em>
              <Red>WARNING:</Red>{' '}
              <Sub>
                Maps from others could be altered and are not guaranteed to be
                correct!
              </Sub>
            </em>
          </p>
        </div>
        <div className='row share-buttons'>
          <Btn onClick={onExportMap}>Copy my map to clipboard</Btn>
          <Btn onClick={onImportMap}>Import a map from my clipboard</Btn>
        </div>
        <p>
          {failure && <Red>ERROR: {failure}</Red>}
          {success && <Green>SUCCESS: {success}</Green>}
        </p>
      </MapShareWrapper>
    </ModalPane>
  );
}
