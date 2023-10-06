use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("User account is frozen")]
    UserFrozenError,
}
