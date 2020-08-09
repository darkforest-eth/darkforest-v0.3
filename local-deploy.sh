#!/bin/bash
set -ex

(
  sleep 1
  cd eth
  yarn add scrypt
  yarn install
  yarn run deploy:dev
) &

# start up local blockchain with ganache-cli
ganache-cli --account="0x044C7963E9A89D4F8B64AB23E02E97B2E00DD57FCB60F316AC69B77135003AEF, 100000000000000000000" --account="0x523170AAE57904F24FFE1F61B7E4FF9E9A0CE7557987C2FC034EACB1C267B4AE, 100000000000000000000" --account="0x67195c963ff445314e667112ab22f4a7404bad7f9746564eb409b9bb8c6aed32, 100000000000000000000" --gasLimit="0xffffff" --blockTime=3
