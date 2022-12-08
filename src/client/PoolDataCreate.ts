import { ethers } from "ethers";
import { providers } from "ethers/lib/ethers";
import { loadConfig } from "../config/TunerConfig";
import { UniswapV3Pool2__factory as UniswapV3PoolFactory } from "../typechain/factories/UniswapV3Pool2__factory";
import fs from "fs";
import puppeteer from "puppeteer";

const QUERY_MINT = 'https://dune.com/queries/1424338?pool_t6c1ea=';
const abi = [
    "function name() public view returns (string)",
    "function symbol() public view returns (string)"
];
//const firstBlock = 12369621;

const rootDIR = 'data';

async function main() {
    const poolAddress: string = process.argv[process.argv.length-1];

    
    let tunerConfig = loadConfig(undefined);
    const RPCProviderUrl = tunerConfig.RPCProviderUrl;
    const RPCProvider: providers.JsonRpcProvider = new providers.JsonRpcProvider(RPCProviderUrl);
        
    let uniswapV3Pool = await UniswapV3PoolFactory.connect(poolAddress, RPCProvider);

    const fee = (await uniswapV3Pool.functions.fee())[0];
    const token0 = (await uniswapV3Pool.functions.token0())[0];
    const token1 = (await uniswapV3Pool.functions.token1())[0];

    //const latest_block = (await RPCProvider.getBlock("latest")).number;

    const token0_contract = new ethers.Contract(token0, abi, RPCProvider);
    const token1_contract = new ethers.Contract(token1, abi, RPCProvider);

    const token0_symbol = await token0_contract.symbol();
    const token1_symbol = await token1_contract.symbol();

    let feeString: string = '';

    if (fee == 500) {
        feeString = '0.05';
    } else if (fee == 3000) {
        feeString = '0.3';
    } else if (fee == 10000) {
        feeString = '1.0';
    }

    const poolName = token0_symbol+"-"+token1_symbol+"_"+feeString;
    const path = rootDIR+"/"+poolAddress+"_"+poolName;

    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }

    await duneXtract(QUERY_MINT+poolAddress,path+"/mints.json");

}

async function duneXtract(query: string, file: string ) {
    try {
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        
        page.on('response', async(response) => {
            const isFetch = ['fetch'].includes(response.request().resourceType());
            if (isFetch) {
                if (response.url() === 'https://core-hsr.dune.com/v1/graphql') {
                    let post = JSON.parse(response.request().postData() || '{}');
                    if (post['operationName'] && post['operationName'] === 'FindResultDataByResult') {
                        response.text().then(console.log);

                        // response.text().then(text => {
                        //     // fs.writeFileSync(file,text);
                        //     console.log(file);
                        //     console.log(text);
                        // });
                    }
                }
            }
        });

        await page.goto(query,{ waitUntil: 'networkidle2'});
        await page.waitForNetworkIdle({ idleTime: 5000, timeout:30 * 1000 * 60});
       
        await browser.close();
    } catch(e) {
        console.error(e);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });