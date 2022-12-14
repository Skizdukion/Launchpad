/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IWineryNFT, IWineryNFTInterface } from "../IWineryNFT";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "level",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "robiBoost",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "freeze",
        type: "bool",
      },
    ],
    name: "launchpadMint",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenUnfreeze",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class IWineryNFT__factory {
  static readonly abi = _abi;
  static createInterface(): IWineryNFTInterface {
    return new utils.Interface(_abi) as IWineryNFTInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IWineryNFT {
    return new Contract(address, _abi, signerOrProvider) as IWineryNFT;
  }
}
