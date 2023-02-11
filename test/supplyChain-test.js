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
    const [producer, buyer, distributor] = await ethers.getSigners();

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

    return { producer, distributor, supplyChain, addedProduct1, buyer };
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

    it("Be able Edit Products Availability", async () => {
      const { supplyChain, addedProduct1 } = await loadFixture(
        deploySupplyChain
      );
      await supplyChain.addProduct(
        addedProduct1.productId,
        addedProduct1.productName,
        addedProduct1.price
      );

      const tx = await supplyChain.changeAvailability(
        addedProduct1.productName,
        addedProduct1.productId,
        false
      );

      const product = await supplyChain.getProduct(
        addedProduct1.productId,
        addedProduct1.productName
      );
      assert.equal(product.available, false);
      await expect(
        supplyChain.changeAvailability(
          addedProduct1.productName,
          addedProduct1.productId,
          false
        )
      )
        .to.emit(supplyChain, "productAvailability")
        .withArgs(false);
    });

    it("Should revert if not the owner user is trys to edit an item", async () => {
      const { supplyChain, addedProduct1, buyer } = await loadFixture(
        deploySupplyChain
      );
      await supplyChain.addProduct(
        addedProduct1.productId,
        addedProduct1.productName,
        addedProduct1.price
      );

      await expect(
        supplyChain
          .connect(buyer)
          .changeAvailability(
            addedProduct1.productName,
            addedProduct1.productId,
            false
          )
      ).to.be.rejectedWith("You are not the owner of this product");
    });

    it("Should be able to update Price of product and emit an event", async () => {
      const { supplyChain, buyer, addedProduct1 } = await loadFixture(
        deploySupplyChain
      );
      await supplyChain.addProduct(
        addedProduct1.productId,
        addedProduct1.productName,
        addedProduct1.price
      );
      await expect(
        supplyChain.changePrice(
          addedProduct1.productName,
          addedProduct1.productId,
          40
        )
      )
        .to.emit(supplyChain, "updatedPrice")
        .withArgs(addedProduct1.productId, addedProduct1.productName, 40);

      await supplyChain.changePrice(
        addedProduct1.productName,
        addedProduct1.productId,
        40
      );
      const product = await supplyChain.getProduct(
        addedProduct1.productId,
        addedProduct1.productName
      );
      assert.equal(
        product.price.toString(),
        ethers.utils.parseEther("40").toString()
      );
    });

    it("Should revert if product to be updated doesnt belong to the caller of this function", async () => {
      const { supplyChain, buyer, addedProduct1 } = await loadFixture(
        deploySupplyChain
      );
      await supplyChain.addProduct(
        addedProduct1.productId,
        addedProduct1.productName,
        addedProduct1.price
      );

      await expect(
        supplyChain
          .connect(buyer)
          .changePrice(addedProduct1.productName, addedProduct1.productId, 40)
      ).to.be.revertedWith("You are not the owner of this product");
    });
  });

  describe("Buying of product", function () {
    it("Should be able to buy a product and the product should belong to the new owner, and should be added to list of owners", async () => {
      const { supplyChain, producer, buyer } = await loadFixture(
        deploySupplyChain
      );

      //connect new user to buy
      const balancePrevOwnerBefore = await producer.getBalance();

      const txBuy = await supplyChain.connect(buyer).buyProduct("iphone13", 1, {
        value: ethers.utils.parseEther("20.0"),
      });

      const txReceipt = await txBuy.wait();
      // const ethUsedTransaction = txReceipt.gasUsed.mul(
      //   txReceipt.effectiveGasPrice
      // );

      //get the correct updated list  of products
      const owners = await supplyChain.getProductOwners(1, "iphone13");
      assert.equal(
        owners.toString(),
        [producer.address, buyer.address].toString()
      );

      const balancePrevOwnerAfter = await producer.getBalance();

      assert.equal(
        balancePrevOwnerAfter.sub(balancePrevOwnerBefore).toString(),
        ethers.utils.parseEther("20.0")
      );
    });

    it("Should revert when the amount paid is not suffient to buy the product", async () => {
      const { supplyChain, buyer } = await loadFixture(deploySupplyChain);
      //create new product
      await supplyChain.addProduct(1, "iphone13", 20);
      await expect(
        supplyChain.connect(buyer).buyProduct("iphone13", 1, {
          value: ethers.utils.parseEther("10.0"),
        })
      ).to.be.revertedWith("Insufficient amount");
    });

    it("Should fail if the product is not available for sale", async () => {
      const { supplyChain, buyer, addedProduct1 } = await loadFixture(
        deploySupplyChain
      );
      //create new product
      await supplyChain.addProduct(
        addedProduct1.productId,
        addedProduct1.productName,
        addedProduct1.price
      );
      await supplyChain.changeAvailability(
        addedProduct1.productName,
        addedProduct1.productId,
        false
      );
      await expect(
        supplyChain
          .connect(buyer)
          .buyProduct(addedProduct1.productName, addedProduct1.productId, {
            value: ethers.utils.parseEther("20.0"),
          })
      ).to.be.revertedWith("Product not available for sale");
    });

    it.only("After transfer of ownership, should revert when the producer tries to edit the product", async () => {
      const { supplyChain, buyer } = await loadFixture(deploySupplyChain);

      await supplyChain.addProduct(1, "iphone13", 20);

      await supplyChain.connect(buyer).buyProduct("iphone13", 1, {
        value: ethers.utils.parseEther("20.0"),
      });

      await expect(
        supplyChain.changePrice("iphone13", 1, 40)
      ).to.be.revertedWith("You are not the owner of this product");

      await expect(
        supplyChain.changeAvailability("iphone13", 1, false)
      ).to.be.revertedWith("You are not the owner of this product");
    });

    // it("buyer should be able to buy in bulk", () => {});

    // it("New owner should be able to edit product details", () => {});
  });
});
