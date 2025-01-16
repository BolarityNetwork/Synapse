/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/kinobi-so/kinobi
 */

import {
  containsBytes,
  getU8Encoder,
  type Address,
  type ReadonlyUint8Array,
} from '@solana/web3.js';
import {
  type ParsedAdminRegisterStMintInstruction,
  type ParsedInitializeConfigInstruction,
  type ParsedInitializeVaultRegistryInstruction,
  type ParsedReallocVaultRegistryInstruction,
} from '../instructions';

export const RELAYER_NCN_PROGRAM_PROGRAM_ADDRESS =
  'J2rxY1z3Wgt4VYrN4EVh6FGnEZHnEyHqQcwvd2kfKnxh' as Address<'J2rxY1z3Wgt4VYrN4EVh6FGnEZHnEyHqQcwvd2kfKnxh'>;

export enum RelayerNcnProgramAccount {
  Config,
  VaultRegistry,
  WeightTable,
}

export enum RelayerNcnProgramInstruction {
  InitializeConfig,
  InitializeVaultRegistry,
  ReallocVaultRegistry,
  AdminRegisterStMint,
}

export function identifyRelayerNcnProgramInstruction(
  instruction: { data: ReadonlyUint8Array } | ReadonlyUint8Array
): RelayerNcnProgramInstruction {
  const data = 'data' in instruction ? instruction.data : instruction;
  if (containsBytes(data, getU8Encoder().encode(0), 0)) {
    return RelayerNcnProgramInstruction.InitializeConfig;
  }
  if (containsBytes(data, getU8Encoder().encode(1), 0)) {
    return RelayerNcnProgramInstruction.InitializeVaultRegistry;
  }
  if (containsBytes(data, getU8Encoder().encode(2), 0)) {
    return RelayerNcnProgramInstruction.ReallocVaultRegistry;
  }
  if (containsBytes(data, getU8Encoder().encode(3), 0)) {
    return RelayerNcnProgramInstruction.AdminRegisterStMint;
  }
  throw new Error(
    'The provided instruction could not be identified as a relayerNcnProgram instruction.'
  );
}

export type ParsedRelayerNcnProgramInstruction<
  TProgram extends string = 'J2rxY1z3Wgt4VYrN4EVh6FGnEZHnEyHqQcwvd2kfKnxh',
> =
  | ({
      instructionType: RelayerNcnProgramInstruction.InitializeConfig;
    } & ParsedInitializeConfigInstruction<TProgram>)
  | ({
      instructionType: RelayerNcnProgramInstruction.InitializeVaultRegistry;
    } & ParsedInitializeVaultRegistryInstruction<TProgram>)
  | ({
      instructionType: RelayerNcnProgramInstruction.ReallocVaultRegistry;
    } & ParsedReallocVaultRegistryInstruction<TProgram>)
  | ({
      instructionType: RelayerNcnProgramInstruction.AdminRegisterStMint;
    } & ParsedAdminRegisterStMintInstruction<TProgram>);
