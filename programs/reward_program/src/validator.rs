use anchor_lang::prelude::*;
use anchor_spl::token::*;

use crate::state::*;

// GLOBAL
#[derive(Accounts)]
pub struct InitGlobal<'info> {
    #[account(init_if_needed, seeds=[b"global"], bump, payer = initializer, space= Global::len())]
    pub global_state: Account<'info, Global>,
    #[account(mut)]
    pub initializer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
#[derive(Accounts)]
pub struct UpdateGlobalAuthority<'info> {
    #[account(mut, seeds=[b"global"], bump)]
    pub global_state: Account<'info, Global>,
    #[account(
        mut,
        constraint = global_state.update_authority == current_authority.key()
    )]
    pub current_authority: Signer<'info>,
    /// CHECK:
    #[account(mut)]
    pub new_authority: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// STORE
#[derive(Accounts)]
#[instruction(store_count: u64)]
pub struct InitOrUpdateStore<'info> {
    #[account(mut, seeds=[b"global"], bump)]
    pub global_state: Account<'info, Global>,
    #[account(init_if_needed, seeds=[b"store".as_ref(), &store_count.to_le_bytes()], bump, payer = initializer, space = Store::len())]
    pub store: Account<'info, Store>,
    #[account(mut)]
    pub initializer: Signer<'info>,
    pub store_reward_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(store_count: u64)]
pub struct UpdateStoreAuthority<'info> {
    #[account(
        mut, seeds=[b"store".as_ref(), &store_count.to_le_bytes()], bump,
        constraint = store.store_authority.key() == current_authority.key()
    )]
    pub store: Account<'info, Store>,
    #[account(mut)]
    pub current_authority: Signer<'info>,
    /// CHECK:
    #[account(mut)]
    pub new_authority: AccountInfo<'info>,
}
#[derive(Accounts)]
#[instruction(store_count: u64)]
pub struct CloseStore<'info> {
    #[account(
        mut, seeds=[b"store".as_ref(), &store_count.to_le_bytes()], bump,
        constraint = store.store_authority.key() == store_authority.key(),
        close = store_authority
    )]
    pub store: Account<'info, Store>,
    #[account(mut)]
    pub store_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
