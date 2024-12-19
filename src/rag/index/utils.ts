// import sharp from "sharp";
import fs from "fs";

/**
 * Resize an image to fit within the given dimensions.
 * @param width - The width of the image.
 * @param height - The height of the image.
 * @param maxLongSide - The maximum length of the long side of the image.
 * @param maxShortSide - The maximum length of the short side of the image.
 * @returns The resized width and height (both rounded to the nearest integer).
 */
export async function resizeImage(
  width: number,
  height: number,
  maxLongSide: number,
  maxShortSide: number
): Promise<{ width: number; height: number }> {
  let resizedWidth = width;
  let resizedHeight = height;

  if (height > width) {
    if (height > maxLongSide) {
      resizedWidth = (width * maxLongSide) / height;
      resizedHeight = maxLongSide;
    }
    if (width > maxShortSide) {
      resizedHeight = (height * maxShortSide) / width;
      resizedWidth = maxShortSide;
    }
  } else {
    if (width > maxLongSide) {
      resizedHeight = (height * maxLongSide) / width;
      resizedWidth = maxLongSide;
    }
    if (height > maxShortSide) {
      resizedWidth = (width * maxShortSide) / height;
      resizedHeight = maxShortSide;
    }
  }
  return { width: Math.round(resizedWidth), height: Math.round(resizedHeight) };
}

// export async function resizeImageToOpenAiRequirements(base64: string) {
//   // For high res mode, the short side of the image should be less than 768px and the long side should be less than 2,000px. (OpenAI)
//   const MAX_LONG_SIDE = 2000;
//   const MAX_SHORT_SIDE = 768;

//   try {
//     let resizedBase64 = base64;
//     const buffer = Buffer.from(base64, "base64");
//     const { width, height } = await sharp(buffer).metadata();
//     if (width && height) {
//       const { width: resizedWidth, height: resizedHeight } = await resizeImage(
//         width,
//         height,
//         MAX_LONG_SIDE,
//         MAX_SHORT_SIDE
//       );

//       // update the base64 string if dimensions should be resized
//       if (resizedWidth !== width || resizedHeight !== height) {
//         const resizedBuffer = await sharp(buffer)
//           .resize(resizedWidth, resizedHeight)
//           .toBuffer();
//         resizedBase64 = resizedBuffer.toString("base64");
//       }
//     }
//     return resizedBase64;
//   } catch (error) {
//     console.warn(
//       `Error resizing image to OpenAI requirements, returning original base64. Error: ${error}`
//     );
//     return base64;
//   }
// }

/**
 * Convert a PDF file to a base64 string for each page. Each page is resized to be less than 768px on the short side and 2,000px on the long side (according to OpenAI's image size requirements).
 * @param pdfPath - The path to the PDF file.
 * @param pageNumbers - The page numbers to convert. If not provided, all pages are converted.
 * @returns An array of base64 strings (each representing each page).
 */
// export async function pdfToBase64(
//   pdfPath: string,
//   pageNumbers?: number[]
// ): Promise<string[]> {
//   const pdf2img = await import("pdf-img-convert");

//   try {
//     // Convert PDF to images (base64 string for each page)
//     const output = (await pdf2img.convert(pdfPath, {
//       page_numbers: pageNumbers,
//       base64: true, // if true, returns base64 string, if false, returns image buffer (Uint8Array)
//       scale: 2,
//     })) as string[];

//     return output;
//   } catch (error) {
//     console.error(`Error converting PDF to base64 image: ${error}`);
//     throw error;
//   }
// }

/**
 * Convert image to a base64 string.
 * @param imagePath - The path to the image file.
 * @returns A promise that resolves to the base64 string of the image.
 */
export function imageToBase64(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(imagePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const base64Image = data.toString("base64");
        resolve(base64Image);
      }
    });
  });
}

export function removeFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) return fileName; // No extension found
  return fileName.substring(0, lastDotIndex);
}
