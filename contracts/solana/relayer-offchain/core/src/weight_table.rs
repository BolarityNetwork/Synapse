use std::mem::size_of;

use bytemuck::{Pod, Zeroable};
use jito_bytemuck::{types::PodU64, AccountDeserialize, Discriminator};
use shank::{ShankAccount, ShankType};
use solana_program::{account_info::AccountInfo, program_error::ProgramError, pubkey::Pubkey};
use spl_math::precise_number::PreciseNumber;

use crate::{
    constants::{MAX_ST_MINTS, MAX_VAULTS},
    discriminators::Discriminators,
    error::RelayerNcnError,
    loaders::check_load,
    vault_registry::{StMintEntry, VaultEntry},
    weight_entry::WeightEntry,
};

#[derive(Debug, Clone, Copy, Zeroable, ShankType, Pod, AccountDeserialize, ShankAccount)]
#[repr(C)]
pub struct WeightTable {
    /// The NCN the account is associated with
    ncn: Pubkey,
    /// The epoch the account is associated with
    epoch: PodU64,
    /// Slot weight table was created
    slot_created: PodU64,
    /// Number of vaults in tracked mints at the time of creation
    vault_count: PodU64,
    /// Bump seed for the PDA
    bump: u8,
    /// Reserved space
    reserved: [u8; 128],
    /// A snapshot of the Vault Registry
    vault_registry: [VaultEntry; 64],
    /// The weight table
    table: [WeightEntry; 64],
}

impl Discriminator for WeightTable {
    const DISCRIMINATOR: u8 = Discriminators::WeightTable as u8;
}

impl WeightTable {
    pub const SIZE: usize = 8 + size_of::<Self>();

    pub fn new(ncn: &Pubkey, epoch: u64, slot_created: u64, vault_count: u64, bump: u8) -> Self {
        Self {
            ncn: *ncn,
            epoch: PodU64::from(epoch),
            slot_created: PodU64::from(slot_created),
            vault_count: PodU64::from(vault_count),
            bump,
            reserved: [0; 128],
            vault_registry: [VaultEntry::default(); MAX_VAULTS],
            table: [WeightEntry::default(); MAX_ST_MINTS],
        }
    }

    pub fn seeds(ncn: &Pubkey, ncn_epoch: u64) -> Vec<Vec<u8>> {
        Vec::from_iter(
            [
                b"weight_table".to_vec(),
                ncn.to_bytes().to_vec(),
                ncn_epoch.to_le_bytes().to_vec(),
            ]
                .iter()
                .cloned(),
        )
    }

    pub fn find_program_address(
        program_id: &Pubkey,
        ncn: &Pubkey,
        ncn_epoch: u64,
    ) -> (Pubkey, u8, Vec<Vec<u8>>) {
        let seeds = Self::seeds(ncn, ncn_epoch);
        let seeds_iter: Vec<_> = seeds.iter().map(|s| s.as_slice()).collect();
        let (pda, bump) = Pubkey::find_program_address(&seeds_iter, program_id);
        (pda, bump, seeds)
    }

    #[allow(clippy::too_many_arguments)]
    pub fn initialize(
        &mut self,
        ncn: &Pubkey,
        ncn_epoch: u64,
        slot_created: u64,
        vault_count: u64,
        bump: u8,
        vault_entries: &[VaultEntry; MAX_VAULTS],
        mint_entries: &[StMintEntry; MAX_ST_MINTS],
    ) -> Result<(), RelayerNcnError> {
        // Initializes field by field to avoid overflowing stack
        self.ncn = *ncn;
        self.epoch = PodU64::from(ncn_epoch);
        self.slot_created = PodU64::from(slot_created);
        self.vault_count = PodU64::from(vault_count);
        self.bump = bump;
        self.reserved = [0; 128];
        self.vault_registry = [VaultEntry::default(); MAX_VAULTS];
        self.table = [WeightEntry::default(); MAX_ST_MINTS];
        self.set_vault_entries(vault_entries)?;
        self.set_mint_entries(mint_entries)?;
        Ok(())
    }

    fn set_vault_entries(
        &mut self,
        vault_entries: &[VaultEntry; MAX_VAULTS],
    ) -> Result<(), RelayerNcnError> {
        if self.vault_registry_initialized() {
            return Err(RelayerNcnError::WeightTableAlreadyInitialized);
        }

        // Copy the entire slice into vault_registry
        for (i, entry) in vault_entries.iter().enumerate() {
            self.vault_registry[i] = *entry;
        }

        self.check_registry_initialized()?;

        Ok(())
    }

