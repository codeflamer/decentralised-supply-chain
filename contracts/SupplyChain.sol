// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract SupplyChain {
    //variables
    string public companyName;

    //data Structures
    struct Product{
        uint productId;
        string productName;
        address[] owners;
        bool available;
        uint price;
    }

    //mappings
    mapping(string => mapping(uint => Product)) products;
    mapping(string => uint[]) idsProduct;

    //events
    event addedProduct(uint productId,string ProductName);
    event productAvailability(bool status);
    event updatedPrice(uint productId,string ProductName,uint price);

    constructor(string memory _companyName){
        companyName = _companyName;
    }

    function addProduct(uint _productId,string memory _productName,uint _price) public {
        Product storage product  = products[_productName][_productId];
        product.productId = _productId;
        product.productName = _productName;
        product.available = true;
        product.owners.push(msg.sender);
        product.price = _price*1e18;
        idsProduct[_productName].push(_productId);
        emit addedProduct(_productId,_productName);
    }

    function buyProduct(string memory _productName, uint _productId) payable public {
        Product storage product = products[_productName][_productId];
        require(product.available,"Product not available for sale");
        require(msg.value >= product.price,"Insufficient amount");
        address  currentOwner = getProductOwners(_productId,_productName)[product.owners.length-1];
        (bool success,) = currentOwner.call{value:product.price}("");
        require(success,"Unable to process the payment");
        product.owners.push(msg.sender);
    }

    function changeAvailability(string memory _productName,uint _productId,bool _status) payable public {
        Product storage product = products[_productName][_productId];
        require(getProductOwners(_productId,_productName)[product.owners.length-1] == msg.sender,"You are not the owner of this product");
        product.available = _status;
        emit productAvailability(_status);
    }

    function changePrice(string memory _productName,uint _productId,uint _price) payable public {
        Product storage product = products[_productName][_productId];
        require(getProductOwners(_productId,_productName)[product.owners.length-1] == msg.sender,"You are not the owner of this product");
        product.price = _price*1e18;
        emit updatedPrice(_productId,_productName,_price);
    }

    function buyBulkProduct(string memory _productName,uint[] memory _productids) public {

    }


    //getter funtions
    function getProduct(uint _productId,string memory _productName) public view returns(Product memory){
        return products[_productName][_productId];
    }
    function getProductOwners(uint _productId,string memory _productName)public view returns(address[] memory){
        return getProduct(_productId, _productName).owners;
    }

    function getIdsProduct(string memory _productName) public view returns(uint[] memory){
        return idsProduct[_productName];
    }

    function getProductPrice(uint _productId,string memory _productName) public view returns(uint){
        return products[_productName][_productId].price;
    }


}
