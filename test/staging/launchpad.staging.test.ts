// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
// import { assert, expect } from "chai"
// import { BigNumber, Signer } from "ethers"
// import { deployments, ethers, getNamedAccounts, network } from "hardhat"
// import { LaunchpadNFT, MockERC20, NFTDao } from "../../typechain"

// describe("Launchpad unit tests", async function () {
//   let launchpad: LaunchpadNFT, nft: NFTDao, signers: SignerWithAddress[], deployer, erc20: MockERC20

//   beforeEach(async () => {
//     await deployments.fixture(["all"])
//     launchpad = await ethers.getContract("launchpad")
//     deployer = (await getNamedAccounts()).deployer
//     nft = await ethers.getContract("NFT")
//     signers = await ethers.getSigners()
//     erc20 = await ethers.getContract("USDTMOCK")
//     const value = BigInt(1000000 * 10 ** 30) / BigInt(signers.length)
//     for (let index = 0; index < signers.length; index++) {
//       await (
//         await erc20.connect(signers[index])
//       ).approve(launchpad.address, BigNumber.from(value.toString()))
//     }
//   })

//   describe("Buy NFT from launch pad", async function () {
//     it("Buy One NFT", async () => {
//       const contract1 = launchpad.connect(signers[1])
//       const contract2 = launchpad.connect(signers[2])
//       const result = await contract1.callStatic.buyMultipleNFT(0, 1, "")
//       const tx = await contract1.buyMultipleNFT(0, 1, "")
//       //   console.log(result.toString())
//       await tx.wait(1)
//       assert.equal(await nft.ownerOf(result[0]), signers[1].address)
//       await expect(contract1.buyMultipleNFT(0, 1, "")).to.be.revertedWith("limit exceeding")
//       await expect(contract2.buyMultipleNFT(0, 2, "")).to.be.revertedWith("limit exceeding")
//     })

//     // TODO check at correct profit
//     it("Buy Multiple NFT", async () => {
//       await launchpad.setMaxToUser(5)
//       const contract1 = launchpad.connect(signers[1])
//       const contract2 = launchpad.connect(signers[2])
//       const balanceS1Before = await erc20.balanceOf(signers[1].address)
//       const balanceS2Before = await erc20.balanceOf(signers[2].address)
//       const amount = 5
//       const launchPadIndex = 0
//       const result1 = await contract1.callStatic.buyMultipleNFT(launchPadIndex, amount, "")
//       const tx1 = await contract1.buyMultipleNFT(launchPadIndex, amount, "")
//       const result2 = await contract2.callStatic.buyMultipleNFT(launchPadIndex + 1, amount, "")
//       const tx2 = await contract2.buyMultipleNFT(launchPadIndex + 1, amount, "")
//       //   console.log(result.toString())
//       await tx1.wait(1)
//       await tx2.wait(1)
//       for (let index = 0; index < result1.length; index++) {
//         const element = result1[index]
//         assert.equal(await nft.ownerOf(element), signers[1].address)
//       }
//       for (let index = 0; index < result2.length; index++) {
//         const element = result2[index]
//         assert.equal(await nft.ownerOf(element), signers[2].address)
//       }

//       await expect(contract1.buyMultipleNFT(launchPadIndex + 1, amount, "")).to.be.revertedWith(
//         "limit exceeding"
//       )
//       await expect(contract2.buyMultipleNFT(launchPadIndex + 1, amount, "")).to.be.revertedWith(
//         "limit exceeding"
//       )

//       const balanceS1After = await erc20.balanceOf(signers[1].address)
//       const balanceS2After = await erc20.balanceOf(signers[2].address)
//       assert.equal(
//         balanceS1After.toString(),
//         (
//           BigInt(balanceS1Before.toString()) -
//           BigInt((await launchpad.launches(launchPadIndex)).priceInUSD.toString()) * BigInt(amount)
//         ).toString()
//       )
//       assert.equal(
//         balanceS2After.toString(),
//         (
//           BigInt(balanceS2Before.toString()) -
//           BigInt((await launchpad.launches(launchPadIndex + 1)).priceInUSD.toString()) *
//             BigInt(amount)
//         ).toString()
//       )
//     })
//   })

