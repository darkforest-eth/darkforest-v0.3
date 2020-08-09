#!/bin/bash
echo "clearing files to rebuild"
rm circuit.json
rm proving_key.json
rm proving_key.bin
rm verification_key.json
rm proof.json
rm public.json
rm verifier.sol
rm witness.json
rm witness.bin
echo "compiling circuit to snarkjs..." &&
date &&
circom circuit.circom &&
echo "generating prover and verification keys..." &&
date &&
snarkjs setup --protocol groth &&
echo "calculating witness..." &&
date &&
snarkjs calculatewitness &&
echo "generating proof..." &&
date &&
snarkjs proof &&
echo "verifying proof..." &&
date &&
snarkjs verify &&
echo "compiling smart contract..." &&
date &&
snarkjs generateverifier &&
echo "done!" &&
date
