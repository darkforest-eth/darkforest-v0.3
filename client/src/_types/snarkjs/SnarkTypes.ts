declare module 'snarkjs' {
  import { BigInteger } from 'big-integer';

  interface CircuitComponent {
    name: string;
    params: { [key: string]: string };
    template: string;
    inputSignals: number;
  }

  interface Signal {
    names: string[];
    triggerComponents: number[];
  }

  type Constraint = Array<any>;

  interface CircuitDef {
    nPubInputs: number;
    nPrvInputs: number;
    nInputs: number;
    nOutputs: number;
    nVars: number;
    nSignals: number;
    nConstants: number;
    signalName2Idx: { [signalName: string]: number };
    components: CircuitComponent[];
    componentName2Idx: { [componentName: string]: number };
    signals: Signal[];
    constraints: Constraint[];
    templates: { [componentName: string]: string };
    functions: { [fnName: string]: { params: string[]; func: string } };
  }

  type Witness = Array<BigInteger>;

  export class Circuit {
    nPubInputs: number;
    nPrvInputs: number;
    nInputs: number;
    nOutputs: number;
    nVars: number;
    nSignals: number;
    nConstants: number;
    nConstraints: number;
    signalName2Idx: { [signalName: string]: number };
    components: CircuitComponent[];
    componentName2Idx: { [componentName: string]: number };
    signals: Signal[];
    constraints: any[][];
    templates: any;
    functions: { [fnName: string]: { params: string[]; func: any } };

    constructor(circuitDef: CircuitDef);

    calculateWitness(input: any, log?: (...args: any[]) => void): Witness;
  }

  export function stringifyBigInts(o: BigInteger): string;
}
