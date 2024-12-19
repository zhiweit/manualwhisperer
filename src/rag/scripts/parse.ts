import { LlamaParseReader, Settings } from "llamaindex";
import fs from "fs";
import { settings } from "~/rag/base";
import { removeFileExtension } from "../index/utils";

Settings.embedModel = settings.embedModel;
Settings.llm = settings.llm;

const reader = new LlamaParseReader({
  premiumMode: false, // set to true if you want to use the premium version of the parser (costs money)
  pageSeparator: "- {pageNumber} -",
  verbose: true,
  takeScreenshot: false,
  skipDiagonalText: true,
});

// change this accordingly to the file name to parse
const fileName = "63942EN.pdf"; // "FANUC31i-ProgManual";

const inputPath = `./data/manuals`;
const jsonObjs = await reader.loadJson(`${inputPath}/${fileName}`);

// every page number should be same as index in the array (to fix any problems with the page number while parsing)
const pages = jsonObjs[0]["pages"];
for (let i = 0; i < pages.length; i++) {
  const page = pages[i];
  page.page = i + 1;
}

const outputPath = `./data/parsed`;
const outputFileName = `${removeFileExtension(fileName)}.json`;
// save output to json
fs.writeFileSync(
  `${outputPath}/${outputFileName}`,
  JSON.stringify(jsonObjs, null, 2)
);

console.log(`Parsed ${fileName} and saved to ${outputPath}/${outputFileName}`);
