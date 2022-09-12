import { DeployFunction } from "hardhat-deploy/types"
import { getNamedAccounts, deployments, network, ethers } from "hardhat"
import { LaunchpadNFT, MockERC20, NFTDao } from "../typechain"
import { verify } from "../helper-functions"
import { developmentChains } from "../helper-hardhat-config"

const deployFunction: DeployFunction = async () => {
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  await deploy("launchpad", {
    contract: "LaunchpadNFT",
    from: deployer,
    log: true,
  })

  const nft: NFTDao = await ethers.getContract("NFT")
  const launchpad: LaunchpadNFT = await ethers.getContract("launchpad")
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verify(nft.address, [])
  }
  await launchpad.initialize(nft.address)
  const adminActionRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ACTION_ROLE"))
  const tokenFreezerRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TOKEN_FREEZER"))
  const launchPadminterRole = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("LAUNCHPAD_TOKEN_MINTER")
  )
  const erc20: MockERC20 = await ethers.getContract("USDTMOCK")
  await launchpad.setUSDT(erc20.address)
  await launchpad.grantRole(adminActionRole, deployer)
  await nft.grantRole(tokenFreezerRole, launchpad.address)
  await nft.grantRole(launchPadminterRole, launchpad.address)
  await launchpad.setFreezingTime(3600)
}

export default deployFunction
deployFunction.tags = [`all`, `launchpad`, `main`, `testnet`]
