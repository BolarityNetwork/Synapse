use anchor_lang::prelude::Pubkey;

/// Converts an Ethereum address (20 bytes) to a Solana Pubkey (32 bytes)
/// by padding with zeros
pub fn ethereum_address_to_pubkey(eth_address: &[u8; 20]) -> Pubkey {
    let mut bytes = [0u8; 32];
    bytes[0..20].copy_from_slice(eth_address);
    Pubkey::new_from_array(bytes)
}

pub fn ethereum_address_fill_pubkey(eth_address: &[u8; 20]) -> Pubkey {
    let mut bytes = [0u8; 32];
    bytes[12..32].copy_from_slice(eth_address);
    Pubkey::new_from_array(bytes)
}