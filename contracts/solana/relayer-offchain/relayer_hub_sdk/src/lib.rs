#![allow(clippy::redundant_pub_crate)]
use anchor_lang::{declare_program};

declare_program!(relayer_hub);

pub mod instruction;
