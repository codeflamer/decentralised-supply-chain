const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
//const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { assert, expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChain", function () {
  async function deploySupplyChain() {
    // Contracts are deployed using the first signer/account by default
    const [producer, distributor] = await ethers.getSigners();

    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    const supplyChain = await SupplyChain.deploy("CodeFlamer");

    return { producer, distributor, supplyChain };
  }

  describe("Deploy Supply Chain", function () {
    it("Should be able to get company name", async function () {
      const { supplyChain } = await loadFixture(deploySupplyChain);
      assert(await supplyChain.companyName(), "codeFlamer");
    });
  });

  describe("Product functionality", function () {
    it("Producer should be able to add product and emit the id and the name", async function () {
      const { supplyChain } = await loadFixture(deploySupplyChain);
      await expect(await supplyChain.addProduct(1, "iphone13"))
        .to.emit(supplyChain, "addedProduct")
        .withArgs(1, "iphone13");
    });
    it("Should be able to get a product, and confirm the exact type of product with the prototype", async function () {
      const { producer, supplyChain } = await loadFixture(deploySupplyChain);
      await supplyChain.addProduct(1, "iphone13");

      const addedProduct = {
        productId: 1,
        productName: "iphone13",
        owners: [producer.address],
        available: true,
      };

      const product = await supplyChain.getProduct(1, "iphone13");
      assert(product, addedProduct);
    });

    it("should be able to get list of previous owners", async function () {
      const { producer, supplyChain } = await loadFixture(deploySupplyChain);
      await supplyChain.addProduct(1, "iphone13");

      const owners = await supplyChain.getProductOwners(1, "iphone13");
      assert(owners, [producer.address]);
    });

    it("Should be able to confirm all ids of a product Category", async function () {
      const { supplyChain } = await loadFixture(deploySupplyChain);
      await supplyChain.addProduct(1, "iphone13");
      await supplyChain.addProduct(2, "iphone13");
      await supplyChain.addProduct(3, "iphone13");
      await supplyChain.addProduct(1, "iphone14");
      await supplyChain.addProduct(2, "iphone14");

      const idsIphone13 = await supplyChain.getIdsProduct("iphone13");
      const idsIphone14 = await supplyChain.getIdsProduct("iphone14");
      assert(idsIphone13, [1, 2, 3]);
      assert(idsIphone14, [1, 2]);
    });
  });
});
