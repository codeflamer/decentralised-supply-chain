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

    const addedProduct1 = {
      productId: 1,
      productName: "iphone13",
      owners: [producer.address],
      available: true,
      price: 20,
    };
    //in 10**18

    return { producer, distributor, supplyChain, addedProduct1 };
  }

  describe("Deploy Supply Chain", function () {
    it("Should be able to get company name", async function () {
      const { supplyChain } = await loadFixture(deploySupplyChain);
      assert.equal(await supplyChain.companyName(), "CodeFlamer");
    });
  });

  describe("Product functionality", function () {
    it("Producer should be able to add product and emit the id and the name", async function () {
      const { supplyChain } = await loadFixture(deploySupplyChain);
      await expect(await supplyChain.addProduct(1, "iphone13", 20))
        .to.emit(supplyChain, "addedProduct")
        .withArgs(1, "iphone13");
    });
    it("Should be able to get a product, and confirm the exact type of product with the prototype", async function () {
      const { producer, supplyChain, addedProduct1 } = await loadFixture(
        deploySupplyChain
      );
      await supplyChain.addProduct(
        addedProduct1.productId,
        addedProduct1.productName,
        addedProduct1.price
      );

      const product = await supplyChain.getProduct(1, "iphone13");
      assert.equal(product.productId, addedProduct1.productId);
      assert.equal(product.productName, addedProduct1.productName);
      assert.equal(
        product.price.toString(),
        (addedProduct1.price * 10 ** 18).toString()
      );
    });

    it("should be able to get list of previous owners,and get Product Price", async function () {
      const { producer, supplyChain, addedProduct1 } = await loadFixture(
        deploySupplyChain
      );
      await supplyChain.addProduct(
        addedProduct1.productId,
        addedProduct1.productName,
        addedProduct1.price
      );

      const owners = await supplyChain.getProductOwners(1, "iphone13");
      const productPrice = await supplyChain.getProductPrice(1, "iphone13");
      assert.equal(owners.toString(), [producer.address].toString());
      assert.equal(
        productPrice.toString(),
        (addedProduct1.price * 10 ** 18).toString()
      );
    });

    it("Should be able to confirm all ids of a product Category", async function () {
      const { supplyChain } = await loadFixture(deploySupplyChain);
      await supplyChain.addProduct(1, "iphone13", 20);
      await supplyChain.addProduct(2, "iphone13", 20);
      await supplyChain.addProduct(3, "iphone13", 20);
      await supplyChain.addProduct(1, "iphone14", 20);
      await supplyChain.addProduct(2, "iphone14", 20);

      const idsIphone13 = await supplyChain.getIdsProduct("iphone13");
      const idsIphone14 = await supplyChain.getIdsProduct("iphone14");
      assert.equal(idsIphone13.toString(), [1, 2, 3].toString());
      assert.equal(idsIphone14.toString(), [1, 2].toString());
    });
  });

  describe("Product Ownership", function () {
    it("New owner should be able to buy in bulk", () => {});

    it("Should be able to transfer ownership from one person to another", () => {});

    it("Should revert when the amount paid is not suffient to buy the product", () => {});

    it("After transfer of ownership, should revert when the producer tries to edit the product", () => {});

    it("New owner should be able to edit product details", () => {});

    it("Should revert when the product is anot available for sale", () => {});
  });
});
