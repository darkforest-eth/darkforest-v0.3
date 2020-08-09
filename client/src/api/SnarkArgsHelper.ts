import {
  ContractCallArgs,
  InitializePlayerArgs,
  MoveSnarkArgs,
} from '../_types/darkforest/api/EthereumAPITypes';
import { Circuit, CircuitDef } from 'snarkjs';
import { witnessObjToBuffer } from '../utils/Utils';
import { WebsnarkProof } from '../_types/global/GlobalTypes';
import { BigInteger } from 'big-integer';
import mimcHash, { modPBigInt, modPBigIntNative } from '../miner/mimc';
import * as bigInt from 'big-integer';
import { fakeHash } from '../miner/permutation';
import TerminalEmitter, { TerminalTextStyle } from '../utils/TerminalEmitter';

interface InitInfo {
  x: string;
  y: string;
  p: string;
  r: string;
}

interface MoveInfo {
  x1: string;
  y1: string;
  x2: string;
  y2: string;
  p2: string;
  r: string;
  distMax: string;
}

const zkSnark = require('snarkjs');

class SnarkArgsHelper {
  private readonly initCircuit: Circuit;
  private readonly moveCircuit: Circuit;
  private readonly provingKeyInit: ArrayBuffer;
  private readonly provingKeyMove: ArrayBuffer;
  private readonly useMockHash: boolean;

  private constructor(
    provingKeyInit: ArrayBuffer,
    provingKeyMove: ArrayBuffer,
    initCircuit: CircuitDef,
    moveCircuit: CircuitDef,
    useMockHash: boolean
  ) {
    this.initCircuit = new zkSnark.Circuit(initCircuit);
    this.moveCircuit = new zkSnark.Circuit(moveCircuit);
    this.provingKeyInit = provingKeyInit;
    this.provingKeyMove = provingKeyMove;
    this.useMockHash = useMockHash;
  }

  destroy(): void {
    // don't need to do anything
  }

  static async create(fakeHash = false): Promise<SnarkArgsHelper> {
    // we don't do the usual webpack stuff
    // instead we do this based on the example from https://github.com/iden3/websnark

    const initCircuit: CircuitDef = await fetch(
      './public/circuits/init/circuit.json'
    ).then((x) => x.json());
    const moveCircuit: CircuitDef = await fetch(
      './public/circuits/move/circuit.json'
    ).then((x) => x.json());

    const provingKeyInitBin = await fetch('./public/proving_key_init.bin');
    const provingKeyInit = await provingKeyInitBin.arrayBuffer();
    const provingKeyMoveBin = await fetch('./public/proving_key_move.bin'); // proving_keys needs to be in `public`
    const provingKeyMove = await provingKeyMoveBin.arrayBuffer();

    const snarkArgsHelper = new SnarkArgsHelper(
      provingKeyInit,
      provingKeyMove,
      initCircuit,
      moveCircuit,
      fakeHash
    );

    return snarkArgsHelper;
  }

  async getInitArgs(
    x: number,
    y: number,
    p: number,
    r: number
  ): Promise<InitializePlayerArgs> {
    const start = Date.now();
    const terminalEmitter = TerminalEmitter.getInstance();
    terminalEmitter.println(
      'INIT: calculating witness and proof',
      TerminalTextStyle.Sub
    );
    const input: InitInfo = {
      x: modPBigInt(x).toString(),
      y: modPBigInt(y).toString(),
      p: modPBigInt(p).toString(),
      r: r.toString(),
    };
    const witness: ArrayBuffer = witnessObjToBuffer(
      this.initCircuit.calculateWitness(input)
    );

    const hash = this.useMockHash ? fakeHash(x, y) : mimcHash(x, y);
    const publicSignals: BigInteger[] = [hash, bigInt(p), bigInt(r)];
    const snarkProof: WebsnarkProof = await window.genZKSnarkProof(
      witness,
      this.provingKeyInit
    );
    const ret = this.callArgsFromProofAndSignals(
      snarkProof,
      publicSignals.map((x) => modPBigIntNative(x))
    ) as InitializePlayerArgs;
    const end = Date.now();
    terminalEmitter.println(
      `INIT: calculated witness and proof in ${end - start}ms`,
      TerminalTextStyle.Sub
    );

    return ret;
  }

  async getMoveArgs(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    p2: number,
    r: number,
    distMax: number
  ): Promise<MoveSnarkArgs> {
    const terminalEmitter = TerminalEmitter.getInstance();

    const start = Date.now();
    terminalEmitter.println(
      'MOVE: calculating witness and proof',
      TerminalTextStyle.Sub
    );
    const input: MoveInfo = {
      x1: modPBigInt(x1).toString(),
      y1: modPBigInt(y1).toString(),
      x2: modPBigInt(x2).toString(),
      y2: modPBigInt(y2).toString(),
      p2: modPBigInt(p2).toString(),
      r: r.toString(),
      distMax: distMax.toString(),
    };

    const witness: ArrayBuffer = witnessObjToBuffer(
      this.moveCircuit.calculateWitness(input)
    );

    const snarkProof: WebsnarkProof = await window.genZKSnarkProof(
      witness,
      this.provingKeyMove
    );
    const hash1 = this.useMockHash ? fakeHash(x1, y1) : mimcHash(x1, y1);
    const hash2 = this.useMockHash ? fakeHash(x2, y2) : mimcHash(x2, y2);
    const publicSignals: BigInteger[] = [
      hash1,
      hash2,
      bigInt(p2),
      bigInt(r),
      bigInt(distMax),
    ];
    const end = Date.now();
    terminalEmitter.println(
      `MOVE: calculated witness and proof in ${end - start}ms`,
      TerminalTextStyle.Sub
    );
    const proofArgs = this.callArgsFromProofAndSignals(
      snarkProof,
      publicSignals.map((x) => modPBigIntNative(x))
    );
    return proofArgs as MoveSnarkArgs;
  }

  private callArgsFromProofAndSignals(
    snarkProof: WebsnarkProof,
    publicSignals: BigInteger[]
  ): ContractCallArgs {
    // the object returned by genZKSnarkProof needs to be massaged into a set of parameters the verifying contract
    // will accept
    return [
      snarkProof.pi_a.slice(0, 2), // pi_a
      // genZKSnarkProof reverses values in the inner arrays of pi_b
      [snarkProof.pi_b[0].reverse(), snarkProof.pi_b[1].reverse()], // pi_b
      snarkProof.pi_c.slice(0, 2), // pi_c
      publicSignals.map((signal) => signal.toString(10)), // input
    ];
  }
}

export default SnarkArgsHelper;
