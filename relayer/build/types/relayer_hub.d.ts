/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/relayer_hub.json`.
 */
export type RelayerHub = {
    "address": "39djqgS6KR6SWb3T39bTj8QMX3iuMMLP41PVjk89ieJh";
    "metadata": {
        "name": "relayerHub";
        "version": "0.1.0";
        "spec": "0.1.0";
        "description": "Created with Anchor";
    };
    "instructions": [
        {
            "name": "executeTransaction";
            "discriminator": [
                231,
                173,
                49,
                91,
                235,
                24,
                68,
                19
            ];
            "accounts": [
                {
                    "name": "relayer";
                    "docs": [
                        "Relayer account."
                    ];
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "config";
                    "docs": [
                        "Program configuration account."
                    ];
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "relayerInfo";
                    "docs": [
                        "Relayer configuration account."
                    ];
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    114,
                                    101,
                                    108,
                                    97,
                                    121,
                                    101,
                                    114,
                                    95,
                                    105,
                                    110,
                                    102,
                                    111
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "transaction";
                    "docs": [
                        "Transaction account."
                    ];
                    "writable": true;
                },
                {
                    "name": "systemProgram";
                    "docs": [
                        "System program."
                    ];
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "sequence";
                    "type": "u64";
                },
                {
                    "name": "success";
                    "type": "bool";
                },
                {
                    "name": "hash";
                    "type": {
                        "array": [
                            "u8",
                            64
                        ];
                    };
                }
            ];
        },
        {
            "name": "finalizeTransaction";
            "discriminator": [
                60,
                244,
                109,
                218,
                61,
                102,
                51,
                116
            ];
            "accounts": [
                {
                    "name": "operator";
                    "docs": [
                        "Operator account."
                    ];
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "config";
                    "docs": [
                        "Program configuration account."
                    ];
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "transaction";
                    "docs": [
                        "Transaction account."
                    ];
                    "writable": true;
                },
                {
                    "name": "systemProgram";
                    "docs": [
                        "System program."
                    ];
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "sequence";
                    "type": "u64";
                },
                {
                    "name": "finalize";
                    "type": "bool";
                },
                {
                    "name": "stateRoot";
                    "type": {
                        "array": [
                            "u8",
                            32
                        ];
                    };
                }
            ];
        },
        {
            "name": "initTransaction";
            "docs": [
                "This instruction is used to push transaction to transaction pool of a certain chain.",
                "",
                "# Arguments",
                "",
                "* `ctx` - `Initialize` context",
                "* `chain`   - Chain ID",
                "* `sequence`   - Trasaction sequence",
                "* `data`   - Transaction data pushed to the transaction pool."
            ];
            "discriminator": [
                144,
                48,
                27,
                226,
                98,
                225,
                195,
                163
            ];
            "accounts": [
                {
                    "name": "relayer";
                    "docs": [
                        "Relayer account."
                    ];
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "config";
                    "docs": [
                        "Program configuration account."
                    ];
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "relayerInfo";
                    "docs": [
                        "Relayer configuration account."
                    ];
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    114,
                                    101,
                                    108,
                                    97,
                                    121,
                                    101,
                                    114,
                                    95,
                                    105,
                                    110,
                                    102,
                                    111
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "pool";
                    "docs": [
                        "Transaction pool account.One transaction pool per chain."
                    ];
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    112,
                                    111,
                                    111,
                                    108
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "transaction";
                    "docs": [
                        "Transaction account."
                    ];
                    "writable": true;
                },
                {
                    "name": "epochSequence";
                    "docs": [
                        "Transaction account."
                    ];
                    "writable": true;
                },
                {
                    "name": "finalTransaction";
                    "docs": [
                        "Transaction account."
                    ];
                    "writable": true;
                },
                {
                    "name": "systemProgram";
                    "docs": [
                        "System program."
                    ];
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "sequence";
                    "type": "u64";
                },
                {
                    "name": "epoch";
                    "type": "u64";
                },
                {
                    "name": "data";
                    "type": "bytes";
                }
            ];
        },
        {
            "name": "initialize";
            "docs": [
                "This instruction initializes the program config.",
                "It also initializes the relayer configuration.",
                "",
                "# Arguments",
                "",
                "* `ctx` - `Initialize` context"
            ];
            "discriminator": [
                175,
                175,
                109,
                31,
                13,
                152,
                155,
                237
            ];
            "accounts": [
                {
                    "name": "config";
                    "docs": [
                        "Program configuration account.which saves program data useful for other instructions.",
                        "Also saves the payer of the initialize instruction as the program's owner."
                    ];
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "relayerInfo";
                    "docs": [
                        "Relayer configuration account.Used to store data related to relayer configuration."
                    ];
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    114,
                                    101,
                                    108,
                                    97,
                                    121,
                                    101,
                                    114,
                                    95,
                                    105,
                                    110,
                                    102,
                                    111
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "payer";
                    "docs": [
                        "Owner of program."
                    ];
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "systemProgram";
                    "docs": [
                        "System program."
                    ];
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "authority";
                    "type": "pubkey";
                }
            ];
        },
        {
            "name": "registerRelayer";
            "docs": [
                "This instruction registers the relayer and must be used after initialization.",
                "",
                "# Arguments",
                "",
                "* `ctx` - `Initialize` context"
            ];
            "discriminator": [
                98,
                213,
                0,
                0,
                27,
                134,
                109,
                48
            ];
            "accounts": [
                {
                    "name": "payer";
                    "docs": [
                        "Owner of relayer."
                    ];
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "config";
                    "docs": [
                        "Program configuration account."
                    ];
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "relayerInfo";
                    "docs": [
                        "Relayer configuration account."
                    ];
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    114,
                                    101,
                                    108,
                                    97,
                                    121,
                                    101,
                                    114,
                                    95,
                                    105,
                                    110,
                                    102,
                                    111
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "relayer";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    114,
                                    101,
                                    108,
                                    97,
                                    121,
                                    101,
                                    114
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "payer";
                            }
                        ];
                    };
                },
                {
                    "name": "systemProgram";
                    "docs": [
                        "System program."
                    ];
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [];
        },
        {
            "name": "registerTxPool";
            "docs": [
                "This instruction is used to register a transaction pool of a certain chain.",
                "",
                "# Arguments",
                "",
                "* `ctx` - `Initialize` context",
                "* `chain`   - Chain ID"
            ];
            "discriminator": [
                177,
                142,
                71,
                227,
                109,
                58,
                75,
                57
            ];
            "accounts": [
                {
                    "name": "owner";
                    "docs": [
                        "Only owner."
                    ];
                    "writable": true;
                    "signer": true;
                    "relations": [
                        "config"
                    ];
                },
                {
                    "name": "config";
                    "docs": [
                        "Program configuration account."
                    ];
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "pool";
                    "docs": [
                        "Transaction pool account.One transaction pool per chain."
                    ];
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    112,
                                    111,
                                    111,
                                    108
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "finalPool";
                    "docs": [
                        "Transaction pool account.One transaction pool per chain."
                    ];
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    102,
                                    105,
                                    110,
                                    97,
                                    108,
                                    95,
                                    112,
                                    111,
                                    111,
                                    108
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "systemProgram";
                    "docs": [
                        "System program."
                    ];
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [];
        },
        {
            "name": "rollupTransaction";
            "discriminator": [
                76,
                200,
                142,
                150,
                37,
                230,
                160,
                83
            ];
            "accounts": [
                {
                    "name": "rollupAuthority";
                    "docs": [
                        "ncn config account."
                    ];
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "config";
                    "docs": [
                        "Program configuration account."
                    ];
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "pool";
                    "docs": [
                        "Transaction pool account.One transaction pool per chain."
                    ];
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    102,
                                    105,
                                    110,
                                    97,
                                    108,
                                    95,
                                    112,
                                    111,
                                    111,
                                    108
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "transaction";
                    "docs": [
                        "Transaction account."
                    ];
                    "writable": true;
                },
                {
                    "name": "systemProgram";
                    "docs": [
                        "System program."
                    ];
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "accept";
                    "type": "bool";
                },
                {
                    "name": "stateRoot";
                    "type": {
                        "array": [
                            "u8",
                            32
                        ];
                    };
                },
                {
                    "name": "vote";
                    "type": "u8";
                },
                {
                    "name": "epoch";
                    "type": "u64";
                }
            ];
        },
        {
            "name": "updateConfig";
            "discriminator": [
                29,
                158,
                252,
                191,
                10,
                83,
                219,
                99
            ];
            "accounts": [
                {
                    "name": "owner";
                    "docs": [
                        "Only owner."
                    ];
                    "writable": true;
                    "signer": true;
                    "relations": [
                        "config"
                    ];
                },
                {
                    "name": "config";
                    "docs": [
                        "Program configuration account."
                    ];
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            }
                        ];
                    };
                },
                {
                    "name": "systemProgram";
                    "docs": [
                        "System program."
                    ];
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "authority";
                    "type": "pubkey";
                }
            ];
        }
    ];
    "accounts": [
        {
            "name": "config";
            "discriminator": [
                155,
                12,
                170,
                224,
                30,
                250,
                204,
                130
            ];
        },
        {
            "name": "epochSequence";
            "discriminator": [
                6,
                217,
                126,
                176,
                186,
                137,
                25,
                231
            ];
        },
        {
            "name": "finalTransaction";
            "discriminator": [
                89,
                4,
                197,
                225,
                76,
                48,
                1,
                148
            ];
        },
        {
            "name": "finalTransactionPool";
            "discriminator": [
                66,
                211,
                206,
                53,
                169,
                17,
                190,
                207
            ];
        },
        {
            "name": "relayer";
            "discriminator": [
                168,
                116,
                52,
                174,
                161,
                196,
                71,
                218
            ];
        },
        {
            "name": "relayerInfo";
            "discriminator": [
                175,
                3,
                83,
                81,
                177,
                76,
                212,
                183
            ];
        },
        {
            "name": "transaction";
            "discriminator": [
                11,
                24,
                174,
                129,
                203,
                117,
                242,
                23
            ];
        },
        {
            "name": "transactionPool";
            "discriminator": [
                54,
                231,
                41,
                4,
                126,
                197,
                25,
                142
            ];
        }
    ];
    "errors": [
        {
            "code": 6000;
            "name": "notInitialized";
            "msg": "Not initialized.";
        },
        {
            "code": 6001;
            "name": "initialized";
            "msg": "Already initialized.";
        },
        {
            "code": 6002;
            "name": "accountError";
            "msg": "Wrong account.";
        },
        {
            "code": 6003;
            "name": "ownerOnly";
            "msg": "ownerOnly";
        },
        {
            "code": 6004;
            "name": "notYourEpoch";
            "msg": "Not in your epoch";
        },
        {
            "code": 6005;
            "name": "undefinedMessageFormat";
            "msg": "Undefined message data format";
        },
        {
            "code": 6006;
            "name": "messageFormatError";
            "msg": "Wrong message data format";
        },
        {
            "code": 6007;
            "name": "epochError";
            "msg": "Wrong epoch";
        }
    ];
    "types": [
        {
            "name": "config";
            "docs": [
                "Global Configuration Account."
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "owner";
                        "docs": [
                            "Program's owner."
                        ];
                        "type": "pubkey";
                    },
                    {
                        "name": "initialized";
                        "docs": [
                            "Initialization flag, used to mark whether the global configuration has been initialized."
                        ];
                        "type": "bool";
                    },
                    {
                        "name": "authority";
                        "docs": [
                            "Upload state root authorizer."
                        ];
                        "type": "pubkey";
                    }
                ];
            };
        },
        {
            "name": "epochSequence";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "epoch";
                        "type": "u64";
                    },
                    {
                        "name": "beginSequence";
                        "type": "u64";
                    },
                    {
                        "name": "currentSequence";
                        "type": "u64";
                    }
                ];
            };
        },
        {
            "name": "finalTransaction";
            "docs": [
                "Transaction account."
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "sequence";
                        "docs": [
                            "The sequence number of the transaction."
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "stateRoot";
                        "docs": [
                            "Root of transaction's state."
                        ];
                        "type": {
                            "array": [
                                "u8",
                                32
                            ];
                        };
                    },
                    {
                        "name": "epoch";
                        "docs": [
                            "Epoch for which this account was created."
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "accepted";
                        "type": "bool";
                    },
                    {
                        "name": "votes";
                        "type": "u8";
                    }
                ];
            };
        },
        {
            "name": "finalTransactionPool";
            "docs": [
                "Transaction pool account."
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "total";
                        "docs": [
                            "The total number of transactions."
                        ];
                        "type": "u64";
                    }
                ];
            };
        },
        {
            "name": "relayer";
            "docs": [
                "Relayer account."
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "owner";
                        "docs": [
                            "Relayer's owner."
                        ];
                        "type": "pubkey";
                    }
                ];
            };
        },
        {
            "name": "relayerInfo";
            "docs": [
                "Relayer configuration account."
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "number";
                        "docs": [
                            "The total number of relayers."
                        ];
                        "type": "u16";
                    },
                    {
                        "name": "relayerList";
                        "type": {
                            "vec": "pubkey";
                        };
                    }
                ];
            };
        },
        {
            "name": "status";
            "type": {
                "kind": "enum";
                "variants": [
                    {
                        "name": "failing";
                    },
                    {
                        "name": "failed";
                    },
                    {
                        "name": "pending";
                    },
                    {
                        "name": "executed";
                    },
                    {
                        "name": "finality";
                    }
                ];
            };
        },
        {
            "name": "transaction";
            "docs": [
                "Transaction account."
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "sequence";
                        "docs": [
                            "The sequence number of the transaction."
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "timestamp";
                        "type": "u32";
                    },
                    {
                        "name": "fromChain";
                        "type": "u16";
                    },
                    {
                        "name": "toChain";
                        "type": "u16";
                    },
                    {
                        "name": "relayer";
                        "docs": [
                            "The sender of the transaction."
                        ];
                        "type": "pubkey";
                    },
                    {
                        "name": "stateRoot";
                        "docs": [
                            "Root of transaction's state."
                        ];
                        "type": {
                            "array": [
                                "u8",
                                32
                            ];
                        };
                    },
                    {
                        "name": "epoch";
                        "docs": [
                            "Epoch for which this account was created."
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "status";
                        "docs": [
                            "254 failing 255 failed 0 pending 1 executed 2 finality"
                        ];
                        "type": {
                            "defined": {
                                "name": "status";
                            };
                        };
                    },
                    {
                        "name": "hash";
                        "type": {
                            "array": [
                                "u8",
                                64
                            ];
                        };
                    }
                ];
            };
        },
        {
            "name": "transactionPool";
            "docs": [
                "Transaction pool account."
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "total";
                        "docs": [
                            "The total number of transactions."
                        ];
                        "type": "u64";
                    }
                ];
            };
        }
    ];
};
