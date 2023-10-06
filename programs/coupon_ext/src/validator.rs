use anchor_lang::{prelude::*, solana_program::instruction};
use anchor_spl::{token::{Mint, TokenAccount, Token}, associated_token::AssociatedToken};
use reward_program::state::Store;

use crate::state::*;

// COUPON
#[derive(Accounts)]
pub struct InitOrUpdateGlobal<'info> {
    #[account(init_if_needed, seeds=[b"global".as_ref(), store.key().as_ref()], bump, payer = payer, space= Global::len())]
    pub global: Account<'info, Global>,
    #[account(
        constraint = store.store_authority == store_authority.key()
    )]
    pub store: Account<'info, Store>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub store_authority: Signer<'info>,
    /// CHECK
    pub payment_receiver: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
#[derive(Accounts)]
#[instruction(coupon_count: u64)]
pub struct InitOrUpdateCoupon<'info> {
    #[account(mut, seeds=[b"global".as_ref(), store.key().as_ref()], bump)]
    pub global: Account<'info, Global>,
    #[account(init_if_needed, seeds=[b"coupon".as_ref(), store.key().as_ref(), coupon_count.to_le_bytes().as_ref()], bump, payer = payer, space= Coupon::len())]
    pub coupon: Account<'info, Coupon>,
    #[account(
        constraint = store.store_authority == store_authority.key()
    )]
    pub store: Account<'info, Store>,
    pub store_authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(constraint = coupon_mint.mint_authority.unwrap() == coupon.key())]
    pub coupon_mint: Account<'info, Mint>,
    pub reward_mint: Account<'info, Mint>,
    pub stable_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
#[derive(Accounts)]
#[instruction(coupon_count: u64)]
pub struct MintCoupon<'info> {
    #[account(mut, seeds=[b"global".as_ref(), store.key().as_ref()], bump)]
    pub global: Box<Account<'info, Global>>,
    pub store: Box<Account<'info, Store>>,
    #[account(
        mut, seeds=[b"coupon".as_ref(), store.key().as_ref(), coupon_count.to_le_bytes().as_ref()], bump,
        constraint = coupon.coupon_mint == coupon_mint.key()
    )]
    pub coupon: Box<Account<'info, Coupon>>,
    #[account(mut, constraint = coupon_mint.mint_authority.unwrap() == coupon.key())]
    pub coupon_mint: Box<Account<'info, Mint>>,
    pub payment_mint: Box<Account<'info, Mint>>,

    /// CHECK: must be global payment receiver
    #[account(constraint = global.payment_receiver == payment_receiver.key())]
    pub payment_receiver: AccountInfo<'info>,
    #[account(
        mut, 
        constraint = payment_receiver_ata.owner == payment_receiver.key(),
        constraint = payment_receiver_ata.mint == payment_mint.key()
    )]
    pub payment_receiver_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub facilitator: Signer<'info>,
    #[account(
        init_if_needed,
        payer = facilitator,
        associated_token::mint = payment_mint,
        associated_token::authority = facilitator
    )]
    pub facilitator_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub payment_owner: Signer<'info>,
    #[account(mut, constraint = payment_owner_ata.mint == payment_mint.key())]
    pub payment_owner_ata: Box<Account<'info, TokenAccount>>,
    /// CHECK: must be global payment receiver
    #[account(constraint = buyer_coupon_ata.owner == buyer_coupon_owner.key())]
    pub buyer_coupon_owner: AccountInfo<'info>,
    #[account(
        init_if_needed,
        payer = facilitator,
        associated_token::mint = coupon_mint,
        associated_token::authority = buyer_coupon_owner
    )]
    pub buyer_coupon_ata: Box<Account<'info, TokenAccount>>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
#[derive(Accounts)]
#[instruction(coupon_count: u64)]
pub struct CloseAccount<'info> {
    #[account(mut, seeds=[b"coupon".as_ref(), store.key().as_ref(), coupon_count.to_le_bytes().as_ref()], bump, close = initializer)]
    pub coupon: Account<'info, Coupon>,
    pub store: Account<'info, Store>,
    #[account(
        mut,
        constraint = store.store_authority == initializer.key()
    )]
    pub initializer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
