# Relayer NCN

## Devnet Testing Setup

### 1. Deploy Solana Program and Ethereum Contract

#### 1.1 Deploy Relayer Solana Program

After the compilation is complete, the `relayer_solana-keypair.json` file will be generated. You will then need to update the program ID manually.

```bash
cd relayer_solana
anchor build
anchor deploy
```

#### 1.2 Deploy Relayer Ethereum Contract

```
cd ethereum
npx hardhat run ./scripts/deploy.ts
```

#### 1.3 Initialize and Configure the Relayer Program

Run the initialize and registerEmitter instructions.

#### 1.4 Deploy Relayer Hub Program

After the compilation is complete, the ` relayer_hub-keypair.json`  file will be generated. You will then need to update the program ID manually.

```
cd relayer-hub
anchor build
anchor deploy
```

Update the Relayer Hub SDK:

```
yarn
ts-node clients/generate-client.ts
```

Copy the IDL and .so files to relayer-offchain, and delete any unnecessary instructions.

#### 1.5 Deploy Relayer NCN Program

```
cd relayer-offchain
cargo build-sbf --manifest-path program/Cargo.toml --sbf-out-dir integration_tests/tests/fixtures
# Find the program ID
solana-keygen pubkey ./integration_tests/tests/fixtures/relayer_ncn_program-keypair.json

cargo run --bin relayer-ncn-shank-cli

yarn

yarn generate-clients
# Test
SBF_OUT_DIR=integration_tests/tests/fixtures cargo test

solana program deploy --program-id ./integration_tests/tests/fixtures/relayer_ncn_program-keypair.json \
    --use-rpc --with-compute-unit-price 10000 -k ./target/deploy/owner.json \
    ./integration_tests/tests/fixtures/relayer_ncn_program.so

```



#### 1.6 Initialize and Configure Relayer NCN and Hub Program

```
cd relayer-offchain
```

Create a .env file:

```
RPC_URL=
COMMITMENT=confirmed

# Program IDs
RELAYER_NCN_PROGRAM_ID=
RESTAKING_PROGRAM_ID=RestkWeAVL8fRGgzhfeoqFhsqKRchg6aa1XrcH96z4Q
VAULT_PROGRAM_ID=Vau1t6sLNxnzB7ZDsef8TLbPLfyZMYXH8WTNqUdm9g8
RELAYER_HUB_PROGRAM_ID=
NCN=
KEYPAIR_PATH=
```

Configure the Relayer Hub program by running the initialize and registerPool instructions:

```
cd relayer-offchain
cargo run --bin relayer-ncn-cli admin-create-config
cargo run --bin relayer-ncn-cli create-vault-registry
cargo run --bin relayer-ncn-cli create-and-add-test-operator
cargo run --bin relayer-ncn-cli create-and-add-test-vault
cargo run --bin relayer-ncn-cli admin-register-st-mint --vault 
cargo run --bin relayer-ncn-cli register-vault --vault 
```

### 2. Run Related Programs

#### 2.1 Keeper

```
cargo run --bin relayer-ncn-cli keeper
```

#### 2.2 Operator

```
cargo run -p relayer-ncn-operator-cli -- --keypair-path ~/.config/solana/id.json --operator-address xxx --rpc-url xxx run --ncn-address xxx
```

#### 2.3 Relayer

Create a .env file:

```
export RELAYER_HUB_PID=
export RELAYER_SOLANA_SECRET=
export RELAYER_SEPOLIA_SECRET=
export SOLANA_RPC=
export SEPOLIA_RPC=
export RELAYER_SOLANA_PROGRAM=
export RELAYER_SEPOLIA_PROGRAM=
export TOKEN_BRIDGE_RELAYER_PID=
export CORE_BRIDGE_PID=
export TOKEN_BRIDGE_PID=
export CROSS_SECRET=
```

Finally, run the following command:

```
source ./env&&npm start
```

