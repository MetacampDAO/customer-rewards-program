use anchor_lang::prelude::*;

use crate::validator::*;

// GLOBAL
pub fn process_init_global(ctx: Context<InitGlobal>) -> Result<()> {
    let global = &mut ctx.accounts.global_state;
    let initializer = &mut ctx.accounts.initializer;

    global.store_counter = 0;
    global.update_authority = initializer.key();

    Ok(())
}
pub fn process_update_global_authority(ctx: Context<UpdateGlobalAuthority>) -> Result<()> {
    let global = &mut ctx.accounts.global_state;
    let new_authority = &mut ctx.accounts.new_authority;

    global.update_authority = new_authority.key();

    Ok(())
}

// STORE
pub fn process_init_or_update_store(
    ctx: Context<InitOrUpdateStore>,
    store_count: u64,
    url: String,
) -> Result<()> {
    let global = &mut ctx.accounts.global_state;
    let store = &mut ctx.accounts.store;
    let initializer = &mut ctx.accounts.initializer;
    let store_reward_mint = &mut ctx.accounts.store_reward_mint;

    if !store.is_initialized {
        global.store_counter += 1;

        store.is_initialized = true;
        store.store_count = store_count;
        store.reward_mint = store_reward_mint.key();

        store.store_authority = initializer.key();
    }
    store.url = url;

    Ok(())
}
pub fn process_update_store_authority(ctx: Context<UpdateStoreAuthority>) -> Result<()> {
    let store = &mut ctx.accounts.store;
    let new_authority = &mut ctx.accounts.new_authority;

    store.store_authority = new_authority.key();

    Ok(())
}
