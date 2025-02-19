use bytemuck::{Pod, Zeroable};
use jito_bytemuck::types::PodU128;
use shank::ShankType;

use crate::{error::RelayerNcnError
            // , ncn_fee_group::NcnFeeGroup
};

#[derive(Debug, Clone, Copy, Zeroable, ShankType, Pod)]
#[repr(C)]
pub struct StakeWeights {
    /// The total stake weight - used for voting
    stake_weight: PodU128,
    /// The components that make up the total stake weight - used for rewards
    ncn_fee_group_stake_weights: [NcnFeeGroupWeight; 8],
}

impl Default for StakeWeights {
    fn default() -> Self {
        Self {
            stake_weight: PodU128::from(0),
            ncn_fee_group_stake_weights: [NcnFeeGroupWeight::default();
                8],
        }
    }
}

impl StakeWeights {
    pub fn new(stake_weight: u128) -> Self {
        Self {
            stake_weight: PodU128::from(stake_weight),
            ncn_fee_group_stake_weights: [NcnFeeGroupWeight::default();
                8],
        }
    }

    pub fn snapshot(
        // ncn_fee_group: NcnFeeGroup,
        stake_weight: u128,
        reward_multiplier_bps: u64,
    ) -> Result<Self, RelayerNcnError> {
        let mut stake_weights = Self::default();

        let reward_stake_weight = (reward_multiplier_bps as u128)
            .checked_mul(stake_weight)
            .ok_or(RelayerNcnError::ArithmeticOverflow)?;

        stake_weights.increment_stake_weight(stake_weight)?;
        // stake_weights.increment_ncn_fee_group_stake_weight(ncn_fee_group, reward_stake_weight)?;

        Ok(stake_weights)
    }

    pub fn stake_weight(&self) -> u128 {
        self.stake_weight.into()
    }

    // pub fn ncn_fee_group_stake_weight(
    //     &self,
    //     ncn_fee_group: NcnFeeGroup,
    // ) -> Result<u128, TipRouterError> {
    //     let group_index = ncn_fee_group.group_index()?;
    //
    //     Ok(self.ncn_fee_group_stake_weights[group_index].weight())
    // }

    pub fn increment(&mut self, stake_weight: &Self) -> Result<(), RelayerNcnError> {
        self.increment_stake_weight(stake_weight.stake_weight())?;

        // for group in NcnFeeGroup::all_groups().iter() {
        //     self.increment_ncn_fee_group_stake_weight(
        //         *group,
        //         stake_weight.ncn_fee_group_stake_weight(*group)?,
        //     )?;
        // }

        Ok(())
    }

    fn increment_stake_weight(&mut self, stake_weight: u128) -> Result<(), RelayerNcnError> {
        self.stake_weight = PodU128::from(
            self.stake_weight()
                .checked_add(stake_weight)
                .ok_or(RelayerNcnError::ArithmeticOverflow)?,
        );

        Ok(())
    }

    // fn increment_ncn_fee_group_stake_weight(
    //     &mut self,
    //     ncn_fee_group: NcnFeeGroup,
    //     stake_weight: u128,
    // ) -> Result<(), TipRouterError> {
    //     let group_index = ncn_fee_group.group_index()?;
    //
    //     self.ncn_fee_group_stake_weights[group_index].weight = PodU128::from(
    //         self.ncn_fee_group_stake_weight(ncn_fee_group)?
    //             .checked_add(stake_weight)
    //             .ok_or(TipRouterError::ArithmeticOverflow)?,
    //     );
    //
    //     Ok(())
    // }

    pub fn decrement(&mut self, other: &Self) -> Result<(), RelayerNcnError> {
        self.decrement_stake_weight(other.stake_weight())?;

        // for group in NcnFeeGroup::all_groups().iter() {
        //     self.decrement_ncn_fee_group_stake_weight(
        //         *group,
        //         other.ncn_fee_group_stake_weight(*group)?,
        //     )?;
        // }

        Ok(())
    }

    fn decrement_stake_weight(&mut self, stake_weight: u128) -> Result<(), RelayerNcnError> {
        self.stake_weight = PodU128::from(
            self.stake_weight()
                .checked_sub(stake_weight)
                .ok_or(RelayerNcnError::ArithmeticOverflow)?,
        );

        Ok(())
    }

    // fn decrement_ncn_fee_group_stake_weight(
    //     &mut self,
    //     ncn_fee_group: NcnFeeGroup,
    //     stake_weight: u128,
    // ) -> Result<(), TipRouterError> {
    //     let group_index = ncn_fee_group.group_index()?;
    //
    //     self.ncn_fee_group_stake_weights[group_index].weight = PodU128::from(
    //         self.ncn_fee_group_stake_weight(ncn_fee_group)?
    //             .checked_sub(stake_weight)
    //             .ok_or(TipRouterError::ArithmeticOverflow)?,
    //     );
    //     Ok(())
    // }
}

#[derive(Debug, Clone, Copy, Zeroable, ShankType, Pod)]
#[repr(C)]
pub struct NcnFeeGroupWeight {
    /// The weight
    weight: PodU128,
}

impl Default for NcnFeeGroupWeight {
    fn default() -> Self {
        Self {
            weight: PodU128::from(0),
        }
    }
}

impl NcnFeeGroupWeight {
    pub fn new(weight: u128) -> Self {
        Self {
            weight: PodU128::from(weight),
        }
    }

    pub fn weight(&self) -> u128 {
        self.weight.into()
    }
}
