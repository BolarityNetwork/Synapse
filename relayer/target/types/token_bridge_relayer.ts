/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/token_bridge_relayer.json`.
 */
export type TokenBridgeRelayer = {
  "address": "EYcqMLNRMUkHvDMg2Jpng8R5HMeJgt8uX7q372omPVsD",
  "metadata": {
    "name": "tokenBridgeRelayer",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "initialize",
      "docs": [
        "This instruction is be used to generate your program's config.",
        "And for convenience, we will store Wormhole-related PDAs in the",
        "config so we can verify these accounts with a simple == constraint.",
        "# Arguments",
        "",
        "* `ctx`           - `Initialize` context",
        "* `fee_recipient` - Recipient of all relayer fees and swap proceeds",
        "* `assistant`     - Privileged key to manage certain accounts"
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "Deployer of the program."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "senderConfig",
          "docs": [
            "Sender Config account, which saves program data useful for other",
            "instructions, specifically for outbound transfers. Also saves the payer",
            "of the [`initialize`](crate::initialize) instruction as the program's",
            "owner."
          ],
          "writable": true
        },
        {
          "name": "redeemerConfig",
          "docs": [
            "Redeemer Config account, which saves program data useful for other",
            "instructions, specifically for inbound transfers. Also saves the payer",
            "of the [`initialize`](crate::initialize) instruction as the program's",
            "owner."
          ],
          "writable": true
        },
        {
          "name": "ownerConfig",
          "docs": [
            "Owner config account, which saves the owner, assistant and",
            "pending owner keys. This account is used to manage the ownership of the",
            "program."
          ],
          "writable": true
        },
        {
          "name": "tokenBridgeEmitter",
          "docs": [
            "that holds data; it is purely just a signer for posting Wormhole",
            "messages on behalf of the Token Bridge program."
          ]
        },
        {
          "name": "tokenBridgeSequence",
          "docs": [
            "Token Bridge emitter's sequence account. Like with all Wormhole",
            "emitters, this account keeps track of the sequence number of the last",
            "posted message."
          ]
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program."
          ]
        },
        {
          "name": "programData",
          "docs": [
            "upgrade authority. We check this PDA address just in case there is another program that this",
            "deployer has deployed.",
            "",
            "NOTE: Set upgrade authority is scary because any public key can be used to set as the",
            "authority."
          ],
          "writable": true
        },
        {
          "name": "bpfLoaderUpgradeableProgram"
        }
      ],
      "args": [
        {
          "name": "feeRecipient",
          "type": "pubkey"
        },
        {
          "name": "assistant",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "registerForeignContract",
      "docs": [
        "This instruction registers a new foreign contract (from another",
        "network) and saves the emitter information in a ForeignEmitter account.",
        "This instruction is owner-only, meaning that only the owner of the",
        "program (defined in the [Config] account) can add and update foreign",
        "contracts.",
        "",
        "# Arguments",
        "",
        "* `ctx`     - `RegisterForeignContract` context",
        "* `chain`   - Wormhole Chain ID",
        "* `address` - Wormhole Emitter Address",
        "* `relayer_fee` - Relayer fee scaled by the `relayer_fee_precision`"
      ],
      "discriminator": [
        132,
        116,
        166,
        248,
        67,
        109,
        8,
        227
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "Owner of the program set in the [`SenderConfig`] account. Signer for",
            "creating [`ForeignContract`] account."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "docs": [
            "Sender Config account. This program requires that the `owner` specified",
            "in the context equals the pubkey specified in this account. Read-only."
          ]
        },
        {
          "name": "foreignContract",
          "docs": [
            "Foreign Contract account. Create this account if an emitter has not been",
            "registered yet for this Wormhole chain ID. If there already is a",
            "contract address saved in this account, overwrite it."
          ],
          "writable": true
        },
        {
          "name": "tokenBridgeForeignEndpoint",
          "docs": [
            "Token Bridge foreign endpoint. This account should really be one",
            "endpoint per chain, but Token Bridge's PDA allows for multiple",
            "endpoints for each chain. We store the proper endpoint for the",
            "emitter chain."
          ]
        },
        {
          "name": "tokenBridgeProgram",
          "docs": [
            "Token Bridge program."
          ]
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program."
          ]
        }
      ],
      "args": [
        {
          "name": "chain",
          "type": "u16"
        },
        {
          "name": "address",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "relayerFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "registerToken",
      "docs": [
        "This instruction registers a new token and saves the initial `swap_rate`",
        "and `max_native_token_amount` in a RegisteredToken account.",
        "This instruction is owner-only, meaning that only the owner of the",
        "program (defined in the [Config] account) can register a token.",
        "",
        "# Arguments",
        "",
        "* `ctx` - `RegisterToken` context",
        "* `swap_rate`:",
        "- USD conversion rate scaled by the `swap_rate_precision`. For example,",
        "- if the conversion rate is $15 and the `swap_rate_precision` is",
        "- 1000000, the `swap_rate` should be set to 15000000.",
        "* `max_native_swap_amount`:",
        "- Maximum amount of native tokens that can be swapped for this token",
        "- on this chain."
      ],
      "discriminator": [
        32,
        146,
        36,
        240,
        80,
        183,
        36,
        84
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "Owner of the program set in the [`SenderConfig`] account. Signer for",
            "creating [`ForeignContract`] account."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "docs": [
            "Sender Config account. This program requires that the `owner` specified",
            "in the context equals the pubkey specified in this account. Read-only."
          ]
        },
        {
          "name": "registeredToken",
          "docs": [
            "Registered Token account. This account stores information about the",
            "token, including the swap rate and max native swap amount. Create this",
            "account if the mint has not been registered yet. Mutable."
          ],
          "writable": true
        },
        {
          "name": "mint",
          "docs": [
            "Mint info. This is the SPL token that will be bridged over to the",
            "foreign contract."
          ]
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program."
          ]
        }
      ],
      "args": [
        {
          "name": "swapRate",
          "type": "u64"
        },
        {
          "name": "maxNativeSwapAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "deregisterToken",
      "docs": [
        "This instruction deregisters a token by closing the existing",
        "`RegisteredToken` account for a particular mint. This instruction is",
        "owner-only, meaning that only the owner of the program (defined in the",
        "[Config] account) can deregister a token."
      ],
      "discriminator": [
        248,
        154,
        118,
        193,
        60,
        39,
        15,
        250
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "Owner of the program set in the [`SenderConfig`] account. Signer for",
            "closing [`RegisteredToken`] account."
          ],
          "signer": true
        },
        {
          "name": "config",
          "docs": [
            "Sender Config account. This program requires that the `owner` specified",
            "in the context equals the pubkey specified in this account. Read-only."
          ]
        },
        {
          "name": "mint",
          "docs": [
            "Mint info. This is the SPL token that will be bridged over to the",
            "foreign contract."
          ]
        },
        {
          "name": "registeredToken",
          "docs": [
            "Registered Token account. This account stores information about the",
            "token, including the swap rate and max native swap amount. This account",
            "also determines if a mint is registered or not."
          ],
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "updateRelayerFee",
      "docs": [
        "This instruction updates the `relayer_fee` in the `ForeignContract` account.",
        "The `relayer_fee` is scaled by the `relayer_fee_precision`. For example,",
        "if the `relayer_fee` is $15 and the `relayer_fee_precision` is 1000000,",
        "the `relayer_fee` should be set to 15000000. This instruction can",
        "only be called by the owner or assistant, which are defined in the",
        "[OwnerConfig] account.",
        "",
        "# Arguments",
        "",
        "* `ctx`   - `UpdateRelayerFee` context",
        "* `chain` - Wormhole Chain ID",
        "* `fee`   - Relayer fee scaled by the `relayer_fee_precision`"
      ],
      "discriminator": [
        247,
        4,
        34,
        35,
        30,
        149,
        78,
        25
      ],
      "accounts": [
        {
          "name": "payer",
          "docs": [
            "Signer of the transaction. Must be the owner or assistant."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "ownerConfig",
          "docs": [
            "The owner_config is used when updating the swap rate",
            "so that the assistant key can be used in addition to the",
            "owner key."
          ]
        },
        {
          "name": "foreignContract",
          "docs": [
            "This account holds the USD denominated relayer fee for the specified",
            "`chain`. This account is used to determine the cost of relaying",
            "a transfer to a target chain. If there already is a relayer fee",
            "saved in this account, overwrite it."
          ],
          "writable": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program."
          ]
        }
      ],
      "args": [
        {
          "name": "chain",
          "type": "u16"
        },
        {
          "name": "fee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateRelayerFeePrecision",
      "docs": [
        "This instruction updates the `relayer_fee_precision` in the",
        "`SenderConfig` and `RedeemerConfig` accounts. The `relayer_fee_precision`",
        "is used to scale the `relayer_fee`. This instruction is owner-only,",
        "meaning that only the owner of the program (defined in the [Config]",
        "account) can register a token.",
        "",
        "# Arguments",
        "",
        "* `ctx` - `UpdatePrecision` context",
        "* `relayer_fee_precision` - Precision used to scale the relayer fee."
      ],
      "discriminator": [
        79,
        175,
        37,
        50,
        19,
        36,
        217,
        40
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "Owner of the program set in the [`RedeemerConfig`] and [`SenderConfig`] account."
          ],
          "signer": true
        },
        {
          "name": "redeemerConfig",
          "docs": [
            "Redeemer Config account. This program requires that the `owner`",
            "specified in the context equals the pubkey specified in this account.",
            "Mutable."
          ],
          "writable": true
        },
        {
          "name": "senderConfig",
          "docs": [
            "Sender Config account. This program requires that the `owner`",
            "specified in the context equals the pubkey specified in this account.",
            "Mutable. The `owner` check is redundant here, but we keep it as an",
            "extra protection for future changes to the context. Mutable."
          ],
          "writable": true
        }
      ],
      "args": [
        {
          "name": "relayerFeePrecision",
          "type": "u32"
        }
      ]
    },
    {
      "name": "updateSwapRate",
      "docs": [
        "This instruction updates the `swap_rate` in the `RegisteredToken`",
        "account. This instruction can only be called by the owner or",
        "assistant, which are defined in the [OwnerConfig] account.",
        "",
        "# Arguments",
        "",
        "* `ctx`       - `UpdateSwapRate` context",
        "* `swap_rate` - USD conversion rate for the specified token."
      ],
      "discriminator": [
        234,
        199,
        152,
        171,
        5,
        159,
        116,
        180
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "The signer of the transaction. Must be the owner or assistant."
          ],
          "signer": true
        },
        {
          "name": "ownerConfig",
          "docs": [
            "The owner_config is used when updating the swap rate so that the",
            "assistant key can be used in additional to the owner key."
          ]
        },
        {
          "name": "registeredToken",
          "docs": [
            "Registered Token account. This account stores information about the",
            "token, including the swap rate and max native swap amount. The program",
            "will modify this account to update the swap rate. Mutable."
          ],
          "writable": true
        },
        {
          "name": "mint",
          "docs": [
            "Mint info. This is the SPL token that will be bridged over to the",
            "foreign contract."
          ]
        }
      ],
      "args": [
        {
          "name": "swapRate",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateMaxNativeSwapAmount",
      "docs": [
        "This instruction updates the `max_native_swap_amount` in the",
        "`RegisteredToken` account. This instruction is owner-only,",
        "meaning that only the owner of the program (defined in the [Config]",
        "account) can register a token.",
        "",
        "# Arguments",
        "",
        "* `ctx` - `UpdateMaxNativeSwapAmount` context",
        "* `max_native_swap_amount`:",
        "- Maximum amount of native tokens that can be swapped for this token",
        "- on this chain."
      ],
      "discriminator": [
        66,
        133,
        198,
        215,
        236,
        109,
        137,
        65
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "Owner of the program set in the [`SenderConfig`] account. Signer for",
            "creating [`ForeignContract`] account."
          ],
          "signer": true
        },
        {
          "name": "config",
          "docs": [
            "Sender Config account. This program requires that the `owner` specified",
            "in the context equals the pubkey specified in this account. Read-only."
          ]
        },
        {
          "name": "registeredToken",
          "docs": [
            "Registered Token account. This account stores information about the",
            "token, including the swap rate and max native swap amount. The program",
            "will modify this account when the swap rate or max native swap amount",
            "changes. Mutable."
          ],
          "writable": true
        },
        {
          "name": "mint",
          "docs": [
            "Mint info. This is the SPL token that will be bridged over to the",
            "foreign contract."
          ]
        }
      ],
      "args": [
        {
          "name": "maxNativeSwapAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setPauseForTransfers",
      "docs": [
        "This instruction updates the `paused` boolean in the `SenderConfig`",
        "account. This instruction is owner-only, meaning that only the owner",
        "of the program (defined in the [Config] account) can pause outbound",
        "transfers.",
        "",
        "# Arguments",
        "",
        "* `ctx` - `PauseOutboundTransfers` context",
        "* `paused` - Boolean indicating whether outbound transfers are paused."
      ],
      "discriminator": [
        249,
        151,
        76,
        117,
        15,
        124,
        7,
        165
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "Owner of the program set in the [`SenderConfig`] account."
          ],
          "signer": true
        },
        {
          "name": "config",
          "docs": [
            "Sender Config account. This program requires that the `owner` specified",
            "in the context equals the pubkey specified in this account. Mutable."
          ],
          "writable": true
        }
      ],
      "args": [
        {
          "name": "paused",
          "type": "bool"
        }
      ]
    },
    {
      "name": "submitOwnershipTransferRequest",
      "docs": [
        "This instruction sets the `pending_owner` field in the `OwnerConfig`",
        "account. This instruction is owner-only, meaning that only the owner",
        "of the program (defined in the [Config] account) can submit an",
        "ownership transfer request.",
        "",
        "# Arguments",
        "",
        "* `ctx`       - `ManageOwnership` context",
        "* `new_owner` - Pubkey of the pending owner."
      ],
      "discriminator": [
        215,
        13,
        88,
        199,
        48,
        195,
        19,
        225
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "Owner of the program set in the [`OwnerConfig`] account."
          ],
          "signer": true
        },
        {
          "name": "ownerConfig",
          "docs": [
            "Owner Config account. This program requires that the `owner` specified",
            "in the context equals the pubkey specified in this account. Mutable."
          ],
          "writable": true
        }
      ],
      "args": [
        {
          "name": "newOwner",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "confirmOwnershipTransferRequest",
      "docs": [
        "This instruction confirms that the `pending_owner` is the signer of",
        "the transaction and updates the `owner` field in the `SenderConfig`,",
        "`RedeemerConfig`, and `OwnerConfig` accounts."
      ],
      "discriminator": [
        118,
        148,
        109,
        68,
        201,
        30,
        139,
        53
      ],
      "accounts": [
        {
          "name": "pendingOwner",
          "docs": [
            "Must be the pending owner of the program set in the [`OwnerConfig`]",
            "account."
          ],
          "signer": true
        },
        {
          "name": "ownerConfig",
          "docs": [
            "Owner Config account. This program requires that the `pending_owner`",
            "specified in the context equals the pubkey specified in this account."
          ],
          "writable": true
        },
        {
          "name": "senderConfig",
          "docs": [
            "Sender Config account. This instruction will update the `owner`",
            "specified in this account to the `pending_owner` specified in the",
            "[`OwnerConfig`] account. Mutable."
          ],
          "writable": true
        },
        {
          "name": "redeemerConfig",
          "docs": [
            "Redeemer Config account. This instruction will update the `owner`",
            "specified in this account to the `pending_owner` specified in the",
            "[`OwnerConfig`] account. Mutable."
          ],
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "cancelOwnershipTransferRequest",
      "docs": [
        "This instruction cancels the ownership transfer request by setting",
        "the `pending_owner` field in the `OwnerConfig` account to `None`.",
        "This instruction is owner-only, meaning that only the owner of the",
        "program (defined in the [Config] account) can cancel an ownership",
        "transfer request."
      ],
      "discriminator": [
        167,
        61,
        9,
        35,
        192,
        41,
        64,
        178
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "Owner of the program set in the [`OwnerConfig`] account."
          ],
          "signer": true
        },
        {
          "name": "ownerConfig",
          "docs": [
            "Owner Config account. This program requires that the `owner` specified",
            "in the context equals the pubkey specified in this account. Mutable."
          ],
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "updateAssistant",
      "docs": [
        "This instruction updates the `assistant` field in the `OwnerConfig`",
        "account. This instruction is owner-only, meaning that only the owner",
        "of the program (defined in the [Config] account) can update the",
        "assistant.",
        "",
        "# Arguments",
        "",
        "* `ctx` - `ManageOwnership` context",
        "* `new_assistant` - Pubkey of the new assistant."
      ],
      "discriminator": [
        181,
        6,
        193,
        242,
        63,
        68,
        215,
        92
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "Owner of the program set in the [`OwnerConfig`] account."
          ],
          "signer": true
        },
        {
          "name": "ownerConfig",
          "docs": [
            "Owner Config account. This program requires that the `owner` specified",
            "in the context equals the pubkey specified in this account. Mutable."
          ],
          "writable": true
        }
      ],
      "args": [
        {
          "name": "newAssistant",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "updateFeeRecipient",
      "docs": [
        "This instruction updates the `fee_recipient` field in the `RedeemerConfig`",
        "account. This instruction is owner-only, meaning that only the owner",
        "of the program (defined in the [Config] account) can update the",
        "fee recipient.",
        "",
        "# Arguments",
        "",
        "* `ctx` - `UpdateFeeRecipient` context",
        "* `new_fee_recipient` - Pubkey of the new fee recipient."
      ],
      "discriminator": [
        249,
        0,
        198,
        35,
        183,
        123,
        57,
        188
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "Owner of the program set in the [`RedeemerConfig`] account."
          ],
          "signer": true
        },
        {
          "name": "redeemerConfig",
          "docs": [
            "Redeemer Config account, which saves program data useful for other",
            "instructions, specifically for inbound transfers. Also saves the payer",
            "of the [`initialize`](crate::initialize) instruction as the program's",
            "owner."
          ],
          "writable": true
        }
      ],
      "args": [
        {
          "name": "newFeeRecipient",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "transferNativeTokensWithRelay",
      "docs": [
        "This instruction is used to transfer native tokens from Solana to a",
        "foreign blockchain. The user can optionally specify a",
        "`to_native_token_amount` to swap some of the tokens for the native",
        "asset on the target chain. For a fee, an off-chain relayer will redeem",
        "the transfer on the target chain. If the user is transferring native",
        "SOL, the contract will automatically wrap the lamports into a WSOL.",
        "",
        "# Arguments",
        "",
        "* `ctx` - `TransferNativeWithRelay` context",
        "* `amount` - Amount of tokens to send",
        "* `to_native_token_amount`:",
        "- Amount of tokens to swap for native assets on the target chain",
        "* `recipient_chain` - Chain ID of the target chain",
        "* `recipient_address` - Address of the target wallet on the target chain",
        "* `batch_id` - Nonce of Wormhole message",
        "* `wrap_native` - Whether to wrap native SOL"
      ],
      "discriminator": [
        70,
        101,
        60,
        125,
        91,
        218,
        58,
        204
      ],
      "accounts": [
        {
          "name": "payer",
          "docs": [
            "Payer will pay Wormhole fee to transfer tokens and create temporary",
            "token account."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "payerSequence",
          "docs": [
            "Used to keep track of payer's Wormhole sequence number."
          ],
          "writable": true
        },
        {
          "name": "config",
          "docs": [
            "Sender Config account. Acts as the signer for the Token Bridge token",
            "transfer. Read-only."
          ]
        },
        {
          "name": "foreignContract",
          "docs": [
            "Foreign Contract account. Send tokens to the contract specified in this",
            "account. Funnily enough, the Token Bridge program does not have any",
            "requirements for outbound transfers for the recipient chain to be",
            "registered. This account provides extra protection against sending",
            "tokens to an unregistered Wormhole chain ID. Read-only."
          ]
        },
        {
          "name": "mint",
          "docs": [
            "Mint info. This is the SPL token that will be bridged over to the",
            "foreign contract. Mutable."
          ],
          "writable": true
        },
        {
          "name": "fromTokenAccount",
          "docs": [
            "Payer's associated token account. We may want to make this a generic",
            "token account in the future."
          ],
          "writable": true
        },
        {
          "name": "registeredToken"
        },
        {
          "name": "tmpTokenAccount",
          "docs": [
            "Program's temporary token account. This account is created before the",
            "instruction is invoked to temporarily take custody of the payer's",
            "tokens. When the tokens are finally bridged out, the token account",
            "will have zero balance and can be closed."
          ],
          "writable": true
        },
        {
          "name": "tokenBridgeConfig"
        },
        {
          "name": "tokenBridgeCustody",
          "docs": [
            "account that holds this mint's balance. This account needs to be",
            "unchecked because a token account may not have been created for this",
            "mint yet. Mutable."
          ],
          "writable": true
        },
        {
          "name": "tokenBridgeAuthoritySigner"
        },
        {
          "name": "tokenBridgeCustodySigner"
        },
        {
          "name": "wormholeBridge",
          "writable": true
        },
        {
          "name": "wormholeMessage",
          "docs": [
            "tokens transferred in this account for our program. Mutable."
          ],
          "writable": true
        },
        {
          "name": "tokenBridgeEmitter"
        },
        {
          "name": "tokenBridgeSequence",
          "writable": true
        },
        {
          "name": "wormholeFeeCollector",
          "writable": true
        },
        {
          "name": "systemProgram"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "wormholeProgram"
        },
        {
          "name": "tokenBridgeProgram"
        },
        {
          "name": "clock"
        },
        {
          "name": "rent"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "toNativeTokenAmount",
          "type": "u64"
        },
        {
          "name": "recipientChain",
          "type": "u16"
        },
        {
          "name": "recipientAddress",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "batchId",
          "type": "u32"
        },
        {
          "name": "wrapNative",
          "type": "bool"
        }
      ]
    },
    {
      "name": "transferWrappedTokensWithRelay",
      "docs": [
        "This instruction is used to transfer wrapped tokens from Solana to a",
        "foreign blockchain. The user can optionally specify a",
        "`to_native_token_amount` to swap some of the tokens for the native",
        "assets on the target chain. For a fee, an off-chain relayer will redeem",
        "the transfer on the target chain. This instruction should only be called",
        "when the user is transferring a wrapped token.",
        "",
        "# Arguments",
        "",
        "* `ctx` - `TransferWrappedWithRelay` context",
        "* `amount` - Amount of tokens to send",
        "* `to_native_token_amount`:",
        "- Amount of tokens to swap for native assets on the target chain",
        "* `recipient_chain` - Chain ID of the target chain",
        "* `recipient_address` - Address of the target wallet on the target chain",
        "* `batch_id` - Nonce of Wormhole message"
      ],
      "discriminator": [
        25,
        63,
        69,
        217,
        250,
        9,
        127,
        122
      ],
      "accounts": [
        {
          "name": "payer",
          "docs": [
            "Payer will pay Wormhole fee to transfer tokens."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "payerSequence",
          "docs": [
            "Used to keep track of payer's Wormhole sequence number."
          ],
          "writable": true
        },
        {
          "name": "config",
          "docs": [
            "Sender Config account. Acts as the Token Bridge sender PDA. Mutable."
          ]
        },
        {
          "name": "foreignContract",
          "docs": [
            "Foreign Contract account. Send tokens to the contract specified in this",
            "account. Funnily enough, the Token Bridge program does not have any",
            "requirements for outbound transfers for the recipient chain to be",
            "registered. This account provides extra protection against sending",
            "tokens to an unregistered Wormhole chain ID. Read-only."
          ]
        },
        {
          "name": "tokenBridgeWrappedMint",
          "docs": [
            "Token Bridge wrapped mint info. This is the SPL token that will be",
            "bridged to the foreign contract. The wrapped mint PDA must agree",
            "with the native token's metadata. Mutable."
          ],
          "writable": true
        },
        {
          "name": "fromTokenAccount",
          "docs": [
            "Payer's associated token account. We may want to make this a generic",
            "token account in the future."
          ],
          "writable": true
        },
        {
          "name": "registeredToken"
        },
        {
          "name": "tmpTokenAccount",
          "docs": [
            "Program's temporary token account. This account is created before the",
            "instruction is invoked to temporarily take custody of the payer's",
            "tokens. When the tokens are finally bridged out, the token account",
            "will have zero balance and can be closed."
          ],
          "writable": true
        },
        {
          "name": "tokenBridgeWrappedMeta",
          "docs": [
            "about the token from its native chain:",
            "* Wormhole Chain ID",
            "* Token's native contract address",
            "* Token's native decimals"
          ]
        },
        {
          "name": "tokenBridgeConfig"
        },
        {
          "name": "tokenBridgeAuthoritySigner"
        },
        {
          "name": "wormholeBridge",
          "writable": true
        },
        {
          "name": "wormholeMessage",
          "docs": [
            "tokens transferred in this account."
          ],
          "writable": true
        },
        {
          "name": "tokenBridgeEmitter"
        },
        {
          "name": "tokenBridgeSequence",
          "writable": true
        },
        {
          "name": "wormholeFeeCollector",
          "writable": true
        },
        {
          "name": "wormholeProgram"
        },
        {
          "name": "tokenBridgeProgram"
        },
        {
          "name": "systemProgram"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "clock"
        },
        {
          "name": "rent"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "toNativeTokenAmount",
          "type": "u64"
        },
        {
          "name": "recipientChain",
          "type": "u16"
        },
        {
          "name": "recipientAddress",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "batchId",
          "type": "u32"
        }
      ]
    },
    {
      "name": "completeNativeTransferWithRelay",
      "docs": [
        "This instruction is used to redeem token transfers from foreign emitters.",
        "It takes custody of the released native tokens and sends the tokens to the",
        "encoded `recipient`. It pays the `fee_recipient` in the token",
        "denomination. If requested by the user, it will perform a swap with the",
        "off-chain relayer to provide the user with lamports. If the token",
        "being transferred is WSOL, the contract will unwrap the WSOL and send",
        "the lamports to the recipient and pay the relayer in lamports.",
        "",
        "# Arguments",
        "",
        "* `ctx` - `CompleteNativeWithRelay` context",
        "* `vaa_hash` - Hash of the VAA that triggered the transfer"
      ],
      "discriminator": [
        143,
        81,
        237,
        133,
        108,
        241,
        190,
        157
      ],
      "accounts": [
        {
          "name": "payer",
          "docs": [
            "Payer will pay Wormhole fee to transfer tokens and create temporary",
            "token account."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "docs": [
            "Redeemer Config account. Acts as the Token Bridge redeemer, which signs",
            "for the complete transfer instruction. Read-only."
          ]
        },
        {
          "name": "feeRecipientTokenAccount",
          "docs": [
            "Fee recipient's token account. Must be an associated token account. Mutable."
          ],
          "writable": true
        },
        {
          "name": "foreignContract",
          "docs": [
            "Foreign Contract account. The registered contract specified in this",
            "account must agree with the target address for the Token Bridge's token",
            "transfer. Read-only."
          ]
        },
        {
          "name": "mint",
          "docs": [
            "Mint info. This is the SPL token that will be bridged over from the",
            "foreign contract. This must match the token address specified in the",
            "signed Wormhole message. Read-only."
          ]
        },
        {
          "name": "recipientTokenAccount",
          "docs": [
            "Recipient associated token account. The recipient authority check",
            "is necessary to ensure that the recipient is the intended recipient",
            "of the bridged tokens. Mutable."
          ],
          "writable": true
        },
        {
          "name": "recipient",
          "docs": [
            "transaction. This instruction verifies that the recipient key",
            "passed in this context matches the intended recipient in the vaa."
          ],
          "writable": true
        },
        {
          "name": "registeredToken"
        },
        {
          "name": "nativeRegisteredToken"
        },
        {
          "name": "tmpTokenAccount",
          "docs": [
            "Program's temporary token account. This account is created before the",
            "instruction is invoked to temporarily take custody of the payer's",
            "tokens. When the tokens are finally bridged in, the tokens will be",
            "transferred to the destination token accounts. This account will have",
            "zero balance and can be closed."
          ],
          "writable": true
        },
        {
          "name": "tokenBridgeConfig"
        },
        {
          "name": "vaa",
          "docs": [
            "Verified Wormhole message account. The Wormhole program verified",
            "signatures and posted the account data here. Read-only."
          ]
        },
        {
          "name": "tokenBridgeClaim",
          "docs": [
            "is true if the bridged assets have been claimed. If the transfer has",
            "not been redeemed, this account will not exist yet.",
            "",
            "NOTE: The Token Bridge program's claim account is only initialized when",
            "a transfer is redeemed (and the boolean value `true` is written as",
            "its data).",
            "",
            "The Token Bridge program will automatically fail if this transfer",
            "is redeemed again. But we choose to short-circuit the failure as the",
            "first evaluation of this instruction."
          ],
          "writable": true
        },
        {
          "name": "tokenBridgeForeignEndpoint",
          "docs": [
            "endpoint per chain, but the PDA allows for multiple endpoints for each",
            "chain! We store the proper endpoint for the emitter chain."
          ]
        },
        {
          "name": "tokenBridgeCustody",
          "docs": [
            "account that holds this mint's balance."
          ],
          "writable": true
        },
        {
          "name": "tokenBridgeCustodySigner"
        },
        {
          "name": "wormholeProgram"
        },
        {
          "name": "tokenBridgeProgram"
        },
        {
          "name": "systemProgram"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "rent"
        }
      ],
      "args": [
        {
          "name": "vaaHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "completeWrappedTransferWithRelay",
      "docs": [
        "This instruction is used to redeem token transfers from foreign emitters.",
        "It takes custody of the minted wrapped tokens and sends the tokens to the",
        "encoded `recipient`. It pays the `fee_recipient` in the wrapped-token",
        "denomination. If requested by the user, it will perform a swap with the",
        "off-chain relayer to provide the user with lamports.",
        "",
        "# Arguments",
        "",
        "* `ctx` - `CompleteWrappedWithRelay` context",
        "* `vaa_hash` - Hash of the VAA that triggered the transfer"
      ],
      "discriminator": [
        174,
        44,
        4,
        91,
        81,
        201,
        235,
        255
      ],
      "accounts": [
        {
          "name": "payer",
          "docs": [
            "Payer will pay Wormhole fee to transfer tokens and create temporary",
            "token account."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "docs": [
            "Redeemer Config account. Acts as the Token Bridge redeemer, which signs",
            "for the complete transfer instruction. Read-only."
          ]
        },
        {
          "name": "feeRecipientTokenAccount",
          "docs": [
            "Fee recipient's token account. Must be an associated token account. Mutable."
          ],
          "writable": true
        },
        {
          "name": "foreignContract",
          "docs": [
            "Foreign Contract account. The registered contract specified in this",
            "account must agree with the target address for the Token Bridge's token",
            "transfer. Read-only."
          ]
        },
        {
          "name": "tokenBridgeWrappedMint",
          "docs": [
            "Token Bridge wrapped mint info. This is the SPL token that will be",
            "bridged from the foreign contract. The wrapped mint PDA must agree",
            "with the native token's metadata in the wormhole message. Mutable."
          ],
          "writable": true
        },
        {
          "name": "recipientTokenAccount",
          "docs": [
            "Recipient associated token account. The recipient authority check",
            "is necessary to ensure that the recipient is the intended recipient",
            "of the bridged tokens. Mutable."
          ],
          "writable": true
        },
        {
          "name": "recipient",
          "docs": [
            "transaction. This instruction verifies that the recipient key",
            "passed in this context matches the intended recipient in the vaa."
          ],
          "writable": true
        },
        {
          "name": "registeredToken"
        },
        {
          "name": "nativeRegisteredToken"
        },
        {
          "name": "tmpTokenAccount",
          "docs": [
            "Program's temporary token account. This account is created before the",
            "instruction is invoked to temporarily take custody of the payer's",
            "tokens. When the tokens are finally bridged in, the tokens will be",
            "transferred to the destination token accounts. This account will have",
            "zero balance and can be closed."
          ],
          "writable": true
        },
        {
          "name": "tokenBridgeWrappedMeta",
          "docs": [
            "about the token from its native chain:",
            "* Wormhole Chain ID",
            "* Token's native contract address",
            "* Token's native decimals"
          ]
        },
        {
          "name": "tokenBridgeConfig"
        },
        {
          "name": "vaa",
          "docs": [
            "Verified Wormhole message account. The Wormhole program verified",
            "signatures and posted the account data here. Read-only."
          ]
        },
        {
          "name": "tokenBridgeClaim",
          "docs": [
            "is true if the bridged assets have been claimed. If the transfer has",
            "not been redeemed, this account will not exist yet.",
            "",
            "NOTE: The Token Bridge program's claim account is only initialized when",
            "a transfer is redeemed (and the boolean value `true` is written as",
            "its data).",
            "",
            "The Token Bridge program will automatically fail if this transfer",
            "is redeemed again. But we choose to short-circuit the failure as the",
            "first evaluation of this instruction."
          ],
          "writable": true
        },
        {
          "name": "tokenBridgeForeignEndpoint",
          "docs": [
            "endpoint per chain, but the PDA allows for multiple endpoints for each",
            "chain! We store the proper endpoint for the emitter chain."
          ]
        },
        {
          "name": "tokenBridgeMintAuthority"
        },
        {
          "name": "wormholeProgram"
        },
        {
          "name": "tokenBridgeProgram"
        },
        {
          "name": "systemProgram"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "rent"
        }
      ],
      "args": [
        {
          "name": "vaaHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "foreignContract",
      "discriminator": [
        176,
        234,
        80,
        61,
        222,
        205,
        162,
        75
      ]
    },
    {
      "name": "ownerConfig",
      "discriminator": [
        68,
        140,
        203,
        32,
        144,
        130,
        191,
        23
      ]
    },
    {
      "name": "redeemerConfig",
      "discriminator": [
        187,
        195,
        13,
        200,
        41,
        129,
        85,
        191
      ]
    },
    {
      "name": "registeredToken",
      "discriminator": [
        203,
        205,
        18,
        65,
        131,
        212,
        106,
        174
      ]
    },
    {
      "name": "senderConfig",
      "discriminator": [
        0,
        241,
        220,
        77,
        167,
        128,
        79,
        152
      ]
    },
    {
      "name": "signerSequence",
      "discriminator": [
        221,
        182,
        34,
        1,
        43,
        17,
        245,
        110
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidWormholeBridge",
      "msg": "invalidWormholeBridge"
    },
    {
      "code": 6001,
      "name": "invalidWormholeFeeCollector",
      "msg": "invalidWormholeFeeCollector"
    },
    {
      "code": 6002,
      "name": "ownerOnly",
      "msg": "ownerOnly"
    },
    {
      "code": 6003,
      "name": "outboundTransfersPaused",
      "msg": "outboundTransfersPaused"
    },
    {
      "code": 6004,
      "name": "ownerOrAssistantOnly",
      "msg": "ownerOrAssistantOnly"
    },
    {
      "code": 6005,
      "name": "notPendingOwner",
      "msg": "notPendingOwner"
    },
    {
      "code": 6006,
      "name": "alreadyTheOwner",
      "msg": "alreadyTheOwner"
    },
    {
      "code": 6007,
      "name": "alreadyTheAssistant",
      "msg": "alreadyTheAssistant"
    },
    {
      "code": 6008,
      "name": "alreadyTheFeeRecipient",
      "msg": "alreadyTheFeeRecipient"
    },
    {
      "code": 6009,
      "name": "bumpNotFound",
      "msg": "bumpNotFound"
    },
    {
      "code": 6010,
      "name": "failedToMakeImmutable",
      "msg": "failedToMakeImmutable"
    },
    {
      "code": 6011,
      "name": "invalidForeignContract",
      "msg": "invalidForeignContract"
    },
    {
      "code": 6012,
      "name": "zeroBridgeAmount",
      "msg": "zeroBridgeAmount"
    },
    {
      "code": 6013,
      "name": "invalidToNativeAmount",
      "msg": "invalidToNativeAmount"
    },
    {
      "code": 6014,
      "name": "nativeMintRequired",
      "msg": "nativeMintRequired"
    },
    {
      "code": 6015,
      "name": "swapsNotAllowedForNativeMint",
      "msg": "swapsNotAllowedForNativeMint"
    },
    {
      "code": 6016,
      "name": "invalidTokenBridgeConfig",
      "msg": "invalidTokenBridgeConfig"
    },
    {
      "code": 6017,
      "name": "invalidTokenBridgeAuthoritySigner",
      "msg": "invalidTokenBridgeAuthoritySigner"
    },
    {
      "code": 6018,
      "name": "invalidTokenBridgeCustodySigner",
      "msg": "invalidTokenBridgeCustodySigner"
    },
    {
      "code": 6019,
      "name": "invalidTokenBridgeEmitter",
      "msg": "invalidTokenBridgeEmitter"
    },
    {
      "code": 6020,
      "name": "invalidTokenBridgeSequence",
      "msg": "invalidTokenBridgeSequence"
    },
    {
      "code": 6021,
      "name": "invalidRecipient",
      "msg": "invalidRecipient"
    },
    {
      "code": 6022,
      "name": "invalidTransferToChain",
      "msg": "invalidTransferToChain"
    },
    {
      "code": 6023,
      "name": "invalidTransferTokenChain",
      "msg": "invalidTransferTokenChain"
    },
    {
      "code": 6024,
      "name": "invalidPrecision",
      "msg": "invalidPrecision"
    },
    {
      "code": 6025,
      "name": "invalidTransferToAddress",
      "msg": "invalidTransferToAddress"
    },
    {
      "code": 6026,
      "name": "alreadyRedeemed",
      "msg": "alreadyRedeemed"
    },
    {
      "code": 6027,
      "name": "invalidTokenBridgeForeignEndpoint",
      "msg": "invalidTokenBridgeForeignEndpoint"
    },
    {
      "code": 6028,
      "name": "invalidTokenBridgeMintAuthority",
      "msg": "invalidTokenBridgeMintAuthority"
    },
    {
      "code": 6029,
      "name": "invalidPublicKey",
      "msg": "invalidPublicKey"
    },
    {
      "code": 6030,
      "name": "zeroSwapRate",
      "msg": "zeroSwapRate"
    },
    {
      "code": 6031,
      "name": "tokenNotRegistered",
      "msg": "tokenNotRegistered"
    },
    {
      "code": 6032,
      "name": "chainNotRegistered",
      "msg": "chainNotRegistered"
    },
    {
      "code": 6033,
      "name": "tokenAlreadyRegistered",
      "msg": "tokenAlreadyRegistered"
    },
    {
      "code": 6034,
      "name": "feeCalculationError",
      "msg": "tokenFeeCalculationError"
    },
    {
      "code": 6035,
      "name": "invalidSwapCalculation",
      "msg": "invalidSwapCalculation"
    },
    {
      "code": 6036,
      "name": "insufficientFunds",
      "msg": "insufficientFunds"
    }
  ],
  "types": [
    {
      "name": "outboundTokenBridgeAddresses",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sequence",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "tokenBridgeRelayerMessage",
      "docs": [
        "Expected message types for this program. Only valid payloads are:",
        "* `TransferWithRelay`: Payload ID == 1.",
        "",
        "Payload IDs are encoded as u8."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "transferWithRelay",
            "fields": [
              {
                "name": "targetRelayerFee",
                "type": "u64"
              },
              {
                "name": "toNativeTokenAmount",
                "type": "u64"
              },
              {
                "name": "recipient",
                "type": {
                  "array": [
                    "u8",
                    32
                  ]
                }
              }
            ]
          }
        ]
      }
    },
    {
      "name": "foreignContract",
      "docs": [
        "Foreign emitter account data."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "chain",
            "docs": [
              "Emitter chain. Cannot equal `1` (Solana's Chain ID)."
            ],
            "type": "u16"
          },
          {
            "name": "address",
            "docs": [
              "Emitter address. Cannot be zero address."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "tokenBridgeForeignEndpoint",
            "docs": [
              "Token Bridge program's foreign endpoint account key."
            ],
            "type": "pubkey"
          },
          {
            "name": "fee",
            "docs": [
              "The fee that is paid to the `fee_recipient` upon redeeming a transfer.",
              "This value is set in terms of USD and scaled by the `relayer_fee_precision`.",
              "For example, if the `relayer_fee_precision` is `100000000` and the intended",
              "fee is $5, then the `fee` value should be `500000000`."
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "ownerConfig",
      "docs": [
        "Owner account data."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "docs": [
              "Program's owner."
            ],
            "type": "pubkey"
          },
          {
            "name": "assistant",
            "docs": [
              "Program's assistant. Can be used to update the relayer fee and swap rate."
            ],
            "type": "pubkey"
          },
          {
            "name": "pendingOwner",
            "docs": [
              "Intermediate storage for the pending owner. Is used to transfer ownership."
            ],
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "redeemerConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "docs": [
              "Program's owner."
            ],
            "type": "pubkey"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump."
            ],
            "type": "u8"
          },
          {
            "name": "relayerFeePrecision",
            "docs": [
              "Relayer fee and swap rate precision."
            ],
            "type": "u32"
          },
          {
            "name": "feeRecipient",
            "docs": [
              "Recipient of all relayer fees and swap proceeds."
            ],
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "registeredToken",
      "docs": [
        "Registered token account data."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "swapRate",
            "docs": [
              "Token swap rate. The swap rate is the USD conversion rate of the token."
            ],
            "type": "u64"
          },
          {
            "name": "maxNativeSwapAmount",
            "docs": [
              "Maximum amount of native SOL the contract will swap for each transfer."
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "senderConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "docs": [
              "Program's owner."
            ],
            "type": "pubkey"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump."
            ],
            "type": "u8"
          },
          {
            "name": "tokenBridge",
            "docs": [
              "Token Bridge program's relevant addresses."
            ],
            "type": {
              "defined": {
                "name": "outboundTokenBridgeAddresses"
              }
            }
          },
          {
            "name": "relayerFeePrecision",
            "docs": [
              "Relayer fee and swap rate precision."
            ],
            "type": "u32"
          },
          {
            "name": "paused",
            "docs": [
              "Boolean indicating whether outbound transfers are paused."
            ],
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "signerSequence",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "value",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "seedPrefixBridged",
      "type": "bytes",
      "value": "[98, 114, 105, 100, 103, 101, 100]"
    },
    {
      "name": "seedPrefixTmp",
      "type": "bytes",
      "value": "[116, 109, 112]"
    },
    {
      "name": "swapRatePrecision",
      "type": "u32",
      "value": "100000000"
    }
  ]
};

