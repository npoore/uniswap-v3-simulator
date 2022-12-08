require('dotenv').config();

import { request, gql } from "graphql-request";
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
chai.use(chaiAsPromised);
import { providers } from "ethers";
import { UniswapV3Pool2__factory as UniswapV3PoolFactory } from "../src/typechain/factories/UniswapV3Pool2__factory";
import { UniswapV3Pool2 as UniswapV3Pool } from "../src/typechain/UniswapV3Pool2";

describe("Check Edge Case Duplication of SWAP logs", () => {
    const APIURL = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3";

    it("compare RPC and SUBGRAPH", async () => {
        const query = gql`
            query {
                pool(id: "0xd35efae4097d005720608eaf37e42a5936c94b44") {
                    swaps(
                        first: 10
                        where: { transaction_:{ blockNumber: 15438277}}
                    ) {
                        sender
                        recipient
                        amount0
                        amount1
                        sqrtPriceX96
                        tick
                        transaction {
                            blockNumber
                            id
                        }
                        logIndex
                        timestamp
                    }
                }
            }
        `;
        
        let data = await request(APIURL, query);
        console.log(data.pool.swaps);

        expect(data.pool.swaps.length == 2, "2 swaps required in same block in same pool means edge case is still present in SUBGRAPH").to.be.true
        
        let RPCProviderUrl = process.env.MAINNET_PROVIDER_URL;
        let RPCProvider: providers.JsonRpcProvider = new providers.JsonRpcProvider(RPCProviderUrl);
        let poolAddress: string = "0xd35efae4097d005720608eaf37e42a5936c94b44";
        let uniswapV3Pool: UniswapV3Pool = UniswapV3PoolFactory.connect(poolAddress, RPCProvider);
        let topic = uniswapV3Pool.filters.Swap();
        let block = 15438277;
        let fromBlock = block;
        let toBlock = block;
        let events = await uniswapV3Pool.queryFilter(topic, fromBlock, toBlock);

        console.log(events);
        expect(events.length == 1, "1 swap event in the same block of the RPC call").to.be.true

        expect(events.length == data.pool.swaps.length, "verify too many events from SUBGRAPH compared to RPC").to.be.false

        

    });
});