//   describe("Transfer", async function () {
//     let nftOfSigner1: BigNumber[],
//       nftOfSigner2: BigNumber[],
//       contractWithSigner1: LaunchpadNFT,
//       contractWithSigner2: LaunchpadNFT
//     beforeEach(async function () {
//       await launchpad.setMaxToUser(5)
//       contractWithSigner1 = launchpad.connect(signers[1])
//       contractWithSigner2 = launchpad.connect(signers[2])
//       nftOfSigner1 = await contractWithSigner1.callStatic.buyMultipleNFT(0, 5, "")
//       const tx1 = await contractWithSigner1.buyMultipleNFT(0, 5, "")
//       nftOfSigner2 = await contractWithSigner2.callStatic.buyMultipleNFT(0, 5, "")
//       const tx2 = await contractWithSigner2.buyMultipleNFT(0, 5, "")
//       await tx1.wait(1)
//       await tx2.wait(1)
//     })

//     it("Force unfreeze and transfer", async () => {
//       const nft1 = nftOfSigner1[0]
//       const nft2 = nftOfSigner2[0]
//       await expect(
//         (await nft.connect(signers[1])).transferFrom(signers[1].address, signers[2].address, nft1)
//       ).to.be.revertedWith("ERC721: Token frozen")
//       await expect(
//         (await nft.connect(signers[2])).transferFrom(signers[2].address, signers[1].address, nft2)
//       ).to.be.revertedWith("ERC721: Token frozen")

//       await expect(contractWithSigner1.forceUnfreezeNFT(nft1)).to.be.reverted

//       await expect(contractWithSigner1.forceUnfreezeNFT(nft2)).to.be.reverted

//       await launchpad.forceUnfreezeNFT(nft1)
//       await launchpad.forceUnfreezeNFT(nft2)

//       await expect(
//         (await nft.connect(signers[1])).transferFrom(signers[1].address, signers[2].address, nft2)
//       ).to.be.revertedWith("ERC721: caller is not token owner nor approved")

//       await expect(
//         (await nft.connect(signers[2])).transferFrom(signers[2].address, signers[1].address, nft1)
//       ).to.be.revertedWith("ERC721: caller is not token owner nor approved")

//       await (
//         await nft.connect(signers[2])
//       ).transferFrom(signers[2].address, signers[1].address, nft2)
//       assert.equal(await nft.ownerOf(nft2), signers[1].address)

//       await (
//         await nft.connect(signers[1])
//       ).transferFrom(signers[1].address, signers[2].address, nft1)
//       assert.equal(await nft.ownerOf(nft1), signers[2].address)
//     })

//     it("Unfreeze and transfer", async () => {
//       const nft1 = nftOfSigner1[0]
//       const nft2 = nftOfSigner2[0]
//       await expect(
//         (await nft.connect(signers[1])).transferFrom(signers[1].address, signers[2].address, nft1)
//       ).to.be.revertedWith("ERC721: Token frozen")
//       await expect(
//         (await nft.connect(signers[2])).transferFrom(signers[2].address, signers[1].address, nft2)
//       ).to.be.revertedWith("ERC721: Token frozen")

//       await expect(contractWithSigner1.unFreezeNFT(nft1)).to.be.revertedWith("On cool down")

//       await expect(contractWithSigner1.unFreezeNFT(nft2)).to.be.revertedWith("On cool down")

//       const freezeTime = await contractWithSigner1.getNftFrozenTimeLeft(nft1)
//       const freezeTime2 = await contractWithSigner1.getNftFrozenTimeLeft(nft2)

//       //   assert.equal(freezeTime, freezeTime2)
//       console.log(freezeTime.toString() + " " + freezeTime2.toString())

//       await network.provider.send("evm_increaseTime", [Number(freezeTime.toString())])
//       await network.provider.send("evm_mine")

//       await contractWithSigner1.unFreezeNFT(nft1)
//       await contractWithSigner2.unFreezeNFT(nft2)

