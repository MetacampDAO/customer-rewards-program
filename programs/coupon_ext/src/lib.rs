mod error;
mod state;
mod validator;

use anchor_lang::prelude::*;
use error::ErrorCode;
use validator::*;

declare_id!("CuhLQG6iDoB8qFjDBHe36ZWkapy2pyeatX6RcQg2hKeC");

#[program]
pub mod coupon_ext {
    use super::*;

    pub fn initialize_or_update_global(ctx: Context<InitOrUpdateGlobal>) -> Result<()> {
        let global = &mut ctx.accounts.global;
        let store = &mut ctx.accounts.store;

        if !global.is_active {
            global.is_active = true;
            global.coupon_counter = 0;
            global.store = store.key();
        }
        global.payment_receiver = ctx.accounts.payment_receiver.key();

        Ok(())
    }
    pub fn initialize_or_update_coupon(
        ctx: Context<InitOrUpdateCoupon>,
        coupon_count: u64,
        reward_cost: u64,
        stable_cost: u64,
        total_ticket_available: u64,
        sales_start_date: u64,
        sales_end_date: u64,
        sales_commission_basis_point: u16,
        uri: String,
    ) -> Result<()> {
        let global = &mut ctx.accounts.global;
        let coupon = &mut ctx.accounts.coupon;

        if !coupon.is_initialize {
            coupon.is_initialize = true;
            coupon.is_valid = true;
            coupon.store = ctx.accounts.store.key();
            coupon.coupon_count = coupon_count;
            coupon.coupon_mint = ctx.accounts.coupon_mint.key();
            coupon.reward_mint = ctx.accounts.reward_mint.key();
            coupon.stable_mint = ctx.accounts.stable_mint.key();

            global.coupon_counter = coupon_count + 1;
        }

        // UPDATE VALUES
        coupon.reward_cost = reward_cost;
        coupon.stable_cost = stable_cost;
        coupon.sales_start_date = sales_start_date;
        coupon.sales_end_date = sales_end_date;
        coupon.remaining_amount = total_ticket_available;
        coupon.sales_commission_basis_point = sales_commission_basis_point;
        coupon.uri = uri;

        Ok(())
    }
    pub fn mint_coupon(ctx: Context<MintCoupon>, coupon_count: u64, amount: u64) -> Result<()> {
        // TODO: BUYER PAYING OR SELLER PAYING
        if amount < 1 {
            return err!(ErrorCode::InsufficientAmount);
        }

        let store = &mut ctx.accounts.store;
        let coupon = &mut ctx.accounts.coupon;
        let coupon_mint = &mut ctx.accounts.coupon_mint;
        // Payment receiver info
        let payment_receiver_ata = &mut ctx.accounts.payment_receiver_ata;
        let payment_mint = &mut ctx.accounts.payment_mint;
        // Transaction facilitator info
        let facilitator_ata = &mut ctx.accounts.facilitator_ata;
        // Payment from info
        let payment_owner = &mut ctx.accounts.payment_owner;
        let payment_owner_ata = &mut ctx.accounts.payment_owner_ata;
        // Buyer info
        let buyer_coupon_ata = &mut ctx.accounts.buyer_coupon_ata;
        let token_program = &mut ctx.accounts.token_program;

        let total_payment_amount = if coupon.reward_mint == payment_mint.key() {
            coupon.reward_cost * amount
        } else {
            coupon.stable_cost * amount
        };

        let seller_commission =
            (total_payment_amount * u64::from(coupon.sales_commission_basis_point)) / 10_000;

        // Transfer commission to seller
        let transfer_payment_cpi_accounts = anchor_spl::token::Transfer {
            from: payment_owner_ata.to_account_info(),
            to: facilitator_ata.to_account_info(),
            authority: payment_owner.to_account_info(),
        };
        let transfer_payment_context = CpiContext::new(
            token_program.to_account_info(),
            transfer_payment_cpi_accounts,
        );
        anchor_spl::token::transfer(transfer_payment_context, seller_commission)?;

        // Transfer payment to payment_receiver
        let transfer_payment_cpi_accounts = anchor_spl::token::Transfer {
            from: payment_owner_ata.to_account_info(),
            to: payment_receiver_ata.to_account_info(),
            authority: payment_owner.to_account_info(),
        };
        let transfer_payment_context = CpiContext::new(
            token_program.to_account_info(),
            transfer_payment_cpi_accounts,
        );
        anchor_spl::token::transfer(
            transfer_payment_context,
            total_payment_amount - seller_commission,
        )?;

        msg!("HIT 1");

        // Mint SFT to buyer
        let auth_bump = *ctx.bumps.get("coupon").unwrap();
        let seeds = &[
            //Reconstructing the seed
            b"coupon".as_ref(),
            &store.key().to_bytes(),
            &coupon_count.to_le_bytes(),
            &[auth_bump],
        ];
        let signer = &[&seeds[..]];
        msg!(
            "coupon_mint authority: {}",
            coupon_mint.mint_authority.unwrap().key()
        );
        msg!("coupon key: {}", coupon.key());

        let mint_coupon_cpi_accounts = anchor_spl::token::MintTo {
            mint: coupon_mint.to_account_info(),
            to: buyer_coupon_ata.to_account_info(),
            authority: coupon.to_account_info(),
        };
        let min_coupon_context = CpiContext::new_with_signer(
            token_program.to_account_info(),
            mint_coupon_cpi_accounts,
            signer,
        );
        anchor_spl::token::mint_to(min_coupon_context, amount)?;
        msg!("hit 3");
        // Update state
        coupon.remaining_amount -= amount;

        Ok(())
    }
    pub fn close_discount(_ctx: Context<CloseAccount>, _store_count: u64) -> Result<()> {
        Ok(())
    }
}
