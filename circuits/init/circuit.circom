/*
    Prove: I know (x,y) such that:
    - x^2 + y^2 <= r^2
    - perlin(x, y) = p
    - MiMCSponge(x,y) = pub
*/

include "../../client/node_modules/circomlib/circuits/mimcsponge.circom"
include "../../client/node_modules/circomlib/circuits/comparators.circom"
include "../range_proof/circuit.circom"
// include "../perlin/compiled.circom"

template Main() {
    signal private input x;
    signal private input y;
    signal input p;
    signal input r;

    signal output pub;

    /* check abs(x), abs(y), abs(r) < 2^32 */
    component rp = MultiRangeProof(2, 40, 2 ** 32);
    rp.in[0] <== x;
    rp.in[1] <== y;

    /* check x^2 + y^2 < r^2 */
    component comp = LessThan(32);
    signal xSq;
    signal ySq;
    signal rSq;
    xSq <== x * x;
    ySq <== y * y;
    rSq <== r * r;
    comp.in[0] <== xSq + ySq
    comp.in[1] <== rSq
    comp.out === 1;

    /* check MiMCSponge(x,y) = pub */
    /*
        220 = 2 * ceil(log_5 p), as specified by mimc paper, where
        p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
    */
    component mimc = MiMCSponge(2, 220, 1);

    mimc.ins[0] <== x;
    mimc.ins[1] <== y;
    mimc.k <== 0;

    pub <== mimc.outs[0];

    /* check perlin(x, y) = p */
    /*
    component perlin = MultiScalePerlin(3);
    perlin.p[0] <== x;
    perlin.p[1] <== y;
    p === perlin.out;
    */
}

component main = Main();