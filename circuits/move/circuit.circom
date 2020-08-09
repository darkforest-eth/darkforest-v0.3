/*
    Prove: I know (x1,y1,x2,y2,p2,r2,distMax) such that:
    - x2^2 + y2^2 <= r^2
    - perlin(x2, y2) = p2
    - (x1-x2)^2 + (y1-y2)^2 <= distMax^2
    - MiMCSponge(x1,y1) = pub1
    - MiMCSponge(x2,y2) = pub2
*/

include "../../client/node_modules/circomlib/circuits/mimcsponge.circom"
include "../../client/node_modules/circomlib/circuits/comparators.circom"
include "../range_proof/circuit.circom"
// include "../perlin/compiled.circom"

template Main() {
    signal private input x1;
    signal private input y1;
    signal private input x2;
    signal private input y2;
    signal input p2;
    signal input r;
    signal input distMax;

    signal output pub1;
    signal output pub2;

    /* check abs(x1), abs(y1), abs(x2), abs(y2) < 2 ** 32 */
    component rp = MultiRangeProof(4, 40, 2 ** 32);
    rp.in[0] <== x1;
    rp.in[1] <== y1;
    rp.in[2] <== x2;
    rp.in[3] <== y2;

    /* check x2^2 + y2^2 < r^2 */

    component comp2 = LessThan(32);
    signal x2Sq;
    signal y2Sq;
    signal rSq;
    x2Sq <== x2 * x2;
    y2Sq <== y2 * y2;
    rSq <== r * r;
    comp2.in[0] <== x2Sq + y2Sq
    comp2.in[1] <== rSq
    comp2.out === 1;

    /* check (x1-x2)^2 + (y1-y2)^2 <= distMax^2 */

    signal diffX;
    diffX <== x1 - x2;
    signal diffY;
    diffY <== y1 - y2;

    component ltDist = LessThan(32);
    signal firstDistSquare;
    signal secondDistSquare
    firstDistSquare <== diffX * diffX;
    secondDistSquare <== diffY * diffY;
    ltDist.in[0] <== firstDistSquare + secondDistSquare;
    ltDist.in[1] <== distMax * distMax + 1;
    ltDist.out === 1;

    /* check MiMCSponge(x1,y1) = pub1, MiMCSponge(x2,y2) = pub2 */
    /*
        220 = 2 * ceil(log_5 p), as specified by mimc paper, where
        p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
    */
    component mimc1 = MiMCSponge(2, 220, 1);
    component mimc2 = MiMCSponge(2, 220, 1);

    mimc1.ins[0] <== x1;
    mimc1.ins[1] <== y1;
    mimc1.k <== 0;
    mimc2.ins[0] <== x2;
    mimc2.ins[1] <== y2;
    mimc2.k <== 0;

    pub1 <== mimc1.outs[0];
    pub2 <== mimc2.outs[0];

    /* check perlin(x2, y2) = p2 */
    /*
    component perlin = MultiScalePerlin(3);
    perlin.p[0] <== x2;
    perlin.p[1] <== y2;
    perlin.out === p2;
    */
}

component main = Main();