    fn set_mint_entries(
        &mut self,
        mint_entries: &[StMintEntry; MAX_ST_MINTS],
    ) -> Result<(), RelayerNcnError> {
        if self.table_initialized() {
            return Err(RelayerNcnError::WeightTableAlreadyInitialized);
        }

        // Set table using iterator
        for (i, entry) in mint_entries.iter().enumerate() {
            self.table[i] = WeightEntry::new(entry)
        }

        self.check_table_initialized()?;

        Ok(())
    }

    pub fn set_weight(
        &mut self,
        mint: &Pubkey,
        weight: u128,
        current_slot: u64,
    ) -> Result<(), RelayerNcnError> {
        self.table
            .iter_mut()
            .find(|entry| entry.st_mint().eq(mint))
            .map_or(Err(RelayerNcnError::InvalidMintForWeightTable), |entry| {
                entry.set_weight(weight, current_slot);
                Ok(())
            })
    }

    pub fn get_weight(&self, mint: &Pubkey) -> Result<u128, RelayerNcnError> {
        self.table
            .iter()
            .find(|entry| entry.st_mint().eq(mint))
            .map_or(Err(RelayerNcnError::InvalidMintForWeightTable), |entry| {
                Ok(entry.weight())
            })
    }

    pub fn get_weight_entry(&self, mint: &Pubkey) -> Result<&WeightEntry, RelayerNcnError> {
        self.table
            .iter()
            .find(|entry| entry.st_mint().eq(mint))
            .ok_or(RelayerNcnError::InvalidMintForWeightTable)
    }

    pub fn get_precise_weight(&self, mint: &Pubkey) -> Result<PreciseNumber, RelayerNcnError> {
        let weight = self.get_weight(mint)?;
        PreciseNumber::new(weight).ok_or(RelayerNcnError::NewPreciseNumberError)
    }

    pub fn get_mints(&self) -> Vec<Pubkey> {
        self.table
            .iter()
            .filter(|entry| !entry.is_empty())
            .map(|entry| *entry.st_mint())
            .collect()
    }

    pub fn mint_count(&self) -> usize {
        self.table.iter().filter(|entry| !entry.is_empty()).count()
    }

    pub fn weight_count(&self) -> usize {
        self.table.iter().filter(|entry| entry.is_set()).count()
    }

    pub fn st_mint_count(&self) -> usize {
        self.table.iter().filter(|entry| !entry.is_empty()).count()
    }

    pub const fn table(&self) -> &[WeightEntry; MAX_ST_MINTS] {
        &self.table
    }

    pub const fn ncn(&self) -> &Pubkey {
        &self.ncn
    }

    pub fn ncn_epoch(&self) -> u64 {
        self.epoch.into()
    }

    pub fn slot_created(&self) -> u64 {
        self.slot_created.into()
    }

    pub fn vault_count(&self) -> u64 {
        self.vault_count.into()
    }

    pub fn vault_entry_count(&self) -> usize {
        self.vault_registry
            .iter()
            .filter(|entry| !entry.is_empty())
            .count()
    }

    pub fn vault_registry_initialized(&self) -> bool {
        self.vault_count() == self.vault_entry_count() as u64
    }

    pub fn table_initialized(&self) -> bool {
        self.mint_count() > 0
    }

    pub fn finalized(&self) -> bool {
        self.vault_registry_initialized()
            && self.table_initialized()
            && self.mint_count() == self.weight_count()
    }

    pub fn check_table_initialized(&self) -> Result<(), RelayerNcnError> {
        if !self.table_initialized() {
            return Err(RelayerNcnError::TableNotInitialized);
        }
        Ok(())
    }

    pub fn check_registry_initialized(&self) -> Result<(), RelayerNcnError> {
        if !self.vault_registry_initialized() {
            return Err(RelayerNcnError::RegistryNotInitialized);
        }
        Ok(())
    }

    pub fn check_registry_for_vault(&self, vault_index: u64) -> Result<(), RelayerNcnError> {
        if vault_index == VaultEntry::EMPTY_VAULT_INDEX {
            return Err(RelayerNcnError::VaultNotInRegistry);
        }

        if !self
            .vault_registry
            .iter()
            .any(|entry| entry.vault_index().eq(&vault_index))
        {
            return Err(RelayerNcnError::VaultNotInRegistry);
        }
        Ok(())
    }

    pub fn load(
        program_id: &Pubkey,
        weight_table: &AccountInfo,
        ncn: &Pubkey,
        ncn_epoch: u64,
        expect_writable: bool,
    ) -> Result<(), ProgramError> {
        let expected_pda = Self::find_program_address(program_id, ncn, ncn_epoch).0;
        check_load(
            program_id,
            weight_table,
            &expected_pda,
            Some(Self::DISCRIMINATOR),
            expect_writable,
        )
    }
}