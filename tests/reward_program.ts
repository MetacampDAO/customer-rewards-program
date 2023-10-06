import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RewardProgram } from "../target/types/reward_program";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createMint,
  mintTo,
} from "@solana/spl-token";
import { assert } from "chai";
import {
  getAllStorePdaByStoreAuthority,
  getCouponGlobalData,
  getCouponGlobalPda,
  getCouponPda,
  getStorePda,
  signAndSendTx,
} from "./pda";
import { CouponExt } from "../target/types/coupon_ext";
import { getUnixTimestamp } from "./utils";

describe("reward_program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.RewardProgram as Program<RewardProgram>;
  const couponProgram = anchor.workspace.CouponExt as Program<CouponExt>;

  const globalAuthority = anchor.web3.Keypair.generate();
  const merchantA = anchor.web3.Keypair.generate();
  const merchantNewAuthority = anchor.web3.Keypair.generate();
  const facilitator = anchor.web3.Keypair.generate();
  const buyer = anchor.web3.Keypair.generate();
  let mintA = null;
  let couponMint = null;
  let rewardMint = null;
  let stableMint = null;
  const MERCHANT_A_URI = "www.linkToMerchantAExternalData";

  const [globalPda, _globalBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("global")],
    program.programId
  );

  it("Setup!", async () => {
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(merchantA.publicKey, 1e9)
    );
    const ix1 = anchor.web3.SystemProgram.transfer({
      fromPubkey: merchantA.publicKey,
      toPubkey: merchantNewAuthority.publicKey,
      lamports: 1e9 / 4,
    });
    const ix2 = anchor.web3.SystemProgram.transfer({
      fromPubkey: merchantA.publicKey,
      toPubkey: facilitator.publicKey,
      lamports: 1e9 / 4,
    });
    const ix3 = anchor.web3.SystemProgram.transfer({
      fromPubkey: merchantA.publicKey,
      toPubkey: buyer.publicKey,
      lamports: 1e9 / 4,
    });
    await signAndSendTx(
      program.provider.connection,
      new anchor.web3.Transaction().add(ix1, ix2),
      merchantA
    );

    mintA = await createMint(
      program.provider.connection,
      merchantA,
      merchantA.publicKey,
      merchantA.publicKey,
      2
    );

    rewardMint = await createMint(
      program.provider.connection,
      merchantA,
      merchantA.publicKey,
      merchantA.publicKey,
      2
    );
    stableMint = await createMint(
      program.provider.connection,
      merchantA,
      merchantA.publicKey,
      merchantA.publicKey,
      2
    );
  });

  // GLOBAL
  it("Create global account", async () => {
    await program.methods
      .initGlobal()
      .accounts({
        globalState: globalPda,
        initializer: merchantA.publicKey,
      })
      .signers([merchantA])
      .rpc();

    const globalData = await program.account.global.fetch(globalPda);
    assert.equal(+globalData.storeCounter, 0, "Check global store counter");
    assert.equal(
      globalData.updateAuthority.toString(),
      merchantA.publicKey.toString(),
      "Check global update authority"
    );
  });
  it("Change global authority", async () => {
    await program.methods
      .updateGlobalAuthority()
      .accounts({
        globalState: globalPda,
        currentAuthority: merchantA.publicKey,
        newAuthority: globalAuthority.publicKey,
      })
      .signers([merchantA])
      .rpc();

    const globalData = await program.account.global.fetch(globalPda);
    assert.equal(
      globalData.updateAuthority.toString(),
      globalAuthority.publicKey.toString(),
      "Check global update authority"
    );
  });

  // STORE
  it("Create new store", async () => {
    const globalDataBefore = await program.account.global.fetch(globalPda);
    const storePda = getStorePda(program, globalDataBefore.storeCounter);

    await program.methods
      .initOrUpdateStore(globalDataBefore.storeCounter, MERCHANT_A_URI)
      .accounts({
        globalState: globalPda,
        store: storePda,
        initializer: merchantA.publicKey,
        storeRewardMint: mintA,
      })
      .signers([merchantA])
      .rpc();

    const globalDataAfter = await program.account.global.fetch(globalPda);
    const storeData = await program.account.store.fetch(storePda);
    assert.equal(+globalDataAfter.storeCounter, 1, "Check global counter");
    assert.equal(+storeData.storeCount, 0, "Check store count");
    assert.equal(storeData.isInitialized, true, "Check store is initialize");
    assert.equal(
      storeData.storeAuthority.toString(),
      merchantA.publicKey.toString(),
      "Check store authority"
    );
    assert.equal(storeData.url, MERCHANT_A_URI, "Check store uri");
  });
  // STORE
  it("Update URI of created new store", async () => {
    const storesPdaByMerchantA = await getAllStorePdaByStoreAuthority(
      program,
      merchantA.publicKey
    );
    const newStoreUri = "this is";

    await program.methods
      .initOrUpdateStore(
        storesPdaByMerchantA[0].account.storeCount,
        newStoreUri
      )
      .accounts({
        globalState: globalPda,
        store: storesPdaByMerchantA[0].publicKey,
        initializer: merchantA.publicKey,
        storeRewardMint: mintA,
      })
      .signers([merchantA])
      .rpc();

    const storeData = await program.account.store.fetch(
      storesPdaByMerchantA[0].publicKey
    );
    assert.equal(storeData.url, newStoreUri, "Check store uri");
  });
  // STORE
  // it("Update store authority", async () => {
  //   const storesPdaByMerchantA = await getAllStorePdaByStoreAuthority(
  //     program,
  //     merchantA.publicKey
  //   );
  //   const newStoreUri = "this is";

  //   await program.methods
  //     .updateStoreAuthority(storesPdaByMerchantA[0].account.storeCount)
  //     .accounts({
  //       store: storesPdaByMerchantA[0].publicKey,
  //       currentAuthority: merchantA.publicKey,
  //       newAuthority: merchantNewAuthority.publicKey,
  //     })
  //     .signers([merchantA])
  //     .rpc();

  //   const storeData = await program.account.store.fetch(
  //     storesPdaByMerchantA[0].publicKey
  //   );
  //   assert.equal(
  //     storeData.storeAuthority.toString(),
  //     merchantNewAuthority.publicKey.toString(),
  //     "Check store authority"
  //   );
  // });
  // it("Close store authority", async () => {
  //   const storesPdaByMerchantA = await getAllStorePdaByStoreAuthority(
  //     program,
  //     merchantNewAuthority.publicKey
  //   );

  //   await program.methods
  //     .closeStore(storesPdaByMerchantA[0].account.storeCount)
  //     .accounts({
  //       store: storesPdaByMerchantA[0].publicKey,
  //       storeAuthority: merchantNewAuthority.publicKey,
  //     })
  //     .signers([merchantNewAuthority])
  //     .rpc();

  //   try {
  //     await program.account.store.fetch(storesPdaByMerchantA[0].publicKey);
  //     assert.fail();
  //   } catch (error) {
  //     assert.ok(true);
  //   }
  // });

  // =========================== COUPON EXTENSION ==============================

  it("Initialize coupon global account", async () => {
    const storesPdaByMerchantA = await getAllStorePdaByStoreAuthority(
      program,
      merchantA.publicKey
    );
    const couponGlobalPda = getCouponGlobalPda(
      couponProgram,
      storesPdaByMerchantA[0].publicKey
    );

    await couponProgram.methods
      .initializeOrUpdateGlobal()
      .accounts({
        global: couponGlobalPda,
        store: storesPdaByMerchantA[0].publicKey,
        payer: merchantA.publicKey,
        storeAuthority: merchantA.publicKey,
        paymentReceiver: merchantA.publicKey,
      })
      .signers([merchantA])
      .rpc();

    const couponGlobal = await couponProgram.account.global.fetch(
      couponGlobalPda
    );

    assert.equal(
      couponGlobal.store.toString(),
      storesPdaByMerchantA[0].publicKey.toString(),
      "Check store"
    );
    assert.equal(+couponGlobal.couponCounter, 0, "Check coupon global counter");
    assert.equal(
      couponGlobal.paymentReceiver.toString(),
      merchantA.publicKey.toString(),
      "Check payment receiver"
    );
  });

  it("Initialize new coupon account", async () => {
    const storesPdaByMerchantA = await getAllStorePdaByStoreAuthority(
      program,
      merchantA.publicKey
    );
    const couponGlobalPda = getCouponGlobalPda(
      couponProgram,
      storesPdaByMerchantA[0].publicKey
    );
    const couponGlobalDataBefore = await getCouponGlobalData(
      couponProgram,
      storesPdaByMerchantA[0].publicKey
    );
    const couponPda = getCouponPda(
      couponProgram,
      storesPdaByMerchantA[0].publicKey,
      couponGlobalDataBefore.couponCounter
    );
    couponMint = await createMint(
      program.provider.connection,
      merchantA,
      couponPda,
      merchantA.publicKey,
      2
    );
    const startTime = new anchor.BN(getUnixTimestamp(2023, 9, 30, 1300));
    const endTime = new anchor.BN(getUnixTimestamp(2023, 10, 30, 1300));
    const SALES_COMMISSION_BASIS_POINT = 500;
    const STABLE_PRICE = new anchor.BN(200);

    await couponProgram.methods
      .initializeOrUpdateCoupon(
        couponGlobalDataBefore.couponCounter,
        new anchor.BN(100),
        new anchor.BN(200),
        STABLE_PRICE,
        startTime,
        endTime,
        SALES_COMMISSION_BASIS_POINT,
        "link to more info about coupon"
      )
      .accounts({
        global: couponGlobalPda,
        coupon: couponPda,
        store: storesPdaByMerchantA[0].publicKey,
        storeAuthority: merchantA.publicKey,
        payer: merchantA.publicKey,
        couponMint: couponMint,
        rewardMint: rewardMint,
        stableMint: stableMint,
      })
      .signers([merchantA])
      .rpc();

    const couponData = await couponProgram.account.coupon.fetch(couponPda);
    const couponGlobalDataAfter = await getCouponGlobalData(
      couponProgram,
      storesPdaByMerchantA[0].publicKey
    );

    assert.equal(
      couponData.store.toString(),
      storesPdaByMerchantA[0].publicKey.toString(),
      "Check store"
    );

    assert.equal(
      +couponData.couponCount,
      +couponGlobalDataAfter.couponCounter - 1,
      "Check coupon global counter"
    );
    assert.equal(
      couponData.couponMint.toString(),
      couponMint.toString(),
      "Check coupon mint"
    );
    assert.equal(
      +couponData.salesCommissionBasisPoint,
      +SALES_COMMISSION_BASIS_POINT,
      "Check sales commission"
    );
  });

  it("Mint coupon", async () => {
    const storesPdaByMerchantA = await getAllStorePdaByStoreAuthority(
      program,
      merchantA.publicKey
    );
    const couponGlobalPda = getCouponGlobalPda(
      couponProgram,
      storesPdaByMerchantA[0].publicKey
    );
    const couponGlobalData = await getCouponGlobalData(
      couponProgram,
      storesPdaByMerchantA[0].publicKey
    );
    const couponPda = getCouponPda(
      couponProgram,
      storesPdaByMerchantA[0].publicKey,
      new anchor.BN(0)
    );

    const receiverAta = await createAssociatedTokenAccount(
      program.provider.connection,
      merchantA,
      rewardMint,
      merchantA.publicKey
    );

    const buyerAta = await createAssociatedTokenAccount(
      program.provider.connection,
      merchantA,
      rewardMint,
      buyer.publicKey
    );
    const buyerCouponAta = await createAssociatedTokenAccount(
      program.provider.connection,
      merchantA,
      couponMint,
      buyer.publicKey
    );

    const facilitatorAta = await createAssociatedTokenAccount(
      program.provider.connection,
      merchantA,
      rewardMint,
      facilitator.publicKey
    );

    await mintTo(
      program.provider.connection,
      merchantA,
      rewardMint,
      buyerAta,
      merchantA,
      1e9
    );

    try {
      await couponProgram.methods
        .mintCoupon(new anchor.BN(0), new anchor.BN(1))
        .accounts({
          global: couponGlobalPda,
          store: storesPdaByMerchantA[0].publicKey,
          coupon: couponPda,
          couponMint: couponMint,
          paymentMint: rewardMint,

          paymentReceiver: couponGlobalData.paymentReceiver,
          paymentReceiverAta: receiverAta,
          facilitator: facilitator.publicKey,
          facilitatorAta: facilitatorAta,
          paymentOwner: buyer.publicKey,
          paymentOwnerAta: buyerAta,
          buyerCouponOwner: buyer.publicKey,
          buyerCouponAta: buyerCouponAta,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([facilitator, buyer])
        .rpc();
    } catch (error) {
      console.log("ERROR:", error);
    }

    const buyerCouponBalance =
      await program.provider.connection.getTokenAccountBalance(buyerCouponAta);
    const facilitatorAtaBalance =
      await program.provider.connection.getTokenAccountBalance(facilitatorAta);
    const receiverAtaBalance =
      await program.provider.connection.getTokenAccountBalance(receiverAta);
    assert.equal(+buyerCouponBalance.value.amount, 1);
    assert.equal(+facilitatorAtaBalance.value.amount, 5);
    assert.equal(+receiverAtaBalance.value.amount, 95);
  });
});
