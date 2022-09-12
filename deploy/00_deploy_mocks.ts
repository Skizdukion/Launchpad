import { DeployFunction } from "hardhat-deploy/types"
import { getNamedAccounts, deployments, network, ethers } from "hardhat"
import { BigNumber } from "ethers"
import { MockERC20 } from "../typechain"
import { developmentChains } from "../helper-hardhat-config"
import { verify } from "../helper-functions"

const deployFunction: DeployFunction = async () => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId: number | undefined = network.config.chainId
  const accounts = await ethers.getSigners()
  // const value = Math.floor(ethers.constants.MaxUint256 / bigint(10))
  await deploy("USDTMOCK", {
    contract: "MockERC20",
    from: deployer,
    log: true,
    args: ["MockUSDT", "USDT", ethers.constants.MaxUint256],
  })
  const erc20: MockERC20 = await ethers.getContract("USDTMOCK")
  const value = BigInt(1000000 * 10 ** 30) / BigInt(accounts.length)
  for (let index = 0; index < accounts.length; index++) {
    await erc20.transfer(accounts[index].address, BigNumber.from(value.toString()))
  }
}

export default deployFunction
deployFunction.tags = [`all`, `mocks`]
