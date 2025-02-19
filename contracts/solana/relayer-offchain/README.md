# Bolarity Relayer NCN

#### This is Bolarity's relayer project, [ncn](https://ncn-cookbook.vercel.app/introduction/ncn-overview.html). The goal is to achieve decentralization of relayers and establish incentives.



## Devnet Testing Setup

The test environment consists of the following components:

1. **Relayer Solana Program**: This program is deployed on the Solana network and is responsible for receiving and sending cross-chain messages, as well as creating and activating abstract accounts.

2. **Relayer Ethereum Contract**: This contract is deployed on the Ethereum network and serves the same purpose as the Solana program, facilitating the reception and transmission of cross-chain messages and the creation and activation of abstract accounts.

3. **Relayer Hub Program**: Deployed on the Solana network, this program is used to register relayers and record the execution of relayer messages.

4. **Relayer NCN Program**: This program, also deployed on the Solana network, integrates Jito's restaking mechanism and implements NCN functions.

5. **Keeper Client**: This client is responsible for taking snapshots of relayer records for each epoch and establishing prerequisites for operator voting.

6. **Operator Client**: This client is used to vote on relayer record messages for each epoch, determining the final state of message execution.

7. **Relayer Client**: This is the relayer program for cross-chain messages, which implements two key functions: handling cross-chain messages and recording the execution of these messages to the Relayer Hub Program.

   The following describes how to set up a test environment on a test network.

### 1. Deploy Solana Program and Ethereum Contract

#### 1.1 Deploy Relayer Solana Program

After the compilation is complete, the `relayer_solana-keypair.json` file will be generated. You will then need to update the program ID manually.

```bash
cd relayer_solana
anchor build
// test
anchor test
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

Update the Relayer Hub SDK(This will generate the rust version of the SDK in the relayer-offchain folder):

```
yarn
ts-node clients/generate-client.ts
```

Copy the IDL and .so files to relayer-offchain, and delete any unnecessary instructions(Only keep the rollup_transaction instructions,otherwise it will not compile, anchor 0.30.1 is described [here](https://www.anchor-lang.com/docs/updates/release-notes/0-30-1)).

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

