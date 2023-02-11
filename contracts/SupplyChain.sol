// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
 import "hardhat/console.sol";

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
    event productPurchased(uint productId,string ProductName);
    event bulkPurchased(uint[] productIds,string productName);

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
        require(getProductPresentOwner(_productName,_productId) != msg.sender,"You already own this product");
        Product storage product = products[_productName][_productId];
        require(product.available,"Product not available for sale");
        require(msg.value >= product.price,"Insufficient amount");
        address  currentOwner = getProductOwners(_productId,_productName)[product.owners.length-1];
        (bool success,) = currentOwner.call{value:product.price}("");
        require(success,"Unable to process the payment");
        product.owners.push(msg.sender);
        emit productPurchased(_productId,_productName);
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

    //ability to buy in bulk
    function buyBulkProduct(string memory _productName,uint[] memory _productids) payable public {
        uint costProducts = 0;
        for(uint i = 0;i < _productids.length;i++){
            costProducts += getProduct(_productids[i],_productName).price;
        }
        require(msg.value >= costProducts,"Not enough Money to buy these products in bulk");
          for(uint i = 0;i < _productids.length;i++){
            buyProduct(_productName,_productids[i]);
        }
        emit bulkPurchased(_productids,_productName);
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

    //write Test
    function getProductPresentOwner(string memory _productName,uint _productId) view public returns(address ){
         Product memory product = products[_productName][_productId];
         return getProductOwners(_productId,_productName)[product.owners.length-1];
    }

    function getAllProductIdsForAnAddress(address _ownerAddress,string memory _productName) view public returns(uint[] memory){
        uint[] storage ids =  idsProduct[_productName];
        uint[] memory IdsOwner = new uint[](ids.length);
        uint counter = 0;
        for(uint i = 0; i < ids.length;i++){
            if(getProductPresentOwner(_productName,ids[i]) == _ownerAddress){
                IdsOwner[counter] = ids[i];
                counter++;
            }
        }
        uint[] memory trimmedResult = new uint[](counter);
        for (uint j = 0; j < trimmedResult.length; j++) {
            trimmedResult[j] = IdsOwner[j];
        }
        return trimmedResult;
    }

    function getAvailableProductIdsForAnAddress(address _ownerAddress,string memory _productName) view public returns(uint[] memory){
        uint[] storage ids =  idsProduct[_productName];
        uint[] memory IdsOwner = new uint[](ids.length);
        uint counter = 0;
        for(uint i = 0; i < ids.length;i++){
            if((getProductPresentOwner(_productName,ids[i]) == _ownerAddress) && (products[_productName][ids[i]].available == true)){
                IdsOwner[counter] = ids[i];
                counter++;
            }
        }
        uint[] memory trimmedResult = new uint[](counter);
        for (uint j = 0; j < trimmedResult.length; j++) {
            trimmedResult[j] = IdsOwner[j];
        }
        return trimmedResult;
    }


}
