/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/kinobi-so/kinobi
 */

import {
  isProgramError,
  type Address,
  type SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM,
  type SolanaError,
} from '@solana/web3.js';
import { RELAYER_NCN_PROGRAM_PROGRAM_ADDRESS } from '../programs';

/** DenominatorIsZero: Zero in the denominator */
export const RELAYER_NCN_PROGRAM_ERROR__DENOMINATOR_IS_ZERO = 0x2100; // 8448
/** ArithmeticOverflow: Overflow */
export const RELAYER_NCN_PROGRAM_ERROR__ARITHMETIC_OVERFLOW = 0x2101; // 8449
/** ArithmeticUnderflowError: Underflow */
export const RELAYER_NCN_PROGRAM_ERROR__ARITHMETIC_UNDERFLOW_ERROR = 0x2102; // 8450
/** ArithmeticFloorError: Floor Overflow */
export const RELAYER_NCN_PROGRAM_ERROR__ARITHMETIC_FLOOR_ERROR = 0x2103; // 8451
/** ModuloOverflow: Modulo Overflow */
export const RELAYER_NCN_PROGRAM_ERROR__MODULO_OVERFLOW = 0x2104; // 8452
/** NewPreciseNumberError: New precise number error */
export const RELAYER_NCN_PROGRAM_ERROR__NEW_PRECISE_NUMBER_ERROR = 0x2105; // 8453
/** CastToImpreciseNumberError: Cast to imprecise number error */
export const RELAYER_NCN_PROGRAM_ERROR__CAST_TO_IMPRECISE_NUMBER_ERROR = 0x2106; // 8454
/** CastToU64Error: Cast to u64 error */
export const RELAYER_NCN_PROGRAM_ERROR__CAST_TO_U64_ERROR = 0x2107; // 8455
/** CastToU128Error: Cast to u128 error */
export const RELAYER_NCN_PROGRAM_ERROR__CAST_TO_U128_ERROR = 0x2108; // 8456
/** IncorrectWeightTableAdmin: Incorrect weight table admin */
export const RELAYER_NCN_PROGRAM_ERROR__INCORRECT_WEIGHT_TABLE_ADMIN = 0x2200; // 8704
/** DuplicateMintsInTable: Duplicate mints in table */
export const RELAYER_NCN_PROGRAM_ERROR__DUPLICATE_MINTS_IN_TABLE = 0x2201; // 8705
/** NoMintsInTable: There are no mints in the table */
export const RELAYER_NCN_PROGRAM_ERROR__NO_MINTS_IN_TABLE = 0x2202; // 8706
/** TableNotInitialized: Table not initialized */
export const RELAYER_NCN_PROGRAM_ERROR__TABLE_NOT_INITIALIZED = 0x2203; // 8707
/** RegistryNotInitialized: Registry not initialized */
export const RELAYER_NCN_PROGRAM_ERROR__REGISTRY_NOT_INITIALIZED = 0x2204; // 8708
/** NoVaultsInRegistry: There are no vaults in the registry */
export const RELAYER_NCN_PROGRAM_ERROR__NO_VAULTS_IN_REGISTRY = 0x2205; // 8709
/** VaultNotInRegistry: Vault not in weight table registry */
export const RELAYER_NCN_PROGRAM_ERROR__VAULT_NOT_IN_REGISTRY = 0x2206; // 8710
/** MintInTable: Mint is already in the table */
export const RELAYER_NCN_PROGRAM_ERROR__MINT_IN_TABLE = 0x2207; // 8711
/** TooManyMintsForTable: Too many mints for table */
export const RELAYER_NCN_PROGRAM_ERROR__TOO_MANY_MINTS_FOR_TABLE = 0x2208; // 8712
/** TooManyVaultsForRegistry: Too many vaults for registry */
export const RELAYER_NCN_PROGRAM_ERROR__TOO_MANY_VAULTS_FOR_REGISTRY = 0x2209; // 8713
/** WeightTableAlreadyInitialized: Weight table already initialized */
export const RELAYER_NCN_PROGRAM_ERROR__WEIGHT_TABLE_ALREADY_INITIALIZED = 0x220a; // 8714
/** CannotCreateFutureWeightTables: Cannnot create future weight tables */
export const RELAYER_NCN_PROGRAM_ERROR__CANNOT_CREATE_FUTURE_WEIGHT_TABLES = 0x220b; // 8715
/** WeightMintsDoNotMatchLength: Weight mints do not match - length */
export const RELAYER_NCN_PROGRAM_ERROR__WEIGHT_MINTS_DO_NOT_MATCH_LENGTH = 0x220c; // 8716
/** WeightMintsDoNotMatchMintHash: Weight mints do not match - mint hash */
export const RELAYER_NCN_PROGRAM_ERROR__WEIGHT_MINTS_DO_NOT_MATCH_MINT_HASH = 0x220d; // 8717
/** InvalidMintForWeightTable: Invalid mint for weight table */
export const RELAYER_NCN_PROGRAM_ERROR__INVALID_MINT_FOR_WEIGHT_TABLE = 0x220e; // 8718
/** ConfigMintsNotUpdated: Config supported mints do not match NCN Vault Count */
export const RELAYER_NCN_PROGRAM_ERROR__CONFIG_MINTS_NOT_UPDATED = 0x220f; // 8719
/** ConfigMintListFull: NCN config vaults are at capacity */
export const RELAYER_NCN_PROGRAM_ERROR__CONFIG_MINT_LIST_FULL = 0x2210; // 8720
/** VaultRegistryListFull: Vault Registry mints are at capacity */
export const RELAYER_NCN_PROGRAM_ERROR__VAULT_REGISTRY_LIST_FULL = 0x2211; // 8721
/** VaultRegistryVaultLocked: Vault registry are locked for the epoch */
export const RELAYER_NCN_PROGRAM_ERROR__VAULT_REGISTRY_VAULT_LOCKED = 0x2212; // 8722
/** VaultIndexAlreadyInUse: Vault index already in use by a different mint */
export const RELAYER_NCN_PROGRAM_ERROR__VAULT_INDEX_ALREADY_IN_USE = 0x2213; // 8723
/** MintEntryNotFound: Mint Entry not found */
export const RELAYER_NCN_PROGRAM_ERROR__MINT_ENTRY_NOT_FOUND = 0x2214; // 8724
/** FeeCapExceeded: Fee cap exceeded */
export const RELAYER_NCN_PROGRAM_ERROR__FEE_CAP_EXCEEDED = 0x2215; // 8725
/** DefaultDaoWallet: DAO wallet cannot be default */
export const RELAYER_NCN_PROGRAM_ERROR__DEFAULT_DAO_WALLET = 0x2216; // 8726
/** IncorrectNcnAdmin: Incorrect NCN Admin */
export const RELAYER_NCN_PROGRAM_ERROR__INCORRECT_NCN_ADMIN = 0x2217; // 8727
/** IncorrectNcn: Incorrect NCN */
export const RELAYER_NCN_PROGRAM_ERROR__INCORRECT_NCN = 0x2218; // 8728
/** IncorrectFeeAdmin: Incorrect fee admin */
export const RELAYER_NCN_PROGRAM_ERROR__INCORRECT_FEE_ADMIN = 0x2219; // 8729
/** WeightTableNotFinalized: Weight table not finalized */
export const RELAYER_NCN_PROGRAM_ERROR__WEIGHT_TABLE_NOT_FINALIZED = 0x221a; // 8730
/** WeightNotFound: Weight not found */
export const RELAYER_NCN_PROGRAM_ERROR__WEIGHT_NOT_FOUND = 0x221b; // 8731
/** NoOperators: No operators in ncn */
export const RELAYER_NCN_PROGRAM_ERROR__NO_OPERATORS = 0x221c; // 8732
/** VaultOperatorDelegationFinalized: Vault operator delegation is already finalized - should not happen */
export const RELAYER_NCN_PROGRAM_ERROR__VAULT_OPERATOR_DELEGATION_FINALIZED = 0x221d; // 8733
/** OperatorFinalized: Operator is already finalized - should not happen */
export const RELAYER_NCN_PROGRAM_ERROR__OPERATOR_FINALIZED = 0x221e; // 8734
/** TooManyVaultOperatorDelegations: Too many vault operator delegations */
export const RELAYER_NCN_PROGRAM_ERROR__TOO_MANY_VAULT_OPERATOR_DELEGATIONS = 0x221f; // 8735
/** DuplicateVaultOperatorDelegation: Duplicate vault operator delegation */
export const RELAYER_NCN_PROGRAM_ERROR__DUPLICATE_VAULT_OPERATOR_DELEGATION = 0x2220; // 8736
/** DuplicateVoteCast: Duplicate Vote Cast */
export const RELAYER_NCN_PROGRAM_ERROR__DUPLICATE_VOTE_CAST = 0x2221; // 8737
/** OperatorVotesFull: Operator votes full */
export const RELAYER_NCN_PROGRAM_ERROR__OPERATOR_VOTES_FULL = 0x2222; // 8738
/** BallotTallyFull: Merkle root tally full */
export const RELAYER_NCN_PROGRAM_ERROR__BALLOT_TALLY_FULL = 0x2223; // 8739
/** BallotTallyNotFoundFull: Ballot tally not found */
export const RELAYER_NCN_PROGRAM_ERROR__BALLOT_TALLY_NOT_FOUND_FULL = 0x2224; // 8740
/** ConsensusAlreadyReached: Consensus already reached, cannot change vote */
export const RELAYER_NCN_PROGRAM_ERROR__CONSENSUS_ALREADY_REACHED = 0x2225; // 8741
/** ConsensusNotReached: Consensus not reached */
export const RELAYER_NCN_PROGRAM_ERROR__CONSENSUS_NOT_REACHED = 0x2226; // 8742
/** EpochSnapshotNotFinalized: Epoch snapshot not finalized */
export const RELAYER_NCN_PROGRAM_ERROR__EPOCH_SNAPSHOT_NOT_FINALIZED = 0x2227; // 8743
/** VotingNotValid: Voting not valid, too many slots after consensus reached */
export const RELAYER_NCN_PROGRAM_ERROR__VOTING_NOT_VALID = 0x2228; // 8744
/** TieBreakerAdminInvalid: Tie breaker admin invalid */
export const RELAYER_NCN_PROGRAM_ERROR__TIE_BREAKER_ADMIN_INVALID = 0x2229; // 8745
/** VotingNotFinalized: Voting not finalized */
export const RELAYER_NCN_PROGRAM_ERROR__VOTING_NOT_FINALIZED = 0x222a; // 8746
/** TieBreakerNotInPriorVotes: Tie breaking ballot must be one of the prior votes */
export const RELAYER_NCN_PROGRAM_ERROR__TIE_BREAKER_NOT_IN_PRIOR_VOTES = 0x222b; // 8747
/** InvalidMerkleProof: Invalid merkle proof */
export const RELAYER_NCN_PROGRAM_ERROR__INVALID_MERKLE_PROOF = 0x222c; // 8748
/** OperatorAdminInvalid: Operator admin needs to sign its vote */
export const RELAYER_NCN_PROGRAM_ERROR__OPERATOR_ADMIN_INVALID = 0x222d; // 8749
/** InvalidNcnFeeGroup: Not a valid NCN fee group */
export const RELAYER_NCN_PROGRAM_ERROR__INVALID_NCN_FEE_GROUP = 0x222e; // 8750
/** InvalidBaseFeeGroup: Not a valid base fee group */
export const RELAYER_NCN_PROGRAM_ERROR__INVALID_BASE_FEE_GROUP = 0x222f; // 8751
/** OperatorRewardListFull: Operator reward list full */
export const RELAYER_NCN_PROGRAM_ERROR__OPERATOR_REWARD_LIST_FULL = 0x2230; // 8752
/** OperatorRewardNotFound: Operator Reward not found */
export const RELAYER_NCN_PROGRAM_ERROR__OPERATOR_REWARD_NOT_FOUND = 0x2231; // 8753
/** VaultRewardNotFound: Vault Reward not found */
export const RELAYER_NCN_PROGRAM_ERROR__VAULT_REWARD_NOT_FOUND = 0x2232; // 8754
/** DestinationMismatch: Destination mismatch */
export const RELAYER_NCN_PROGRAM_ERROR__DESTINATION_MISMATCH = 0x2233; // 8755
/** NcnRewardRouteNotFound: Ncn reward route not found */
export const RELAYER_NCN_PROGRAM_ERROR__NCN_REWARD_ROUTE_NOT_FOUND = 0x2234; // 8756
/** FeeNotActive: Fee not active */
export const RELAYER_NCN_PROGRAM_ERROR__FEE_NOT_ACTIVE = 0x2235; // 8757
/** NoRewards: No rewards to distribute */
export const RELAYER_NCN_PROGRAM_ERROR__NO_REWARDS = 0x2236; // 8758
/** NoFeedWeightNotSet: No Feed Weight not set */
export const RELAYER_NCN_PROGRAM_ERROR__NO_FEED_WEIGHT_NOT_SET = 0x2237; // 8759
/** SwitchboardNotRegistered: Switchboard not registered */
export const RELAYER_NCN_PROGRAM_ERROR__SWITCHBOARD_NOT_REGISTERED = 0x2238; // 8760
/** BadSwitchboardFeed: Bad switchboard feed */
export const RELAYER_NCN_PROGRAM_ERROR__BAD_SWITCHBOARD_FEED = 0x2239; // 8761
/** BadSwitchboardValue: Bad switchboard value */
export const RELAYER_NCN_PROGRAM_ERROR__BAD_SWITCHBOARD_VALUE = 0x223a; // 8762
/** StaleSwitchboardFeed: Stale switchboard feed */
export const RELAYER_NCN_PROGRAM_ERROR__STALE_SWITCHBOARD_FEED = 0x223b; // 8763
/** NoFeedWeightOrSwitchboardFeed: Weight entry needs either a feed or a no feed weight */
export const RELAYER_NCN_PROGRAM_ERROR__NO_FEED_WEIGHT_OR_SWITCHBOARD_FEED = 0x223c; // 8764
/** RouterStillRouting: Router still routing */
export const RELAYER_NCN_PROGRAM_ERROR__ROUTER_STILL_ROUTING = 0x223d; // 8765
/** InvalidEpochsBeforeStall: Invalid epochs before stall */
export const RELAYER_NCN_PROGRAM_ERROR__INVALID_EPOCHS_BEFORE_STALL = 0x223e; // 8766
/** InvalidEpochsBeforeClose: Invalid epochs before accounts can close */
export const RELAYER_NCN_PROGRAM_ERROR__INVALID_EPOCHS_BEFORE_CLOSE = 0x223f; // 8767
/** InvalidSlotsAfterConsensus: Invalid slots after consensus */
export const RELAYER_NCN_PROGRAM_ERROR__INVALID_SLOTS_AFTER_CONSENSUS = 0x2240; // 8768
/** VaultNeedsUpdate: Vault needs to be updated */
export const RELAYER_NCN_PROGRAM_ERROR__VAULT_NEEDS_UPDATE = 0x2241; // 8769
/** InvalidAccountStatus: Invalid Account Status */
export const RELAYER_NCN_PROGRAM_ERROR__INVALID_ACCOUNT_STATUS = 0x2242; // 8770
/** AccountAlreadyInitialized: Account already initialized */
export const RELAYER_NCN_PROGRAM_ERROR__ACCOUNT_ALREADY_INITIALIZED = 0x2243; // 8771
/** BadBallot: Cannot vote with uninitialized account */
export const RELAYER_NCN_PROGRAM_ERROR__BAD_BALLOT = 0x2244; // 8772
/** VotingIsNotOver: Cannot route until voting is over */
export const RELAYER_NCN_PROGRAM_ERROR__VOTING_IS_NOT_OVER = 0x2245; // 8773
/** OperatorIsNotInSnapshot: Operator is not in snapshot */
export const RELAYER_NCN_PROGRAM_ERROR__OPERATOR_IS_NOT_IN_SNAPSHOT = 0x2246; // 8774
/** InvalidAccountToCloseDiscriminator: Invalid account_to_close Discriminator */
export const RELAYER_NCN_PROGRAM_ERROR__INVALID_ACCOUNT_TO_CLOSE_DISCRIMINATOR = 0x2247; // 8775
/** CannotCloseAccount: Cannot close account */
export const RELAYER_NCN_PROGRAM_ERROR__CANNOT_CLOSE_ACCOUNT = 0x2248; // 8776
/** CannotCloseAccountAlreadyClosed: Cannot close account - Already closed */
export const RELAYER_NCN_PROGRAM_ERROR__CANNOT_CLOSE_ACCOUNT_ALREADY_CLOSED = 0x2249; // 8777
/** CannotCloseAccountNotEnoughEpochs: Cannot close account - Not enough epochs have passed since consensus reached */
export const RELAYER_NCN_PROGRAM_ERROR__CANNOT_CLOSE_ACCOUNT_NOT_ENOUGH_EPOCHS = 0x224a; // 8778
/** CannotCloseAccountNoReceiverProvided: Cannot close account - No receiver provided */
export const RELAYER_NCN_PROGRAM_ERROR__CANNOT_CLOSE_ACCOUNT_NO_RECEIVER_PROVIDED = 0x224b; // 8779
/** CannotCloseEpochStateAccount: Cannot close epoch state account - Epoch state needs all other accounts to be closed first */
export const RELAYER_NCN_PROGRAM_ERROR__CANNOT_CLOSE_EPOCH_STATE_ACCOUNT = 0x224c; // 8780
/** InvalidDaoWallet: Invalid DAO wallet */
export const RELAYER_NCN_PROGRAM_ERROR__INVALID_DAO_WALLET = 0x224d; // 8781
/** EpochIsClosingDown: Epoch is closing down */
export const RELAYER_NCN_PROGRAM_ERROR__EPOCH_IS_CLOSING_DOWN = 0x224e; // 8782
/** MarkerExists: Marker exists */
export const RELAYER_NCN_PROGRAM_ERROR__MARKER_EXISTS = 0x224f; // 8783

