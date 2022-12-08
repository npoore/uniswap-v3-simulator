import { LoadData } from "./LoadData";

async function main() {
    let poolName = "ichi-wnxm_0.3";
    let poolAddress = "0x96467eae14bf1da07b5fedd07b2a4030b8f1481d";  //ichi-usdc
    // It will use RPCProviderUrl in tuner.config.js if this is undefined.
     let RPCProviderUrl: string = 'https://eth-mainnet.g.alchemy.com/v2/svoIdpPueIzalWkGWnzbLo1R_Zb6vm6v';
   // let RPCProviderUrl: string = 'http://ec2-54-167-207-123.compute-1.amazonaws.com:8545/';

   let swaps = 'swaps'+'_'+poolName+'.json';
   let mints = 'mints'+'_'+poolName+'.json';
   let burns = 'burns'+'_'+poolName+'.json';

   let directory = 'data/';
  
  
    let loadData = new LoadData(RPCProviderUrl);
    await loadData.processData(poolName,poolAddress,directory+swaps,directory+mints,directory+burns);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });