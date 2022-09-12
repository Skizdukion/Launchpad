import { DeployFunction } from "hardhat-deploy/types"
import { getNamedAccounts, deployments, network, ethers } from "hardhat"
import { NFTDao } from "../typechain"
import { verify } from "../helper-functions"
import { developmentChains } from "../helper-hardhat-config"

const deployFunction: DeployFunction = async () => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId: number | undefined = network.config.chainId

  await deploy("NFT", {
    contract: "NFTDao",
    from: deployer,
    log: true,
  })

  const nft: NFTDao = await ethers.getContract("NFT")

  // await deploy("NFT2", {
  //   contract: "NFTDao",
  //   from: deployer,
  //   log: true,
  // })

  // const nft2: NFTDao = await ethers.getContract("NFT2")
  // await verify(nft.address, [])
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verify(nft.address, [])
  }
  await nft.initialize("", "0", "200000")
  // await nft2.initialize("", "0", "200000")
}

export default deployFunction
deployFunction.tags = [`all`, `nft`, `main`, `testnet`]
