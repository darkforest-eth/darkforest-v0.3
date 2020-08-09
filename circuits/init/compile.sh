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
rm -rf ../../client/public/circuits/init/ &&
mkdir -p ../../client/public/circuits/init/ &&
cp circuit.json ../../client/public/circuits/init/ &&
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
echo "creating witness binary..." &&
node ../../client/node_modules/websnark/tools/buildwitness.js &&
echo "creating proving key binary..." &&
rm ../../client/public/proving_key_init.bin
node ../../client/node_modules/websnark/tools/buildpkey.js &&
cp ./proving_key.bin ../../client/public/proving_key_init.bin &&
echo "copying verifying key to mockchain..." &&
rm ../../mockchain/public/snark/init/verification_key.json
mkdir -p ../../mockchain/public/snark/init/
cp ./verification_key.json ../../mockchain/public/snark/init/verification_key.json
echo "done!" &&
date
