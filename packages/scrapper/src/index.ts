import axios from "axios";
import cheerio from "cheerio";
import { AuthController } from "./controllers";

// async function scrapeManagerZone(): Promise<string[]> {
//   const response = await axios.get(process.env.SCRAPPER_BASE_URL as string);
//   const $ = cheerio.load(response.data);
//   const urls: string[] = [];

//   // Your scraping logic here to extract URLs

//   return urls;
// }

function init() {
  console.log("Scrapper: It works!");
  const authController = new AuthController();

  // scrapeManagerZone()
  //   .then((urls) => console.log(urls))
  //   .catch((error) => console.error(error));
}

init();