export type RelayerNcnProgramError =
  | typeof RELAYER_NCN_PROGRAM_ERROR__ACCOUNT_ALREADY_INITIALIZED
  | typeof RELAYER_NCN_PROGRAM_ERROR__ARITHMETIC_FLOOR_ERROR
  | typeof RELAYER_NCN_PROGRAM_ERROR__ARITHMETIC_OVERFLOW
  | typeof RELAYER_NCN_PROGRAM_ERROR__ARITHMETIC_UNDERFLOW_ERROR
  | typeof RELAYER_NCN_PROGRAM_ERROR__BAD_BALLOT
  | typeof RELAYER_NCN_PROGRAM_ERROR__BAD_SWITCHBOARD_FEED
  | typeof RELAYER_NCN_PROGRAM_ERROR__BAD_SWITCHBOARD_VALUE
  | typeof RELAYER_NCN_PROGRAM_ERROR__BALLOT_TALLY_FULL
  | typeof RELAYER_NCN_PROGRAM_ERROR__BALLOT_TALLY_NOT_FOUND_FULL
  | typeof RELAYER_NCN_PROGRAM_ERROR__CANNOT_CLOSE_ACCOUNT
  | typeof RELAYER_NCN_PROGRAM_ERROR__CANNOT_CLOSE_ACCOUNT_ALREADY_CLOSED
  | typeof RELAYER_NCN_PROGRAM_ERROR__CANNOT_CLOSE_ACCOUNT_NO_RECEIVER_PROVIDED
  | typeof RELAYER_NCN_PROGRAM_ERROR__CANNOT_CLOSE_ACCOUNT_NOT_ENOUGH_EPOCHS
  | typeof RELAYER_NCN_PROGRAM_ERROR__CANNOT_CLOSE_EPOCH_STATE_ACCOUNT
  | typeof RELAYER_NCN_PROGRAM_ERROR__CANNOT_CREATE_FUTURE_WEIGHT_TABLES
  | typeof RELAYER_NCN_PROGRAM_ERROR__CAST_TO_IMPRECISE_NUMBER_ERROR
  | typeof RELAYER_NCN_PROGRAM_ERROR__CAST_TO_U128_ERROR
  | typeof RELAYER_NCN_PROGRAM_ERROR__CAST_TO_U64_ERROR
  | typeof RELAYER_NCN_PROGRAM_ERROR__CONFIG_MINT_LIST_FULL
  | typeof RELAYER_NCN_PROGRAM_ERROR__CONFIG_MINTS_NOT_UPDATED
  | typeof RELAYER_NCN_PROGRAM_ERROR__CONSENSUS_ALREADY_REACHED
  | typeof RELAYER_NCN_PROGRAM_ERROR__CONSENSUS_NOT_REACHED
  | typeof RELAYER_NCN_PROGRAM_ERROR__DEFAULT_DAO_WALLET
  | typeof RELAYER_NCN_PROGRAM_ERROR__DENOMINATOR_IS_ZERO
  | typeof RELAYER_NCN_PROGRAM_ERROR__DESTINATION_MISMATCH
  | typeof RELAYER_NCN_PROGRAM_ERROR__DUPLICATE_MINTS_IN_TABLE
  | typeof RELAYER_NCN_PROGRAM_ERROR__DUPLICATE_VAULT_OPERATOR_DELEGATION
  | typeof RELAYER_NCN_PROGRAM_ERROR__DUPLICATE_VOTE_CAST
  | typeof RELAYER_NCN_PROGRAM_ERROR__EPOCH_IS_CLOSING_DOWN
  | typeof RELAYER_NCN_PROGRAM_ERROR__EPOCH_SNAPSHOT_NOT_FINALIZED
  | typeof RELAYER_NCN_PROGRAM_ERROR__FEE_CAP_EXCEEDED
  | typeof RELAYER_NCN_PROGRAM_ERROR__FEE_NOT_ACTIVE
  | typeof RELAYER_NCN_PROGRAM_ERROR__INCORRECT_FEE_ADMIN
  | typeof RELAYER_NCN_PROGRAM_ERROR__INCORRECT_NCN
  | typeof RELAYER_NCN_PROGRAM_ERROR__INCORRECT_NCN_ADMIN
  | typeof RELAYER_NCN_PROGRAM_ERROR__INCORRECT_WEIGHT_TABLE_ADMIN
  | typeof RELAYER_NCN_PROGRAM_ERROR__INVALID_ACCOUNT_STATUS
  | typeof RELAYER_NCN_PROGRAM_ERROR__INVALID_ACCOUNT_TO_CLOSE_DISCRIMINATOR
  | typeof RELAYER_NCN_PROGRAM_ERROR__INVALID_BASE_FEE_GROUP
  | typeof RELAYER_NCN_PROGRAM_ERROR__INVALID_DAO_WALLET
  | typeof RELAYER_NCN_PROGRAM_ERROR__INVALID_EPOCHS_BEFORE_CLOSE
  | typeof RELAYER_NCN_PROGRAM_ERROR__INVALID_EPOCHS_BEFORE_STALL
  | typeof RELAYER_NCN_PROGRAM_ERROR__INVALID_MERKLE_PROOF
  | typeof RELAYER_NCN_PROGRAM_ERROR__INVALID_MINT_FOR_WEIGHT_TABLE
  | typeof RELAYER_NCN_PROGRAM_ERROR__INVALID_NCN_FEE_GROUP
  | typeof RELAYER_NCN_PROGRAM_ERROR__INVALID_SLOTS_AFTER_CONSENSUS
  | typeof RELAYER_NCN_PROGRAM_ERROR__MARKER_EXISTS
  | typeof RELAYER_NCN_PROGRAM_ERROR__MINT_ENTRY_NOT_FOUND
  | typeof RELAYER_NCN_PROGRAM_ERROR__MINT_IN_TABLE
  | typeof RELAYER_NCN_PROGRAM_ERROR__MODULO_OVERFLOW
  | typeof RELAYER_NCN_PROGRAM_ERROR__NCN_REWARD_ROUTE_NOT_FOUND
  | typeof RELAYER_NCN_PROGRAM_ERROR__NEW_PRECISE_NUMBER_ERROR
  | typeof RELAYER_NCN_PROGRAM_ERROR__NO_FEED_WEIGHT_NOT_SET
  | typeof RELAYER_NCN_PROGRAM_ERROR__NO_FEED_WEIGHT_OR_SWITCHBOARD_FEED
  | typeof RELAYER_NCN_PROGRAM_ERROR__NO_MINTS_IN_TABLE
  | typeof RELAYER_NCN_PROGRAM_ERROR__NO_OPERATORS
  | typeof RELAYER_NCN_PROGRAM_ERROR__NO_REWARDS
  | typeof RELAYER_NCN_PROGRAM_ERROR__NO_VAULTS_IN_REGISTRY
  | typeof RELAYER_NCN_PROGRAM_ERROR__OPERATOR_ADMIN_INVALID
  | typeof RELAYER_NCN_PROGRAM_ERROR__OPERATOR_FINALIZED
  | typeof RELAYER_NCN_PROGRAM_ERROR__OPERATOR_IS_NOT_IN_SNAPSHOT
  | typeof RELAYER_NCN_PROGRAM_ERROR__OPERATOR_REWARD_LIST_FULL
  | typeof RELAYER_NCN_PROGRAM_ERROR__OPERATOR_REWARD_NOT_FOUND
  | typeof RELAYER_NCN_PROGRAM_ERROR__OPERATOR_VOTES_FULL
  | typeof RELAYER_NCN_PROGRAM_ERROR__REGISTRY_NOT_INITIALIZED
  | typeof RELAYER_NCN_PROGRAM_ERROR__ROUTER_STILL_ROUTING
  | typeof RELAYER_NCN_PROGRAM_ERROR__STALE_SWITCHBOARD_FEED
  | typeof RELAYER_NCN_PROGRAM_ERROR__SWITCHBOARD_NOT_REGISTERED
  | typeof RELAYER_NCN_PROGRAM_ERROR__TABLE_NOT_INITIALIZED
  | typeof RELAYER_NCN_PROGRAM_ERROR__TIE_BREAKER_ADMIN_INVALID
  | typeof RELAYER_NCN_PROGRAM_ERROR__TIE_BREAKER_NOT_IN_PRIOR_VOTES
  | typeof RELAYER_NCN_PROGRAM_ERROR__TOO_MANY_MINTS_FOR_TABLE
  | typeof RELAYER_NCN_PROGRAM_ERROR__TOO_MANY_VAULT_OPERATOR_DELEGATIONS
  | typeof RELAYER_NCN_PROGRAM_ERROR__TOO_MANY_VAULTS_FOR_REGISTRY
  | typeof RELAYER_NCN_PROGRAM_ERROR__VAULT_INDEX_ALREADY_IN_USE
  | typeof RELAYER_NCN_PROGRAM_ERROR__VAULT_NEEDS_UPDATE
  | typeof RELAYER_NCN_PROGRAM_ERROR__VAULT_NOT_IN_REGISTRY
  | typeof RELAYER_NCN_PROGRAM_ERROR__VAULT_OPERATOR_DELEGATION_FINALIZED
  | typeof RELAYER_NCN_PROGRAM_ERROR__VAULT_REGISTRY_LIST_FULL
  | typeof RELAYER_NCN_PROGRAM_ERROR__VAULT_REGISTRY_VAULT_LOCKED
  | typeof RELAYER_NCN_PROGRAM_ERROR__VAULT_REWARD_NOT_FOUND
  | typeof RELAYER_NCN_PROGRAM_ERROR__VOTING_IS_NOT_OVER
  | typeof RELAYER_NCN_PROGRAM_ERROR__VOTING_NOT_FINALIZED
  | typeof RELAYER_NCN_PROGRAM_ERROR__VOTING_NOT_VALID
  | typeof RELAYER_NCN_PROGRAM_ERROR__WEIGHT_MINTS_DO_NOT_MATCH_LENGTH
  | typeof RELAYER_NCN_PROGRAM_ERROR__WEIGHT_MINTS_DO_NOT_MATCH_MINT_HASH
  | typeof RELAYER_NCN_PROGRAM_ERROR__WEIGHT_NOT_FOUND
  | typeof RELAYER_NCN_PROGRAM_ERROR__WEIGHT_TABLE_ALREADY_INITIALIZED
  | typeof RELAYER_NCN_PROGRAM_ERROR__WEIGHT_TABLE_NOT_FINALIZED;

