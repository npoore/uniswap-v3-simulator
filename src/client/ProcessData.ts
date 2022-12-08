import { BlockDBManager } from "../manager/BlockDBManager";

async function main() {
    let blocksDB = await BlockDBManager.buildInstance('blocks.db');

    let block = await blocksDB.getBlockByNumber(15726355);

   
    console.log(new Date(block.timestamp * 1000));

}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});