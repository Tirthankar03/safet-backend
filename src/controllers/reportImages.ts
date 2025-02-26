
// import { Request, Response } from "express";
// import bcrypt from 'bcryptjs';
// import { db } from "../db";
// import { users } from "../db/schemas/users";
// import jwt from 'jsonwebtoken';
// import { eq, sql } from "drizzle-orm";
// import { generateUniqueId } from "../lib/utils";
// import { parseFormData } from "../lib/parser";
// import { isMulterFileArrayDictionary } from "../lib/upload";




// export const addImage = async (req: Request, res: Response) => {
//     try {

//       console.log("req.files>>>", req.files)
//     // Handle file upload
//     if (isMulterFileArrayDictionary(req.files)) {
//       const img: Express.Multer.File | undefined = req.files["img"]
//         ? req.files["img"][0]
//         : undefined;

//     if(!img){
//       res.status(401).json({ success: false, message: "Image not uploaded" });
//     }

//     //make a post request with loading img in a formData to fastAPI backend 





//   }
//      } catch (e) {
//         console.log("Error in loginUser>>>", e);
//         res.status(500).json({ success: false, message: "An unexpected error occurred" });
//       }
// }

import { Request, response, Response } from "express";
import { db } from "../db";
import { reportImages } from "../db/schemas/reportImages";
import { generateUniqueId } from "../lib/utils";
import { isMulterFileArrayDictionary, uploadToCloudinary } from "../lib/upload";
import FormData from "form-data";
import axios from "axios";
// import { uploadToCloudinary } from "../lib/cloudinary"; // Assuming Cloudinary upload function

export const addImage = async (req: Request, res: Response) => {
  try {

    console.log("req.files<<<<<", req.files)
    if (!isMulterFileArrayDictionary(req.files)) {
      res.status(400).json({ success: false, message: "Invalid file upload" });
      return;
    }

    const img: Express.Multer.File | undefined = req.files["img"]
      ? req.files["img"][0]
      : undefined;

    if (!img) {
      res.status(400).json({ success: false, message: "Image not uploaded" });
      return;
    }

    const reportId = req.body.report_id;
    if (!reportId) {
      res.status(400).json({ success: false, message: "Report ID is required" });
      return;
      }

    // Upload image to Cloudinary
    const cloudinaryResponse:any = await uploadToCloudinary(img);
    if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
      res.status(500).json({ success: false, message: "Failed to upload image" });
      return;
    }
    const imageUrl = cloudinaryResponse.secure_url;

   



    // Send image to FastAPI for face embedding
    const formData = new FormData();
    formData.append("img", img.buffer, img.originalname);


    let hasFace = false;
    let embedding: number[] | null = null;


    try {
      const response = await axios.post("http://localhost:8000/api/face/embedding", formData, {
        headers: { ...formData.getHeaders() },
      });

      if (response.data.vector && Array.isArray(response.data.vector) && response.data.vector.length === 128) {
        hasFace = true;
        embedding = response.data.vector;
      }

    } catch (error :any) {
      console.error("Face recognition error:", error.response?.data || error.message);
      res.status(500).json({ success: false, message: "An unexpected error occurred" });
      return;
      }


    // Insert into DB
    const id = generateUniqueId();
    const data = await db.insert(reportImages).values({
      id,
      report_id: reportId,
      name: img.originalname,
      imageUrl,
      encoding: embedding,
      hasFace,
    }).returning();

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data
    });



  } catch (error) {
    console.error("Error in addImage:", error);
     res.status(500).json({ success: false, message: "An unexpected error occurred" });
    }
};
