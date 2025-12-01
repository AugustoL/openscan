import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { parseEther, decodeFunctionData, getAddress } from "viem";

describe("OpenScanPayment", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [deployer, payer] = await viem.getWalletClients();

  it("Should deploy with deployer as owner", async function () {
    const payment = await viem.deployContract("OpenScanPayment", [deployer.account.address]);
    const owner = await payment.read.owner();
    assert.equal(owner.toLowerCase(), deployer.account.address.toLowerCase());
  });

  it("Should emit PaymentReceived event on pay()", async function () {
    const payment = await viem.deployContract("OpenScanPayment", [deployer.account.address]);
    const amount = parseEther("1");

    await viem.assertions.emitWithArgs(
      payment.write.pay({ value: amount, account: payer.account }),
      payment,
      "PaymentReceived",
      [getAddress(payer.account.address), amount],
    );
  });

  it("Should revert pay() with zero value", async function () {
    const payment = await viem.deployContract("OpenScanPayment", [deployer.account.address]);

    await assert.rejects(
      payment.write.pay({ value: 0n, account: payer.account }),
      /payment must be greater than zero/,
    );
  });

  it("Should forward ETH to owner on pay()", async function () {
    const payment = await viem.deployContract("OpenScanPayment", [deployer.account.address]);
    const amount = parseEther("1");

    const ownerBalanceBefore = await publicClient.getBalance({
      address: deployer.account.address,
    });

    await payment.write.pay({ value: amount, account: payer.account });

    const ownerBalanceAfter = await publicClient.getBalance({
      address: deployer.account.address,
    });

    assert.equal(ownerBalanceAfter - ownerBalanceBefore, amount);
  });

  it("Should emit DonationReceived event on donate()", async function () {
    const payment = await viem.deployContract("OpenScanPayment", [deployer.account.address]);
    const amount = parseEther("0.5");
    const message = "Thanks for OpenScan!";

    await viem.assertions.emitWithArgs(
      payment.write.donate([message], { value: amount, account: payer.account }),
      payment,
      "DonationReceived",
      [getAddress(payer.account.address), amount],
    );
  });

  it("Should revert donate() with zero value", async function () {
    const payment = await viem.deployContract("OpenScanPayment", [deployer.account.address]);

    await assert.rejects(
      payment.write.donate(["Hello"], { value: 0n, account: payer.account }),
      /donation must be greater than zero/,
    );
  });

  it("Should store message in calldata on donate()", async function () {
    const payment = await viem.deployContract("OpenScanPayment", [deployer.account.address]);
    const amount = parseEther("0.1");
    const message = "Hello from donor!";

    const txHash = await payment.write.donate([message], {
      value: amount,
      account: payer.account,
    });

    const tx = await publicClient.getTransaction({ hash: txHash });

    // Decode the calldata to extract the message
    const decoded = decodeFunctionData({
      abi: payment.abi,
      data: tx.input,
    });

    assert.equal(decoded.functionName, "donate");
    assert.equal((decoded.args as [string])[0], message);
  });

  it("Should allow owner to executeCall", async function () {
    const payment = await viem.deployContract("OpenScanPayment", [deployer.account.address]);

    // Deploy a counter to test executeCall
    const counter = await viem.deployContract("Counter");
    const initialValue = await counter.read.x();

    // Encode the inc() call
    const { encodeFunctionData } = await import("viem");
    const callData = encodeFunctionData({
      abi: counter.abi,
      functionName: "inc",
      args: [],
    });

    // Execute via payment contract
    await payment.write.executeCall([counter.address, callData], {
      account: deployer.account,
    });

    const newValue = await counter.read.x();
    assert.equal(newValue, initialValue + 1n);
  });

  it("Should revert executeCall for non-owner", async function () {
    const payment = await viem.deployContract("OpenScanPayment", [deployer.account.address]);
    const counter = await viem.deployContract("Counter");

    const { encodeFunctionData } = await import("viem");
    const callData = encodeFunctionData({
      abi: counter.abi,
      functionName: "inc",
      args: [],
    });

    await assert.rejects(
      payment.write.executeCall([counter.address, callData], {
        account: payer.account,
      }),
      /OwnableUnauthorizedAccount/,
    );
  });
});
