/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/kinobi-so/kinobi
 */

import {
  combineCodec,
  getStructDecoder,
  getStructEncoder,
  getU16Decoder,
  getU16Encoder,
  getU64Decoder,
  getU64Encoder,
  type Codec,
  type Decoder,
  type Encoder,
} from '@solana/web3.js';
import {
  getBallotDecoder,
  getBallotEncoder,
  getStakeWeightsDecoder,
  getStakeWeightsEncoder,
  type Ballot,
  type BallotArgs,
  type StakeWeights,
  type StakeWeightsArgs,
} from '.';

export type BallotTally = {
  index: number;
  ballot: Ballot;
  stakeWeights: StakeWeights;
  tally: bigint;
};

export type BallotTallyArgs = {
  index: number;
  ballot: BallotArgs;
  stakeWeights: StakeWeightsArgs;
  tally: number | bigint;
};

export function getBallotTallyEncoder(): Encoder<BallotTallyArgs> {
  return getStructEncoder([
    ['index', getU16Encoder()],
    ['ballot', getBallotEncoder()],
    ['stakeWeights', getStakeWeightsEncoder()],
    ['tally', getU64Encoder()],
  ]);
}

export function getBallotTallyDecoder(): Decoder<BallotTally> {
  return getStructDecoder([
    ['index', getU16Decoder()],
    ['ballot', getBallotDecoder()],
    ['stakeWeights', getStakeWeightsDecoder()],
    ['tally', getU64Decoder()],
  ]);
}

export function getBallotTallyCodec(): Codec<BallotTallyArgs, BallotTally> {
  return combineCodec(getBallotTallyEncoder(), getBallotTallyDecoder());
}
