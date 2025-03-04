// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721Enumerable, Ownable {
    uint256 public mintPrice;
    uint256 public nextTokenId;
    string public _baseTokenURI;

    event Minted(address indexed owner, uint256 indexed tokenId);

    constructor(string memory name, string memory symbol, uint256 _mintPrice)
    ERC721(name, symbol)
    {
        mintPrice = _mintPrice;
        nextTokenId = 1;
    }

    function setBaseURI(string memory baseURI_) external onlyOwner() {
        _baseTokenURI = baseURI_;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function mint()
    external payable
    {
        require(msg.value >= mintPrice, "Insufficient funds to mint NFT");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        _safeMint(msg.sender, tokenId);

        emit Minted(msg.sender, tokenId);
    }

    function getOwnedTokens(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);

        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }

        return tokenIds;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

}