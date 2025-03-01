/// <reference types="node" />
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import { RelayerHub } from "../types/relayer_hub";
export declare function get_relayer_of_current_epoch(connection: Connection, program: Program<RelayerHub>): Promise<PublicKey>;
export declare function init_transaction(connection: Connection, program: Program<RelayerHub>, data: Buffer, relayer_keypair: Keypair): Promise<number>;
export declare function execute_transaction(connection: Connection, program: Program<RelayerHub>, sequence: number, success: boolean, relayer_keypair: Keypair, hash: Buffer): Promise<void>;
