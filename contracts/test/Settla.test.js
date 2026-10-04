const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const usdc = (x) => ethers.parseUnits(x, 6);
const Status = { None: 0n, Open: 1n, Paid: 2n, Cancelled: 3n };

describe("Settla", function () {
  async function deploy() {
    const [merchant, payer, other] = await ethers.getSigners();
    const token = await (await ethers.getContractFactory("MockUSDC")).deploy();
    const settla = await (await ethers.getContractFactory("Settla")).deploy(await token.getAddress());
    await token.mint(payer.address, usdc("1000"));
    return { settla, token, merchant, payer, other };
  }

  async function withInvoice() {
    const ctx = await deploy();
    await ctx.settla.connect(ctx.merchant).createInvoice(usdc("25"), "Order #1042");
    return { ...ctx, id: 1n };
  }

  describe("constructor", function () {
    it("rejects the zero address", async function () {
      const Settla = await ethers.getContractFactory("Settla");
      await expect(Settla.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(Settla, "ZeroAddress");
    });
  });

  describe("createInvoice", function () {
    it("stores merchant, amount, memo and emits InvoiceCreated", async function () {
      const { settla, merchant } = await loadFixture(deploy);
      await expect(settla.connect(merchant).createInvoice(usdc("25"), "Order #1042"))
        .to.emit(settla, "InvoiceCreated")
        .withArgs(1n, merchant.address, usdc("25"), "Order #1042");

      const inv = await settla.getInvoice(1n);
      expect(inv.merchant).to.equal(merchant.address);
      expect(inv.payer).to.equal(ethers.ZeroAddress);
      expect(inv.amount).to.equal(usdc("25"));
      expect(inv.memo).to.equal("Order #1042");
      expect(inv.status).to.equal(Status.Open);
      expect(inv.createdAt).to.be.greaterThan(0n);
      expect(inv.paidAt).to.equal(0n);
      expect(await settla.nextId()).to.equal(2n);
    });

    it("reverts on zero amount", async function () {
      const { settla } = await loadFixture(deploy);
      await expect(settla.createInvoice(0n, "x")).to.be.revertedWithCustomError(settla, "ZeroAmount");
    });

    it("accepts a memo at the limit and rejects one over it", async function () {
      const { settla } = await loadFixture(deploy);
      await expect(settla.createInvoice(usdc("1"), "a".repeat(280))).to.not.be.reverted;
      await expect(settla.createInvoice(usdc("1"), "a".repeat(281))).to.be.revertedWithCustomError(
        settla,
        "MemoTooLong",
      );
    });
  });

  describe("pay", function () {
    it("moves exact USDC from payer to merchant and emits Settled", async function () {
      const { settla, token, merchant, payer, id } = await loadFixture(withInvoice);
      await token.connect(payer).approve(await settla.getAddress(), usdc("25"));

      const tx = settla.connect(payer).pay(id);
      await expect(tx).to.emit(settla, "Settled").withArgs(id, merchant.address, payer.address, usdc("25"));
      await expect(tx).to.changeTokenBalances(token, [payer, merchant], [-usdc("25"), usdc("25")]);

      const inv = await settla.getInvoice(id);
      expect(inv.status).to.equal(Status.Paid);
      expect(inv.payer).to.equal(payer.address);
      expect(inv.paidAt).to.be.greaterThan(0n);
      expect(await token.balanceOf(await settla.getAddress())).to.equal(0n);
    });

    it("reverts if the invoice is already paid", async function () {
      const { settla, token, payer, id } = await loadFixture(withInvoice);
      await token.connect(payer).approve(await settla.getAddress(), usdc("50"));
      await settla.connect(payer).pay(id);
      await expect(settla.connect(payer).pay(id)).to.be.revertedWithCustomError(settla, "NotOpen");
    });

    it("reverts if the invoice is cancelled", async function () {
      const { settla, token, merchant, payer, id } = await loadFixture(withInvoice);
      await token.connect(payer).approve(await settla.getAddress(), usdc("25"));
      await settla.connect(merchant).cancel(id);
      await expect(settla.connect(payer).pay(id)).to.be.revertedWithCustomError(settla, "NotOpen");
    });

    it("reverts for an invoice that does not exist", async function () {
      const { settla, payer } = await loadFixture(withInvoice);
      await expect(settla.connect(payer).pay(99n)).to.be.revertedWithCustomError(settla, "NotOpen");
    });

    it("reverts without sufficient allowance and leaves the invoice open", async function () {
      const { settla, token, payer, id } = await loadFixture(withInvoice);
      await token.connect(payer).approve(await settla.getAddress(), usdc("24.999999"));
      await expect(settla.connect(payer).pay(id)).to.be.revertedWith("insufficient allowance");
      expect((await settla.getInvoice(id)).status).to.equal(Status.Open);
    });

    it("reverts without sufficient balance", async function () {
      const { settla, token, other, id } = await loadFixture(withInvoice);
      await token.connect(other).approve(await settla.getAddress(), usdc("25"));
      await expect(settla.connect(other).pay(id)).to.be.revertedWith("insufficient balance");
    });
  });

  describe("cancel", function () {
    it("lets the merchant cancel an open invoice", async function () {
      const { settla, merchant, id } = await loadFixture(withInvoice);
      await expect(settla.connect(merchant).cancel(id)).to.emit(settla, "InvoiceCancelled").withArgs(id);
      expect((await settla.getInvoice(id)).status).to.equal(Status.Cancelled);
    });

    it("reverts for anyone but the merchant", async function () {
      const { settla, other, id } = await loadFixture(withInvoice);
      await expect(settla.connect(other).cancel(id)).to.be.revertedWithCustomError(settla, "NotMerchant");
    });

    it("reverts once the invoice is no longer open", async function () {
      const { settla, token, merchant, payer, id } = await loadFixture(withInvoice);
      await token.connect(payer).approve(await settla.getAddress(), usdc("25"));
      await settla.connect(payer).pay(id);
      await expect(settla.connect(merchant).cancel(id)).to.be.revertedWithCustomError(settla, "NotOpen");
    });

    it("reverts when cancelled twice", async function () {
      const { settla, merchant, id } = await loadFixture(withInvoice);
      await settla.connect(merchant).cancel(id);
      await expect(settla.connect(merchant).cancel(id)).to.be.revertedWithCustomError(settla, "NotOpen");
    });
  });

  describe("invoicesOf", function () {
    it("returns every ID a merchant created, in order", async function () {
      const { settla, merchant, other } = await loadFixture(deploy);
      await settla.connect(merchant).createInvoice(usdc("1"), "a");
      await settla.connect(other).createInvoice(usdc("2"), "b");
      await settla.connect(merchant).createInvoice(usdc("3"), "c");

      expect(await settla.invoicesOf(merchant.address)).to.deep.equal([1n, 3n]);
      expect(await settla.invoicesOf(other.address)).to.deep.equal([2n]);
      expect(await settla.invoicesOf(ethers.ZeroAddress)).to.deep.equal([]);
    });
  });
});
