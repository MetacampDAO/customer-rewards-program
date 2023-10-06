use anchor_lang::prelude::*;

#[account]
pub struct Global {
    pub is_active: bool,
    pub store: Pubkey,
    pub coupon_counter: u64,
    pub payment_receiver: Pubkey,
}
#[account]
pub struct Coupon {
    pub is_initialize: bool,
    pub is_valid: bool,
    pub coupon_count: u64,
    pub store: Pubkey,
    pub coupon_mint: Pubkey,
    pub reward_mint: Pubkey,
    pub reward_cost: u64,
    pub stable_mint: Pubkey,
    pub stable_cost: u64,
    pub sales_start_date: u64,
    pub sales_end_date: u64,
    pub remaining_amount: u64,
    pub sales_commission_basis_point: u16,
    pub uri: String,
}

const DISCRIMINATOR: usize = 8;
const PUBKEY: usize = 32;
const PREFIX: usize = 4;
const BOOL: usize = 1;
const U64: usize = 8;
const URI_LENGTH: usize = 50;

impl Global {
    pub fn len() -> usize {
        DISCRIMINATOR + BOOL + PUBKEY + U64 + PUBKEY
    }
}
impl Coupon {
    pub fn len() -> usize {
        DISCRIMINATOR
            + BOOL // is_initialize
            + BOOL // is_valid
            + U64 // coupon_count
            + PUBKEY // store
            + PUBKEY // coupon_mint
            + PUBKEY // reward_mint
            + U64 // reward_cost
            + PUBKEY // stable_mint
            + U64 // stable_cost
            + U64 // sales_start_date
            + U64 // sales_end_date
            + U64 // remaining_amount
            + U64 // sales_commission_stable
            + (PREFIX + URI_LENGTH) // uri
    }
}
