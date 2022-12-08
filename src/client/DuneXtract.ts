import puppeteer from 'puppeteer';

async function main() {
    try {
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();

        await page.setRequestInterception(true);
        page.on('request', request => {
            if (request.resourceType() === 'fetch') {
                if (request.url() === 'https://core-hsr.dune.com/v1/graphql') {
                    let post = JSON.parse(request.postData() || '{}');
                    if (post['operationName'] && post['operationName'] === 'FindResultDataByResult') {
                        console.log(request.headers()['authorization']);
                        console.log(request.postData());
                    }
                }
            } 
            request.continue();
            
        });
        
        // page.on('response', async(response) => {
        //     const isFetch = ['fetch'].includes(response.request().resourceType());
        //     if (isFetch) {
        //         if (response.url() === 'https://core-hsr.dune.com/v1/graphql') {
        //             let post = JSON.parse(response.request().postData() || '{}');
        //             if (post['operationName'] && post['operationName'] === 'FindResultDataByResult') {
        //                 //response.text().then(console.log);
        //                 console.log(response.request().postData());
        //             }

        //         }
        //     }
        // });

       // https://dune.com/queries/1424338?pool_t6c1ea=0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8
        await page.goto('https://dune.com/queries/1424338?pool_t6c1ea=0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8',{ waitUntil: 'networkidle2'});
       // await page.goto('https://dune.com/queries/1424338',{ waitUntil: 'networkidle2'});
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