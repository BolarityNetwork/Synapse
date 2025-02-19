use std::mem::size_of;

use bytemuck::{Pod, Zeroable};
use jito_bytemuck::{
    types::{PodBool, PodU16, PodU64},
    AccountDeserialize, Discriminator,
};
// use merkle_tree::{merkle_tree::LEAF_PREFIX, tree_node::TreeNode};
use shank::{ShankAccount, ShankType};
use solana_program::{
    account_info::AccountInfo, hash::hashv, msg, program_error::ProgramError, pubkey::Pubkey,
};
use spl_math::precise_number::PreciseNumber;

use crate::{
    constants::{precise_consensus, DEFAULT_CONSENSUS_REACHED_SLOT, MAX_OPERATORS},
    discriminators::Discriminators,
    error::RelayerNcnError,
    loaders::check_load,
    stake_weight::StakeWeights,
};

#[derive(Debug, Clone, PartialEq, Eq, Copy, Zeroable, ShankType, Pod, ShankType)]
#[repr(C)]
pub struct Ballot {
    /// The merkle root of the meta merkle tree
    meta_merkle_root: [u8; 32],
    /// Whether the ballot is initialized
    is_initialized: PodBool,
    /// Reserved space
    reserved: [u8; 63],
}

impl Default for Ballot {
    fn default() -> Self {
        Self {
            meta_merkle_root: [0; 32],
            is_initialized: PodBool::from(false),
            reserved: [0; 63],
        }
    }
}

impl std::fmt::Display for Ballot {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self.meta_merkle_root)
    }
}

impl Ballot {
    pub fn new(merkle_root: &[u8; 32]) -> Self {
        let mut ballot = Self {
            meta_merkle_root: *merkle_root,
            is_initialized: PodBool::from(false),
            reserved: [0; 63],
        };

        for byte in ballot.meta_merkle_root.iter() {
            if *byte != 0 {
                ballot.is_initialized = PodBool::from(true);
                break;
            }
        }

        ballot
    }

    pub const fn root(&self) -> [u8; 32] {
        self.meta_merkle_root
    }

    pub fn is_initialized(&self) -> bool {
        self.is_initialized.into()
    }
}

#[derive(Debug, Clone, Copy, Zeroable, ShankType, Pod, ShankType)]
#[repr(C)]
pub struct BallotTally {
    /// Index of the tally within the ballot_tallies
    index: PodU16,
    /// The ballot being tallied
    ballot: Ballot,
    /// Breakdown of all of the stake weights that contribute to the vote
    stake_weights: StakeWeights,
    /// The number of votes for this ballot
    tally: PodU64,
    // reserved: [u8; 64],
}

impl Default for BallotTally {
    fn default() -> Self {
        Self {
            index: PodU16::from(u16::MAX),
            ballot: Ballot::default(),
            stake_weights: StakeWeights::default(),
            tally: PodU64::from(0),
            // reserved: [0; 64],
        }
    }
}

impl BallotTally {
    pub fn new(index: u16, ballot: &Ballot, stake_weights: &StakeWeights) -> Self {
        Self {
            index: PodU16::from(index),
            ballot: *ballot,
            stake_weights: *stake_weights,
            tally: PodU64::from(1),
            // reserved: [0; 64],
        }
    }

    pub const fn ballot(&self) -> &Ballot {
        &self.ballot
    }

    pub const fn stake_weights(&self) -> &StakeWeights {
        &self.stake_weights
    }

    pub fn tally(&self) -> u64 {
        self.tally.into()
    }

    pub fn index(&self) -> u16 {
        self.index.into()
    }

    pub fn is_valid(&self) -> bool {
        self.ballot.is_initialized()
    }

    pub fn increment_tally(&mut self, stake_weights: &StakeWeights) -> Result<(), RelayerNcnError> {
        self.stake_weights.increment(stake_weights)?;
        self.tally = PodU64::from(
            self.tally()
                .checked_add(1)
                .ok_or(RelayerNcnError::ArithmeticOverflow)?,
        );

        Ok(())
    }

    pub fn decrement_tally(&mut self, stake_weights: &StakeWeights) -> Result<(), RelayerNcnError> {
        self.stake_weights.decrement(stake_weights)?;
        self.tally = PodU64::from(
            self.tally()
                .checked_sub(1)
                .ok_or(RelayerNcnError::ArithmeticOverflow)?,
        );

        Ok(())
    }
}

#[derive(Debug, Clone, Copy, Zeroable, ShankType, Pod, ShankType)]
#[repr(C)]
pub struct OperatorVote {
    /// The operator that cast the vote
    operator: Pubkey,
    /// The slot the operator voted
    slot_voted: PodU64,
    /// The stake weights of the operator
    stake_weights: StakeWeights,
    /// The index of the ballot in the ballot_tallies
    ballot_index: PodU16,
    /// Reserved space
    reserved: [u8; 64],
}

impl Default for OperatorVote {
    fn default() -> Self {
        Self {
            operator: Pubkey::default(),
            slot_voted: PodU64::from(0),
            stake_weights: StakeWeights::default(),
            ballot_index: PodU16::from(u16::MAX),
            reserved: [0; 64],
        }
    }
}

impl OperatorVote {
    pub fn new(
        ballot_index: usize,
        operator: &Pubkey,
        current_slot: u64,
        stake_weights: &StakeWeights,
    ) -> Self {
        Self {
            operator: *operator,
            ballot_index: PodU16::from(ballot_index as u16),
            slot_voted: PodU64::from(current_slot),
            stake_weights: *stake_weights,
            reserved: [0; 64],
        }
    }

    pub const fn operator(&self) -> &Pubkey {
        &self.operator
    }

    pub fn slot_voted(&self) -> u64 {
        self.slot_voted.into()
    }

    pub const fn stake_weights(&self) -> &StakeWeights {
        &self.stake_weights
    }

    pub fn ballot_index(&self) -> u16 {
        self.ballot_index.into()
    }

    pub fn is_empty(&self) -> bool {
        self.ballot_index() == u16::MAX
    }
}

// PDA'd ["epoch_snapshot", NCN, NCN_EPOCH_SLOT]
#[derive(Debug, Clone, Copy, Zeroable, ShankType, Pod, AccountDeserialize, ShankAccount)]
#[repr(C)]
pub struct BallotBox {
    /// The NCN account this ballot box is for
    ncn: Pubkey,
    /// The epoch this ballot box is for
    epoch: PodU64,
    /// Bump seed for the PDA
    bump: u8,
    /// Slot when this ballot box was created
    slot_created: PodU64,
    /// Slot when consensus was reached
    slot_consensus_reached: PodU64,
    /// Reserved space
    reserved: [u8; 128],
    /// Number of operators that have voted
    operators_voted: PodU64,
    /// Number of unique ballots
    unique_ballots: PodU64,
    /// The ballot that got at least 66% of votes
    winning_ballot: Ballot,
    /// Operator votes
    operator_votes: [OperatorVote; 256],
    /// Mapping of ballots votes to stake weight
    ballot_tallies: [BallotTally; 256],
    /// votes
    votes: u8,
}

impl Discriminator for BallotBox {
    const DISCRIMINATOR: u8 = Discriminators::BallotBox as u8;
}

impl BallotBox {
    pub const SIZE: usize = 8 + size_of::<Self>();

    pub fn new(ncn: &Pubkey, epoch: u64, bump: u8, current_slot: u64) -> Self {
        Self {
            ncn: *ncn,
            epoch: PodU64::from(epoch),
            bump,
            slot_created: PodU64::from(current_slot),
            slot_consensus_reached: PodU64::from(DEFAULT_CONSENSUS_REACHED_SLOT),
            operators_voted: PodU64::from(0),
            unique_ballots: PodU64::from(0),
            winning_ballot: Ballot::default(),
            operator_votes: [OperatorVote::default(); MAX_OPERATORS],
            ballot_tallies: [BallotTally::default(); MAX_OPERATORS],
            reserved: [0; 128],
            votes: 0,
        }
    }

    pub fn initialize(&mut self, ncn: &Pubkey, epoch: u64, bump: u8, current_slot: u64) {
        // Avoids overflowing stack
        self.ncn = *ncn;
        self.epoch = PodU64::from(epoch);
        self.bump = bump;
        self.slot_created = PodU64::from(current_slot);
        self.slot_consensus_reached = PodU64::from(DEFAULT_CONSENSUS_REACHED_SLOT);
        self.operators_voted = PodU64::from(0);
        self.unique_ballots = PodU64::from(0);
        self.winning_ballot = Ballot::default();
        self.operator_votes = [OperatorVote::default(); MAX_OPERATORS];
        self.ballot_tallies = [BallotTally::default(); MAX_OPERATORS];
        self.reserved = [0; 128];
    }

    pub fn seeds(ncn: &Pubkey, epoch: u64) -> Vec<Vec<u8>> {
        Vec::from_iter(
            [
                b"ballot_box".to_vec(),
                ncn.to_bytes().to_vec(),
                epoch.to_le_bytes().to_vec(),
            ]
                .iter()
                .cloned(),
        )
    }

    pub fn find_program_address(
        program_id: &Pubkey,
        ncn: &Pubkey,
        epoch: u64,
    ) -> (Pubkey, u8, Vec<Vec<u8>>) {
        let seeds = Self::seeds(ncn, epoch);
        let seeds_iter: Vec<_> = seeds.iter().map(|s| s.as_slice()).collect();
        let (pda, bump) = Pubkey::find_program_address(&seeds_iter, program_id);
        (pda, bump, seeds)
    }

    pub fn load(
        program_id: &Pubkey,
        ncn: &Pubkey,
        epoch: u64,
        account: &AccountInfo,
        expect_writable: bool,
    ) -> Result<(), ProgramError> {
        let expected_pda = Self::find_program_address(program_id, ncn, epoch).0;
        check_load(
            program_id,
            account,
            &expected_pda,
            Some(Self::DISCRIMINATOR),
            expect_writable,
        )
    }

    pub fn epoch(&self) -> u64 {
        self.epoch.into()
    }

    pub fn slot_consensus_reached(&self) -> u64 {
        self.slot_consensus_reached.into()
    }

    pub fn unique_ballots(&self) -> u64 {
        self.unique_ballots.into()
    }

    pub fn operators_voted(&self) -> u64 {
        self.operators_voted.into()
    }

    pub fn has_ballot(&self, ballot: &Ballot) -> bool {
        self.ballot_tallies.iter().any(|t| t.ballot.eq(ballot))
    }

    pub const fn ballot_tallies(&self) -> &[BallotTally; MAX_OPERATORS] {
        &self.ballot_tallies
    }

    pub fn is_consensus_reached(&self) -> bool {
        self.slot_consensus_reached() != DEFAULT_CONSENSUS_REACHED_SLOT
            || self.winning_ballot.is_initialized()
    }

    pub fn tie_breaker_set(&self) -> bool {
        self.slot_consensus_reached() == DEFAULT_CONSENSUS_REACHED_SLOT
            && self.winning_ballot.is_initialized()
    }

    pub fn get_winning_ballot(&self) -> Result<&Ballot, RelayerNcnError> {
        if !self.winning_ballot.is_initialized() {
            Err(RelayerNcnError::ConsensusNotReached)
        } else {
            Ok(&self.winning_ballot)
        }
    }

