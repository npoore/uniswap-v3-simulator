// import {
//   EndBlockTypeWhenInit,
//   MainnetDataDownloader,
//   EventDataSourceType,
// } from "@bella-defintech/uniswap-v3-simulator";

import { EndBlockTypeWhenInit } from "../entity/EndBlockType";
import { EventDataSourceType } from "../enum/EventDataSourceType";
import { MainnetDataDownloader } from "./MainnetDataDownloader";

async function main() {
  let poolName = "events";
  let poolAddress = "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8";
  let endBlock: EndBlockTypeWhenInit = 12406202; //"afterInitialization";
  // It will use RPCProviderUrl in tuner.config.js if this is undefined.
   let RPCProviderUrl: string = 'https://eth-mainnet.g.alchemy.com/v2/svoIdpPueIzalWkGWnzbLo1R_Zb6vm6v';
  //let RPCProviderUrl: string = 'http://ec2-54-167-207-123.compute-1.amazonaws.com:8545/';

  let eventDataSourceType: EventDataSourceType = EventDataSourceType.RPC;

  let mainnetDataDownloader = new MainnetDataDownloader(RPCProviderUrl, eventDataSourceType);
  await mainnetDataDownloader.download(poolName, poolAddress, endBlock);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
