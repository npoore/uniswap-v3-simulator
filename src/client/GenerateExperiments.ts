


async function main() {
    const RUN_EXEC = './node_modules/.bin/ts-node src/client/GetEvents.ts '
   

    const startBlock: number = 12370624;
    const increment: number = 10000;
    const endBlock: number = startBlock + (increment *10);//15719983;


    for (let block = startBlock; block <= endBlock; block += increment+1) {
        for(let type = 1; type <= 3; type += 1) {
            console.log(RUN_EXEC+type+" "+block+" "+(block+increment));
        }
        //console.log(RUN_EXEC+block+" "+(block+increment));
    } 
}


main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});