    pub fn get_winning_ballot_tally(&self) -> Result<&BallotTally, RelayerNcnError> {
        if !self.winning_ballot.is_initialized() {
            Err(RelayerNcnError::ConsensusNotReached)
        } else {
            let winning_ballot_tally = self
                .ballot_tallies
                .iter()
                .find(|t| t.ballot.eq(&self.winning_ballot))
                .ok_or(RelayerNcnError::BallotTallyNotFoundFull)?;

            Ok(winning_ballot_tally)
        }
    }

    pub fn has_winning_ballot(&self) -> bool {
        self.winning_ballot.is_initialized()
    }

    pub const fn operator_votes(&self) -> &[OperatorVote; MAX_OPERATORS] {
        &self.operator_votes
    }

    pub fn set_winning_ballot(&mut self, ballot: &Ballot) {
        self.winning_ballot = *ballot;
    }

    fn increment_or_create_ballot_tally(
        &mut self,
        ballot: &Ballot,
        stake_weights: &StakeWeights,
    ) -> Result<usize, RelayerNcnError> {
        let mut tally_index: usize = 0;
        for tally in self.ballot_tallies.iter_mut() {
            if tally.ballot.eq(ballot) {
                tally.increment_tally(stake_weights)?;
                return Ok(tally_index);
            }

            if !tally.is_valid() {
                *tally = BallotTally::new(tally_index as u16, ballot, stake_weights);

                self.unique_ballots = PodU64::from(
                    self.unique_ballots()
                        .checked_add(1)
                        .ok_or(RelayerNcnError::ArithmeticOverflow)?,
                );

                return Ok(tally_index);
            }

            tally_index = tally_index
                .checked_add(1)
                .ok_or(RelayerNcnError::ArithmeticOverflow)?;
        }

        Err(RelayerNcnError::BallotTallyFull)
    }

    pub fn cast_vote(
        &mut self,
        operator: &Pubkey,
        ballot: &Ballot,
        stake_weights: &StakeWeights,
        current_slot: u64,
        valid_slots_after_consensus: u64,
    ) -> Result<(), RelayerNcnError> {
        if !self.is_voting_valid(current_slot, valid_slots_after_consensus)? {
            return Err(RelayerNcnError::VotingNotValid);
        }

        let ballot_index = self.increment_or_create_ballot_tally(ballot, stake_weights)?;

        let consensus_reached = self.is_consensus_reached();

        for vote in self.operator_votes.iter_mut() {
            if vote.operator().eq(operator) {
                if consensus_reached {
                    return Err(RelayerNcnError::ConsensusAlreadyReached);
                }

                // If the operator has already voted, we need to decrement their vote from the previous ballot
                let prev_ballot_index = vote.ballot_index();
                if let Some(prev_tally) = self.ballot_tallies.get_mut(prev_ballot_index as usize) {
                    prev_tally.decrement_tally(vote.stake_weights())?;
                }

                let operator_vote =
                    OperatorVote::new(ballot_index, operator, current_slot, stake_weights);
                *vote = operator_vote;
                return Ok(());
            }

            if vote.is_empty() {
                let operator_vote =
                    OperatorVote::new(ballot_index, operator, current_slot, stake_weights);
                *vote = operator_vote;

                self.operators_voted = PodU64::from(
                    self.operators_voted()
                        .checked_add(1)
                        .ok_or(RelayerNcnError::ArithmeticOverflow)?,
                );
                return Ok(());
            }
        }

        Err(RelayerNcnError::OperatorVotesFull)
    }

