use anchor_lang::prelude::*;

#[account]
pub struct Global {
    pub update_authority: Pubkey,
    pub store_counter: u64,
}

#[account]
pub struct Store {
    pub store_authority: Pubkey,
    pub reward_mint: Pubkey,
    pub is_initialized: bool,
    pub store_count: u64,
    pub url: String,
}

const DISCRIMINATOR: usize = 8;
const PREFIX: usize = 4;
const PUBKEY: usize = 32;
const BOOL: usize = 1;
const U64: usize = 8;
const URI_LENGTH: usize = 50;

impl Global {
    pub fn len() -> usize {
        DISCRIMINATOR + PUBKEY + U64
    }
}

impl Store {
    pub fn len() -> usize {
        DISCRIMINATOR + PUBKEY + PUBKEY + BOOL + U64 + (PREFIX + URI_LENGTH)
    }
}
