import { APIEvent } from "solid-start";
import { readFile, readdir } from "fs/promises";
import { join } from "path";

export async function GET({ params }: APIEvent) {
  const { fileId } = params;
  const uploadDir = join(process.cwd(), "public", "uploads");

  try {
    const files = await readdir(uploadDir);
    const file = files.find(f => f.startsWith(fileId));

    if (!file) {
      return new Response("File not found", { status: 404 });
    }

    const filePath = join(uploadDir, file);
    const fileContent = await readFile(filePath);
    const fileExtension = file.split('.').pop() || '';

    const contentType = getContentType(fileExtension);

    return new Response(fileContent, {
      status: 200,
      headers: { "Content-Type": contentType }
    });
  } catch (error) {
    console.error("File serving error:", error);
    return new Response("Error serving file", { status: 500 });
  }
}

function getContentType(extension: string): string {
  // Add more mime types as needed
  const mimeTypes: { [key: string]: string } = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'flac': 'audio/flac',
    // ... add other mime types
  };
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}
