mod error;
mod processor;
pub mod state;
mod validator;

use anchor_lang::prelude::*;

use crate::processor::*;
use crate::validator::*;

declare_id!("37zJ7z5BXE6vBaDHYEAfKxYfYdMFKdzT2qfq7aJMqzNX");

#[program]
pub mod reward_program {
    use super::*;

    // GLOBAL
    pub fn init_global(ctx: Context<InitGlobal>) -> Result<()> {
        process_init_global(ctx)?;
        Ok(())
    }
    pub fn update_global_authority(ctx: Context<UpdateGlobalAuthority>) -> Result<()> {
        process_update_global_authority(ctx)?;
        Ok(())
    }

    // STORE
    pub fn init_or_update_store(
        ctx: Context<InitOrUpdateStore>,
        store_count: u64,
        url: String,
    ) -> Result<()> {
        process_init_or_update_store(ctx, store_count, url)?;
        Ok(())
    }
    pub fn update_store_authority(
        ctx: Context<UpdateStoreAuthority>,
        _store_count: u64,
    ) -> Result<()> {
        process_update_store_authority(ctx)?;
        Ok(())
    }
    pub fn close_store(_ctx: Context<CloseStore>, _store_count: u64) -> Result<()> {
        Ok(())
    }
}
