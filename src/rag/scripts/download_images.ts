import { LlamaParseReader } from "llamaindex";
import fs from "fs";

// change this accordingly to the file name to parse
const fileName = "63944ENV2";

const inputPath = `./data/parsed`;
const outputPath = `./data/parsed`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jsonObjs: Record<string, any>[] = JSON.parse(
  fs.readFileSync(`${inputPath}/${fileName}.json`, "utf8")
);

const reader = new LlamaParseReader({
  premiumMode: true,
  pageSeparator: "- {pageNumber} -",
  verbose: true,
  takeScreenshot: false, // doesnt seem to work, screenshot of each page still taken and added to json output
});
const imageDicts = await reader.getImages(jsonObjs, "images");

// remove images with duplicate paths (due to the same image having multiple different x,y coordinates on the pdf page as identified by the parser); all the same images have the same path
const imagePaths = new Set<string>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const uniqueImageDicts: Record<string, any>[] = [];
for (const imageDict of imageDicts) {
  if ("path" in imageDict && !imagePaths.has(imageDict.path)) {
    imagePaths.add(imageDict.path);
    uniqueImageDicts.push(imageDict);
  }
}

// filter away full page screenshots, and small images
let deletedCount = 0;
for (let i = 0; i < uniqueImageDicts.length; i++) {
  const imageDict = uniqueImageDicts[i];
  let deleted = false;
  if ("type" in imageDict || imageDict.height < 20 || imageDict.width < 20) {
    try {
      await fs.promises.unlink(imageDict.path);
      deleted = true;
      deletedCount++;
    } catch (err) {
      console.warn(`Error deleting file: ${imageDict.path}`, err);
    }
  }
  imageDict["deleted"] = deleted;
}

// save output to json
fs.writeFileSync(
  `${outputPath}/${fileName}-images.json`,
  JSON.stringify(uniqueImageDicts, null, 2)
);

console.log(
  `Downloaded images from ${fileName} and saved to ${outputPath}/${fileName}-images.json`
);
console.log(
  `Deleted ${deletedCount} images from total ${uniqueImageDicts.length} images. Remaining ${
    uniqueImageDicts.length - deletedCount
  } images.`
);