    // Should be called anytime a new vote is cast
    pub fn tally_votes(
        &mut self,
        total_stake_weight: u128,
        current_slot: u64,
    ) -> Result<(), RelayerNcnError> {
        if self.slot_consensus_reached() != DEFAULT_CONSENSUS_REACHED_SLOT {
            return Ok(());
        }

        let max_tally = self
            .ballot_tallies
            .iter()
            .max_by_key(|t| t.stake_weights().stake_weight())
            .unwrap();

        let ballot_stake_weight = max_tally.stake_weights().stake_weight();
        let precise_ballot_stake_weight =
            PreciseNumber::new(ballot_stake_weight).ok_or(RelayerNcnError::NewPreciseNumberError)?;
        let precise_total_stake_weight =
            PreciseNumber::new(total_stake_weight).ok_or(RelayerNcnError::NewPreciseNumberError)?;

        let ballot_percentage_of_total = precise_ballot_stake_weight
            .checked_div(&precise_total_stake_weight)
            .ok_or(RelayerNcnError::DenominatorIsZero)?;

        let target_precise_percentage = precise_consensus()?;

        let consensus_reached =
            ballot_percentage_of_total.greater_than_or_equal(&target_precise_percentage);

        if consensus_reached && !self.winning_ballot.is_initialized() {
            self.slot_consensus_reached = PodU64::from(current_slot);
            self.votes = (ballot_stake_weight * 100 / total_stake_weight) as u8;
            let winning_ballot = *max_tally.ballot();

            self.set_winning_ballot(&winning_ballot);
        }

        Ok(())
    }

    pub fn set_tie_breaker_ballot(
        &mut self,
        meta_merkle_root: &[u8; 32],
        current_epoch: u64,
        epochs_before_stall: u64,
    ) -> Result<(), RelayerNcnError> {
        // Check that consensus has not been reached
        if self.is_consensus_reached() {
            msg!("Consensus already reached");
            return Err(RelayerNcnError::ConsensusAlreadyReached);
        }

        // Check if voting is stalled and setting the tie breaker is eligible
        if current_epoch
            < self
            .epoch()
            .checked_add(epochs_before_stall)
            .ok_or(RelayerNcnError::ArithmeticOverflow)?
        {
            return Err(RelayerNcnError::VotingNotFinalized);
        }

        let finalized_ballot = Ballot::new(meta_merkle_root);

        // // Check that the merkle root is one of the existing options
        if !self.has_ballot(&finalized_ballot) {
            return Err(RelayerNcnError::TieBreakerNotInPriorVotes);
        }

        self.set_winning_ballot(&finalized_ballot);
        Ok(())
    }

    /// Determines if an operator can still cast their vote.
    /// Returns true when:
    /// Consensus is not reached OR the voting window is still valid, assuming set_tie_breaker was not invoked
    pub fn is_voting_valid(
        &self,
        current_slot: u64,
        valid_slots_after_consensus: u64,
    ) -> Result<bool, RelayerNcnError> {
        if self.tie_breaker_set() {
            return Ok(false);
        }

        if self.is_consensus_reached() {
            let vote_window_valid = current_slot
                <= self
                .slot_consensus_reached()
                .checked_add(valid_slots_after_consensus)
                .ok_or(RelayerNcnError::ArithmeticOverflow)?;

            return Ok(vote_window_valid);
        }

        Ok(true)
    }

    // pub fn verify_merkle_root(
    //     &self,
    //     tip_distribution_account: &Pubkey,
    //     proof: Vec<[u8; 32]>,
    //     merkle_root: &[u8; 32],
    //     max_total_claim: u64,
    //     max_num_nodes: u64,
    // ) -> Result<(), RelayerNcnError> {
    //     let tree_node = TreeNode::new(
    //         tip_distribution_account,
    //         merkle_root,
    //         max_total_claim,
    //         max_num_nodes,
    //     );
    //
    //     let node_hash = hashv(&[LEAF_PREFIX, &tree_node.hash().to_bytes()]);
    //
    //     if !merkle_tree::verify::verify(
    //         proof,
    //         self.winning_ballot.root(),
    //         node_hash.to_bytes(),
    //     ) {
    //         return Err(RelayerNcnError::InvalidMerkleProof);
    //     }
    //
    //     Ok(())
    // }
    pub fn get_votes(
        &self,) -> u8{
        self.votes
    }
}