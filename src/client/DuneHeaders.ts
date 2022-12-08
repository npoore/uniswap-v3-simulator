import puppeteer from 'puppeteer';

async function main() {

    try {
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();

        await getApiCallHeaders(page);
        await browser.close();

    } catch(e) {
        console.error(e);
    }

}

async function getApiCallHeaders(page: puppeteer.Page) {
    return new Promise(async (resolve, reject) => {
      let resolved = false;
      try {
        const devtools = await page.target().createCDPSession();
        await devtools.send('Network.enable');
        await devtools.send('Network.setRequestInterception', {
          patterns: [{ urlPattern: '*' }],
        });
        devtools.on('Network.requestIntercepted', async (event) => {
        //   if (resolved) {
        //     return; // just stop any other request once we get the headers; I only want the headers
        //   }
          if (event.request.url === 'https://core-hsr.dune.com/v1/graphql') { // < wait for a request matching `/me$`, extract its headers
          let post = JSON.parse(event.request.postData || '{}');
          if (post['operationName'] && post['operationName'] === 'FindResultDataByResult') {

          resolved = true;
            resolve(event.request.headers);
            console.log(event.request.headers);
            return; // just stop any other request once we get the headers; I only want the headers
          }
        }
          await devtools.send('Network.continueInterceptedRequest', {
            interceptionId: event.interceptionId,
          });
        });
        await page.goto('https://dune.com/queries/1424338?pool_t6c1ea=0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8',{ waitUntil: 'networkidle2'});// < go to page that loads an app that triggers an API call
      } catch (error) {
        if (!resolved) { // only throw if we didn't resolve earlier; sometimes errors are thrown after being resolved. I don't care about them.
          resolved = true;
          reject(error);
        }
      }
    });
  }

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});