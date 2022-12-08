import { UniswapV3Pool2__factory as UniswapV3PoolFactory } from "../typechain/factories/UniswapV3Pool2__factory";
import { providers } from "ethers";
import { EventType } from "../enum/EventType";
import fs from "fs";


async function main() {
    const poolAddress = '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8';
    // const RPCProviderUrl: string = 'https://eth-mainnet.g.alchemy.com/v2/svoIdpPueIzalWkGWnzbLo1R_Zb6vm6v';
    const RPCProviderUrl: string = 'http://ec2-54-167-207-123.compute-1.amazonaws.com:8545/';

    const eventType: EventType = Number(process.argv[process.argv.length-3]);
    const startBlock: number = Number(process.argv[process.argv.length-2]);
    const endBlock: number = Number(process.argv[process.argv.length-1]);



    let RPCProvider: providers.JsonRpcProvider = new providers.JsonRpcProvider(RPCProviderUrl);
    let uniswapV3Pool = UniswapV3PoolFactory.connect(poolAddress, RPCProvider);
    let topic = uniswapV3Pool.filters.Swap();
    let etype: string = "swap";
    if (eventType == EventType.BURN) {
      topic = uniswapV3Pool.filters.Burn();
      etype = "burn";
    } else if(eventType == EventType.MINT) {
      topic = uniswapV3Pool.filters.Mint();
      etype = "mint";
    }
     //let events = await uniswapV3Pool.queryFilter(topic, 15718078, 15718478);
    //let events = await uniswapV3Pool.queryFilter(topic, 12370624, 12391624);
    const start = Date.now();

    let events = await uniswapV3Pool.queryFilter(topic, startBlock, endBlock);
    const end = Date.now();

    // let output: string = JSON.stringify(events);
    //console.log(output)
    
    console.log("time: "+(end - start)/1000+" # of events: "+events.length);
    
    fs.writeFileSync ("data/"+startBlock+"_"+endBlock+"_"+etype+".json", JSON.stringify(events));
    //console.log(JSON.stringify(events));
   // console.log(events.length);
    // for (let event of events) {
    //   console.log(event);
    // }
    // let event = await uniswapV3Pool.queryFilter(uniswapV3Pool.filters.Initialize(),12370623);
    // console.log(event);
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});