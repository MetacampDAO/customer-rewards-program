import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { RewardProgram } from "./idl/reward_program";
import { CouponExt } from "./idl/coupon_ext";

// =========================== REWARD ===========================
export const getRewardGlobalPda = async (
  program: anchor.Program<RewardProgram>
) => {
  const [globalPda, _globalBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("global")],
    program.programId
  );
  try {
    return await program.account.global.fetch(globalPda);
  } catch (error) {
    return null;
  }
};

export const getStorePda = (
  program: anchor.Program<RewardProgram>,
  storeCount: anchor.BN
) => {
  const [storePda, _storeBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("store"), storeCount.toBuffer("le", 8)],
    program.programId
  );
  return storePda;
};

export const getAllStorePdaByStoreAuthority = async (
  program: anchor.Program<RewardProgram>,
  storeAuthority: anchor.web3.PublicKey
) => {
  const filter = [
    {
      memcmp: {
        offset: 8, //prepend for anchor's discriminator
        bytes: storeAuthority.toBase58(),
      },
    },
  ];

  const data = await program.account.store.all(filter);

  return data;
};

// =========================== COUPON ===========================

export const getCouponGlobalPda = (
  program: anchor.Program<CouponExt>,
  storePubkey: anchor.web3.PublicKey
) => {
  const [couponGlobalPda, _couponGlobalBump] =
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("global"), storePubkey.toBuffer()],
      program.programId
    );
  return couponGlobalPda;
};

export const getCouponGlobalData = async (
  program: anchor.Program<CouponExt>,
  storePubkey: anchor.web3.PublicKey
) => {
  const [couponGlobalPda, _couponGlobalBump] =
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("global"), storePubkey.toBuffer()],
      program.programId
    );

  return await program.account.global.fetch(couponGlobalPda);
};

export const getCouponPda = (
  program: anchor.Program<CouponExt>,
  storePubkey: anchor.web3.PublicKey,
  couponCount: anchor.BN
) => {
  const [couponPda, _couponBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("coupon"),
      storePubkey.toBuffer(),
      couponCount.toBuffer("le", 8),
    ],
    program.programId
  );
  return couponPda;
};

export const getCouponData = async (
  program: anchor.Program<CouponExt>,
  storePubkey: anchor.web3.PublicKey,
  couponCount: anchor.BN
) => {
  const [couponPda, _couponBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("coupon"),
      storePubkey.toBuffer(),
      couponCount.toBuffer("le", 8),
    ],
    program.programId
  );
  return await program.account.coupon.fetch(couponPda);
};
