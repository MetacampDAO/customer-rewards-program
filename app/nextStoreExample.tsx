"use client";

import React, { useContext, useEffect, useState, createContext } from "react";
import * as anchor from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { RewardProgram, REWARD_IDL } from "./idl/reward_program";
import { CouponExt, COUPON_IDL } from "./idl/coupon_ext";
import * as pdaFetch from "./pdaFetch";

interface StoreConfig {
  rewardProgramClient: anchor.Program<RewardProgram> | null;
  couponProgramClient: anchor.Program<CouponExt> | null;
  signAndSendTransaction: (
    transaction: Transaction,
    partialSign?: boolean,
    signer?: Keypair | null
  ) => Promise<string | undefined>;
}

const StoreContext = createContext<StoreConfig>({
  rewardProgramClient: null,
  couponProgramClient: null,
  signAndSendTransaction: async () => "",
});

export function StoreProvider({ children }: { children: any }) {
  const [rewardProgramClient, setRewardProgramClient] =
    useState<anchor.Program<RewardProgram> | null>(null);
  const [couponProgramClient, setCouponProgramClient] =
    useState<anchor.Program<CouponExt> | null>(null);

  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  useEffect(() => {
    (async () => {
      try {
        if (!REWARD_IDL) {
          throw "Reward IDL File Required";
        }
        if (!COUPON_IDL) {
          throw "Coupon IDL File Required";
        }
        if (!process.env.NEXT_PUBLIC_PROGRAM_ID) {
          throw "ProgramID Required";
        }

        if (wallet) {
          const provider = new anchor.AnchorProvider(
            connection,
            wallet,
            anchor.AnchorProvider.defaultOptions()
          );
          anchor.setProvider(provider);
          const rewardProgram: anchor.Program<RewardProgram> =
            new anchor.Program<RewardProgram>(
              REWARD_IDL as RewardProgram,
              process.env.PROGRAM_ID!,
              provider
            );
          const couponExt: anchor.Program<CouponExt> =
            new anchor.Program<CouponExt>(
              COUPON_IDL as CouponExt,
              process.env.PROGRAM_ID!,
              provider
            );
          setRewardProgramClient(rewardProgram);
          setCouponProgramClient(couponExt);
        } else {
          const rewardProgram: anchor.Program<RewardProgram> =
            new anchor.Program<RewardProgram>(
              REWARD_IDL as RewardProgram,
              process.env.NEXT_PUBLIC_PROGRAM_ID!,
              { connection }
            );
          setRewardProgramClient(rewardProgram);

          const couponExt: anchor.Program<CouponExt> =
            new anchor.Program<CouponExt>(
              COUPON_IDL as CouponExt,
              process.env.PROGRAM_ID!,
              { connection }
            );
          setCouponProgramClient(couponExt);
        }
      } catch (err) {
        console.log(err);
      }
    })();
  }, [wallet]);

  const signAndSendTransaction = async (
    transaction: Transaction,
    partialSign = false,
    signer: Keypair | null = null
  ) => {
    if (wallet) {
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash("confirmed")
      ).blockhash;
      transaction.feePayer = wallet.publicKey;

      if (partialSign && signer) transaction.partialSign(signer);

      const signedTx = await wallet.signTransaction(transaction);
      const rawTransaction = signedTx.serialize();
      const txSig = await connection.sendRawTransaction(rawTransaction);
      return txSig;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        rewardProgramClient,
        couponProgramClient,
        signAndSendTransaction,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStoreContext = () => {
  const context = useContext(StoreContext);

  return {
    rewardProgramClient: context.rewardProgramClient!,
    couponProgramClient: context.couponProgramClient,
    signAndSendTransaction: context.signAndSendTransaction,
  };
};
