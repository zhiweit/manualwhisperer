import { APIEvent } from "solid-start";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST({ request }: APIEvent) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File || formData.get("file") as File || formData.get("video") as File;

    if (!file) {
      return new Response(JSON.stringify({ success: false, error: "No file uploaded" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const fileExtension = file.name.split(".").pop();
    const fileId = uuidv4();
    const fileName = `${fileId}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await writeFile(filePath, buffer);

    // Determine the file type
    let fileType = "file";
    if (formData.get("image")) {
      fileType = "image";
    } else if (formData.get("video")) {
      fileType = "video";
    }

    return new Response(JSON.stringify({ 
      success: true, 
      fileId: fileId,
      size: buffer.length,
      name: file.name,
      extension: fileExtension,
      fileType: fileType
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ success: false, error: "Upload failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
