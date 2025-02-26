
import cloudinary from "cloudinary";
import { Readable } from "stream";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (file: Express.Multer.File) => {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now(); // Get current time in milliseconds
    const uniqueFilename = `${timestamp}_${file.originalname.replace(/\s+/g, "_")}`; // Replace spaces

    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: "reports",
        public_id: uniqueFilename, // Set unique file name
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const readableStream = Readable.from(file.buffer);
    readableStream.pipe(uploadStream);
  });
};














export interface MulterRequest extends Request {
    files?: {
      [fieldname: string]: Express.Multer.File[];
    } | Express.Multer.File[];
  }
  
//the function will return true if files is an object where each key is a string and each value is an array of Express.Multer.File.
export const isMulterFileArrayDictionary = (files: MulterRequest['files']) : files is {[fieldname: string]: Express.Multer.File[] } => {
    return files !== undefined && !Array.isArray(files);
  };
  
