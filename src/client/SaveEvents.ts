import { UniswapV3Pool2__factory as UniswapV3PoolFactory } from "../typechain/factories/UniswapV3Pool2__factory";
import { providers } from "ethers";


async function main() {
    const poolAddress = '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8';
    // const RPCProviderUrl: string = 'https://eth-mainnet.g.alchemy.com/v2/svoIdpPueIzalWkGWnzbLo1R_Zb6vm6v';
    const RPCProviderUrl: string = 'http://ec2-54-167-207-123.compute-1.amazonaws.com:8545/';

    let RPCProvider: providers.JsonRpcProvider = new providers.JsonRpcProvider(RPCProviderUrl);
    let uniswapV3Pool = UniswapV3PoolFactory.connect(poolAddress, RPCProvider);
    let topic = uniswapV3Pool.filters.Swap();
     let events = await uniswapV3Pool.queryFilter(topic, 15718078, 15718478);
    //let events = await uniswapV3Pool.queryFilter(topic, 12370624, 12391624);
    console.log(events.length);
    // for (let event of events) {
    //   console.log(event);
    // }
    let event = await uniswapV3Pool.queryFilter(uniswapV3Pool.filters.Initialize(),12370623);
    console.log(event);
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});