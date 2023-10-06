import * as anchor from "@coral-xyz/anchor";
import { RewardProgram } from "../target/types/reward_program";
import { CouponExt } from "../target/types/coupon_ext";

export const signAndSendTx = async (
  connection: anchor.web3.Connection,
  tx: anchor.web3.Transaction,
  payer: anchor.web3.Keypair
) => {
  tx.recentBlockhash = (
    await connection.getLatestBlockhash("singleGossip")
  ).blockhash;
  tx.feePayer = payer.publicKey;
  tx.sign(payer);
  const rawTransaction = tx.serialize();
  const txSig = await connection.sendRawTransaction(rawTransaction);

  const latestBlockHash = await connection.getLatestBlockhash();

  await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: txSig,
  });

  return txSig;
};

// =========================== STORE ===========================

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