let relayerNcnProgramErrorMessages:
  | Record<RelayerNcnProgramError, string>
  | undefined;
if (process.env.NODE_ENV !== 'production') {
  relayerNcnProgramErrorMessages = {
    [RELAYER_NCN_PROGRAM_ERROR__ACCOUNT_ALREADY_INITIALIZED]: `Account already initialized`,
    [RELAYER_NCN_PROGRAM_ERROR__ARITHMETIC_FLOOR_ERROR]: `Floor Overflow`,
    [RELAYER_NCN_PROGRAM_ERROR__ARITHMETIC_OVERFLOW]: `Overflow`,
    [RELAYER_NCN_PROGRAM_ERROR__ARITHMETIC_UNDERFLOW_ERROR]: `Underflow`,
    [RELAYER_NCN_PROGRAM_ERROR__BAD_BALLOT]: `Cannot vote with uninitialized account`,
    [RELAYER_NCN_PROGRAM_ERROR__BAD_SWITCHBOARD_FEED]: `Bad switchboard feed`,
    [RELAYER_NCN_PROGRAM_ERROR__BAD_SWITCHBOARD_VALUE]: `Bad switchboard value`,
    [RELAYER_NCN_PROGRAM_ERROR__BALLOT_TALLY_FULL]: `Merkle root tally full`,
    [RELAYER_NCN_PROGRAM_ERROR__BALLOT_TALLY_NOT_FOUND_FULL]: `Ballot tally not found`,
    [RELAYER_NCN_PROGRAM_ERROR__CANNOT_CLOSE_ACCOUNT]: `Cannot close account`,
    [RELAYER_NCN_PROGRAM_ERROR__CANNOT_CLOSE_ACCOUNT_ALREADY_CLOSED]: `Cannot close account - Already closed`,
    [RELAYER_NCN_PROGRAM_ERROR__CANNOT_CLOSE_ACCOUNT_NO_RECEIVER_PROVIDED]: `Cannot close account - No receiver provided`,
    [RELAYER_NCN_PROGRAM_ERROR__CANNOT_CLOSE_ACCOUNT_NOT_ENOUGH_EPOCHS]: `Cannot close account - Not enough epochs have passed since consensus reached`,
    [RELAYER_NCN_PROGRAM_ERROR__CANNOT_CLOSE_EPOCH_STATE_ACCOUNT]: `Cannot close epoch state account - Epoch state needs all other accounts to be closed first`,
    [RELAYER_NCN_PROGRAM_ERROR__CANNOT_CREATE_FUTURE_WEIGHT_TABLES]: `Cannnot create future weight tables`,
    [RELAYER_NCN_PROGRAM_ERROR__CAST_TO_IMPRECISE_NUMBER_ERROR]: `Cast to imprecise number error`,
    [RELAYER_NCN_PROGRAM_ERROR__CAST_TO_U128_ERROR]: `Cast to u128 error`,
    [RELAYER_NCN_PROGRAM_ERROR__CAST_TO_U64_ERROR]: `Cast to u64 error`,
    [RELAYER_NCN_PROGRAM_ERROR__CONFIG_MINT_LIST_FULL]: `NCN config vaults are at capacity`,
    [RELAYER_NCN_PROGRAM_ERROR__CONFIG_MINTS_NOT_UPDATED]: `Config supported mints do not match NCN Vault Count`,
    [RELAYER_NCN_PROGRAM_ERROR__CONSENSUS_ALREADY_REACHED]: `Consensus already reached, cannot change vote`,
    [RELAYER_NCN_PROGRAM_ERROR__CONSENSUS_NOT_REACHED]: `Consensus not reached`,
    [RELAYER_NCN_PROGRAM_ERROR__DEFAULT_DAO_WALLET]: `DAO wallet cannot be default`,
    [RELAYER_NCN_PROGRAM_ERROR__DENOMINATOR_IS_ZERO]: `Zero in the denominator`,
    [RELAYER_NCN_PROGRAM_ERROR__DESTINATION_MISMATCH]: `Destination mismatch`,
    [RELAYER_NCN_PROGRAM_ERROR__DUPLICATE_MINTS_IN_TABLE]: `Duplicate mints in table`,
    [RELAYER_NCN_PROGRAM_ERROR__DUPLICATE_VAULT_OPERATOR_DELEGATION]: `Duplicate vault operator delegation`,
    [RELAYER_NCN_PROGRAM_ERROR__DUPLICATE_VOTE_CAST]: `Duplicate Vote Cast`,
    [RELAYER_NCN_PROGRAM_ERROR__EPOCH_IS_CLOSING_DOWN]: `Epoch is closing down`,
    [RELAYER_NCN_PROGRAM_ERROR__EPOCH_SNAPSHOT_NOT_FINALIZED]: `Epoch snapshot not finalized`,
    [RELAYER_NCN_PROGRAM_ERROR__FEE_CAP_EXCEEDED]: `Fee cap exceeded`,
    [RELAYER_NCN_PROGRAM_ERROR__FEE_NOT_ACTIVE]: `Fee not active`,
    [RELAYER_NCN_PROGRAM_ERROR__INCORRECT_FEE_ADMIN]: `Incorrect fee admin`,
    [RELAYER_NCN_PROGRAM_ERROR__INCORRECT_NCN]: `Incorrect NCN`,
    [RELAYER_NCN_PROGRAM_ERROR__INCORRECT_NCN_ADMIN]: `Incorrect NCN Admin`,
    [RELAYER_NCN_PROGRAM_ERROR__INCORRECT_WEIGHT_TABLE_ADMIN]: `Incorrect weight table admin`,
    [RELAYER_NCN_PROGRAM_ERROR__INVALID_ACCOUNT_STATUS]: `Invalid Account Status`,
    [RELAYER_NCN_PROGRAM_ERROR__INVALID_ACCOUNT_TO_CLOSE_DISCRIMINATOR]: `Invalid account_to_close Discriminator`,
    [RELAYER_NCN_PROGRAM_ERROR__INVALID_BASE_FEE_GROUP]: `Not a valid base fee group`,
    [RELAYER_NCN_PROGRAM_ERROR__INVALID_DAO_WALLET]: `Invalid DAO wallet`,
    [RELAYER_NCN_PROGRAM_ERROR__INVALID_EPOCHS_BEFORE_CLOSE]: `Invalid epochs before accounts can close`,
    [RELAYER_NCN_PROGRAM_ERROR__INVALID_EPOCHS_BEFORE_STALL]: `Invalid epochs before stall`,
    [RELAYER_NCN_PROGRAM_ERROR__INVALID_MERKLE_PROOF]: `Invalid merkle proof`,
    [RELAYER_NCN_PROGRAM_ERROR__INVALID_MINT_FOR_WEIGHT_TABLE]: `Invalid mint for weight table`,
    [RELAYER_NCN_PROGRAM_ERROR__INVALID_NCN_FEE_GROUP]: `Not a valid NCN fee group`,
    [RELAYER_NCN_PROGRAM_ERROR__INVALID_SLOTS_AFTER_CONSENSUS]: `Invalid slots after consensus`,
    [RELAYER_NCN_PROGRAM_ERROR__MARKER_EXISTS]: `Marker exists`,
    [RELAYER_NCN_PROGRAM_ERROR__MINT_ENTRY_NOT_FOUND]: `Mint Entry not found`,
    [RELAYER_NCN_PROGRAM_ERROR__MINT_IN_TABLE]: `Mint is already in the table`,
    [RELAYER_NCN_PROGRAM_ERROR__MODULO_OVERFLOW]: `Modulo Overflow`,
    [RELAYER_NCN_PROGRAM_ERROR__NCN_REWARD_ROUTE_NOT_FOUND]: `Ncn reward route not found`,
    [RELAYER_NCN_PROGRAM_ERROR__NEW_PRECISE_NUMBER_ERROR]: `New precise number error`,
    [RELAYER_NCN_PROGRAM_ERROR__NO_FEED_WEIGHT_NOT_SET]: `No Feed Weight not set`,
    [RELAYER_NCN_PROGRAM_ERROR__NO_FEED_WEIGHT_OR_SWITCHBOARD_FEED]: `Weight entry needs either a feed or a no feed weight`,
    [RELAYER_NCN_PROGRAM_ERROR__NO_MINTS_IN_TABLE]: `There are no mints in the table`,
    [RELAYER_NCN_PROGRAM_ERROR__NO_OPERATORS]: `No operators in ncn`,
    [RELAYER_NCN_PROGRAM_ERROR__NO_REWARDS]: `No rewards to distribute`,
    [RELAYER_NCN_PROGRAM_ERROR__NO_VAULTS_IN_REGISTRY]: `There are no vaults in the registry`,
    [RELAYER_NCN_PROGRAM_ERROR__OPERATOR_ADMIN_INVALID]: `Operator admin needs to sign its vote`,
    [RELAYER_NCN_PROGRAM_ERROR__OPERATOR_FINALIZED]: `Operator is already finalized - should not happen`,
    [RELAYER_NCN_PROGRAM_ERROR__OPERATOR_IS_NOT_IN_SNAPSHOT]: `Operator is not in snapshot`,
    [RELAYER_NCN_PROGRAM_ERROR__OPERATOR_REWARD_LIST_FULL]: `Operator reward list full`,
    [RELAYER_NCN_PROGRAM_ERROR__OPERATOR_REWARD_NOT_FOUND]: `Operator Reward not found`,
    [RELAYER_NCN_PROGRAM_ERROR__OPERATOR_VOTES_FULL]: `Operator votes full`,
    [RELAYER_NCN_PROGRAM_ERROR__REGISTRY_NOT_INITIALIZED]: `Registry not initialized`,
    [RELAYER_NCN_PROGRAM_ERROR__ROUTER_STILL_ROUTING]: `Router still routing`,
    [RELAYER_NCN_PROGRAM_ERROR__STALE_SWITCHBOARD_FEED]: `Stale switchboard feed`,
    [RELAYER_NCN_PROGRAM_ERROR__SWITCHBOARD_NOT_REGISTERED]: `Switchboard not registered`,
    [RELAYER_NCN_PROGRAM_ERROR__TABLE_NOT_INITIALIZED]: `Table not initialized`,
    [RELAYER_NCN_PROGRAM_ERROR__TIE_BREAKER_ADMIN_INVALID]: `Tie breaker admin invalid`,
    [RELAYER_NCN_PROGRAM_ERROR__TIE_BREAKER_NOT_IN_PRIOR_VOTES]: `Tie breaking ballot must be one of the prior votes`,
    [RELAYER_NCN_PROGRAM_ERROR__TOO_MANY_MINTS_FOR_TABLE]: `Too many mints for table`,
    [RELAYER_NCN_PROGRAM_ERROR__TOO_MANY_VAULT_OPERATOR_DELEGATIONS]: `Too many vault operator delegations`,
    [RELAYER_NCN_PROGRAM_ERROR__TOO_MANY_VAULTS_FOR_REGISTRY]: `Too many vaults for registry`,
    [RELAYER_NCN_PROGRAM_ERROR__VAULT_INDEX_ALREADY_IN_USE]: `Vault index already in use by a different mint`,
    [RELAYER_NCN_PROGRAM_ERROR__VAULT_NEEDS_UPDATE]: `Vault needs to be updated`,
    [RELAYER_NCN_PROGRAM_ERROR__VAULT_NOT_IN_REGISTRY]: `Vault not in weight table registry`,
    [RELAYER_NCN_PROGRAM_ERROR__VAULT_OPERATOR_DELEGATION_FINALIZED]: `Vault operator delegation is already finalized - should not happen`,
    [RELAYER_NCN_PROGRAM_ERROR__VAULT_REGISTRY_LIST_FULL]: `Vault Registry mints are at capacity`,
    [RELAYER_NCN_PROGRAM_ERROR__VAULT_REGISTRY_VAULT_LOCKED]: `Vault registry are locked for the epoch`,
    [RELAYER_NCN_PROGRAM_ERROR__VAULT_REWARD_NOT_FOUND]: `Vault Reward not found`,
    [RELAYER_NCN_PROGRAM_ERROR__VOTING_IS_NOT_OVER]: `Cannot route until voting is over`,
    [RELAYER_NCN_PROGRAM_ERROR__VOTING_NOT_FINALIZED]: `Voting not finalized`,
    [RELAYER_NCN_PROGRAM_ERROR__VOTING_NOT_VALID]: `Voting not valid, too many slots after consensus reached`,
    [RELAYER_NCN_PROGRAM_ERROR__WEIGHT_MINTS_DO_NOT_MATCH_LENGTH]: `Weight mints do not match - length`,
    [RELAYER_NCN_PROGRAM_ERROR__WEIGHT_MINTS_DO_NOT_MATCH_MINT_HASH]: `Weight mints do not match - mint hash`,
    [RELAYER_NCN_PROGRAM_ERROR__WEIGHT_NOT_FOUND]: `Weight not found`,
    [RELAYER_NCN_PROGRAM_ERROR__WEIGHT_TABLE_ALREADY_INITIALIZED]: `Weight table already initialized`,
    [RELAYER_NCN_PROGRAM_ERROR__WEIGHT_TABLE_NOT_FINALIZED]: `Weight table not finalized`,
  };
}

export function getRelayerNcnProgramErrorMessage(
  code: RelayerNcnProgramError
): string {
  if (process.env.NODE_ENV !== 'production') {
    return (
      relayerNcnProgramErrorMessages as Record<RelayerNcnProgramError, string>
    )[code];
  }

  return 'Error message not available in production bundles.';
}

export function isRelayerNcnProgramError<
  TProgramErrorCode extends RelayerNcnProgramError,
>(
  error: unknown,
  transactionMessage: {
    instructions: Record<number, { programAddress: Address }>;
  },
  code?: TProgramErrorCode
): error is SolanaError<typeof SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM> &
  Readonly<{ context: Readonly<{ code: TProgramErrorCode }> }> {
  return isProgramError<TProgramErrorCode>(
    error,
    transactionMessage,
    RELAYER_NCN_PROGRAM_PROGRAM_ADDRESS,
    code
  );
}