//       await expect(
//         (await nft.connect(signers[1])).transferFrom(signers[1].address, signers[2].address, nft2)
//       ).to.be.revertedWith("ERC721: caller is not token owner nor approved")

//       await expect(
//         (await nft.connect(signers[2])).transferFrom(signers[2].address, signers[1].address, nft1)
//       ).to.be.revertedWith("ERC721: caller is not token owner nor approved")

//       await (
//         await nft.connect(signers[2])
//       ).transferFrom(signers[2].address, signers[1].address, nft2)
//       assert.equal(await nft.ownerOf(nft2), signers[1].address)

//       await (
//         await nft.connect(signers[1])
//       ).transferFrom(signers[1].address, signers[2].address, nft1)
//       assert.equal(await nft.ownerOf(nft1), signers[2].address)
//     })
//   })

//   describe("Distribute Funds", async () => {
//     let contractWithSigner1: LaunchpadNFT,
//       contractWithSigner2: LaunchpadNFT,
//       profitPercentage: bigint,
//       loyaltyPercentage: bigint
//     const amount = 5
//     const launchPadIndex = 0
//     beforeEach(async function () {
//       profitPercentage = BigInt(70)
//       loyaltyPercentage = BigInt(50)
//       await launchpad.setMaxToUser(5)
//       await launchpad.setProfitAddress(signers[3].address)
//       await launchpad.setTreasuryAddress(signers[6].address)
//       await launchpad.setLoyaltyAddress(launchPadIndex, signers[4].address)
//       await launchpad.setLoyaltyAddress(launchPadIndex + 1, signers[5].address)
//     })

//     it("Checking Treasury, Profit and Loyalty address", async () => {
//       contractWithSigner1 = launchpad.connect(signers[1])
//       contractWithSigner2 = launchpad.connect(signers[2])

//       const signer3BalanceBefore = BigInt((await erc20.balanceOf(signers[3].address)).toString())
//       const signer4BalanceBefore = BigInt((await erc20.balanceOf(signers[4].address)).toString())
//       const signer5BalanceBefore = BigInt((await erc20.balanceOf(signers[5].address)).toString())
//       const signer6BalanceBefore = BigInt((await erc20.balanceOf(signers[6].address)).toString())

//       const tx1 = await contractWithSigner1.buyMultipleNFT(launchPadIndex, amount, "")
//       const tx2 = await contractWithSigner2.buyMultipleNFT(launchPadIndex + 1, amount, "")

//       await tx1.wait(1)
//       await tx2.wait(1)

//       const totalTx1 =
//         BigInt((await launchpad.launches(launchPadIndex)).priceInUSD.toString()) * BigInt(amount)
//       const totalTx2 =
//         BigInt((await launchpad.launches(launchPadIndex + 1)).priceInUSD.toString()) *
//         BigInt(amount)

//       const profitAmount =
//         (totalTx1 * BigInt(profitPercentage)) / BigInt(1000) +
//         (totalTx2 * BigInt(profitPercentage)) / BigInt(1000)
//       const loyalty1 = (totalTx1 * BigInt(loyaltyPercentage)) / BigInt(1000)
//       const loyalty2 = (totalTx2 * BigInt(loyaltyPercentage)) / BigInt(1000)

//       const treasuryAmount = totalTx1 + totalTx2 - profitAmount - loyalty1 - loyalty2

//       assert.equal(
//         (profitAmount + signer3BalanceBefore).toString(),
//         (await erc20.balanceOf(signers[3].address)).toString()
//       )
//       assert.equal(
//         (loyalty1 + signer4BalanceBefore).toString(),
//         (await erc20.balanceOf(signers[4].address)).toString()
//       )
//       assert.equal(
//         (loyalty2 + signer5BalanceBefore).toString(),
//         (await erc20.balanceOf(signers[5].address)).toString()
//       )
//       assert.equal(
//         (treasuryAmount + signer6BalanceBefore).toString(),
//         (await erc20.balanceOf(signers[6].address)).toString()
//       )
//     })
//   })
// })
