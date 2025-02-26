import { Request, Response } from "express";
import { db } from "../db/index.js";
import { reportImages } from "../db/schemas/reportImages.js";
import { generateUniqueId } from "../lib/utils.js";
import { deleteFromCloudinary, isMulterFileArrayDictionary, updateCloudinaryImage, uploadToCloudinary } from "../lib/upload.js";
import FormData from "form-data";
import axios from "axios";
import { cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { reports } from "../db/schemas/reports.js";

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



export const updateImage = async (req: Request, res: Response) => {
  try {
    const { reportImageId } = req.params;

    if (!isMulterFileArrayDictionary(req.files)) {
       res.status(400).json({ success: false, message: "Invalid file upload" });
       return
      }

    const img = req.files["img"]?.[0];
    if (!img) {
      res.status(400).json({ success: false, message: "Image not uploaded" });
      return
    }

    // Fetch the existing image record
    const [existingImage] = await db
    .select()
    .from(reportImages)
    .where(eq(reportImages.id, reportImageId))
    .limit(1);

    if (!existingImage) {
      res.status(404).json({ success: false, message: "Image not found" });
      return
    }

    // Update image in Cloudinary
    const newImageUrl = await updateCloudinaryImage(existingImage.imageUrl, img);

    // Send image to FastAPI for new face embedding
    const formData = new FormData();
    formData.append("img", img.buffer, img.originalname);

    let hasFace = false;
    let embedding: number[] | null = null;

    try {
      const response = await axios.post("http://localhost:8000/api/face/embedding", formData, {
        headers: { ...formData.getHeaders() },
      });

      if (response.data.vector?.length === 128) {
        hasFace = true;
        embedding = response.data.vector;
      }
    } catch (error: any) {
      console.error("Face recognition error:", error.response?.data || error.message);
      res.status(500).json({ success: false, message: "An unexpected error occurred" });
      return
    }


    // Update image record in DB
    const updatedData = await db.update(reportImages)
      .set({
        // report_id: reportId,
        name: img.originalname,
        imageUrl: newImageUrl,
        encoding: embedding,
        hasFace,
      })
      .where(eq(reportImages.id, reportImageId))
      .returning();

    res.status(200).json({
      success: true,
      message: "Image updated successfully",
      data: updatedData,
    });

  } catch (error) {
    console.error("Error in updateImage:", error);
    res.status(500).json({ success: false, message: "An unexpected error occurred" });
  }
};




export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { reportImageId } = req.params;

    // Fetch the existing image record
    // const existingImage = await db.query.reportImages.findFirst({ where: { id } });
    const [existingImage] = await db.select().from(reportImages).where(eq(reportImages.id, reportImageId));
    if (!existingImage) {
      res.status(404).json({ success: false, message: "Image not found" });
      return
      }

    // Delete from Cloudinary
    await deleteFromCloudinary(existingImage.imageUrl);

    // Remove record from DB
    await db.delete(reportImages).where(eq(reportImages.id, reportImageId))


    res.status(200).json({ success: true, message: "Image deleted successfully" });

  } catch (error) {
    console.error("Error in deleteImage:", error);
    res.status(500).json({ success: false, message: "An unexpected error occurred" });
  }
};



export const findMatchingFace = async (req: Request, res: Response) => {
  try {
    if (!isMulterFileArrayDictionary(req.files)) {
      res.status(400).json({ success: false, message: "no file uploaded" });
      return
    }

    const img = req.files["img"]?.[0];
    if (!img) {
      res.status(400).json({ success: false, message: "Image not found" });
      return
      }

    // Send image to FastAPI backend to get the embedding
    const formData = new FormData();
    formData.append("img", img.buffer, img.originalname);

    const response = await axios.post("http://localhost:8000/api/face/embedding", formData, {
      headers: { ...formData.getHeaders() },
    });

    if (!response.data.vector || !Array.isArray(response.data.vector) || response.data.vector.length !== 128) {
      res.status(500).json({ success: false, message: "Invalid embedding received" });
      return
    }

    const queryVector = response.data.vector;

    // Compute similarity using cosine distance
    const similarity = sql<number>`1 - (${cosineDistance(reportImages.encoding, queryVector)})`;

    // Query the database for similar embeddings
    const similarFaces = await db
      .select({
        id: reportImages.id,
        reportId: reportImages.report_id,
        reportTitle: reports.name, // Fetch report title
        reportDescription: reports.description, // Fetch report description
        name: reportImages.name,
        imageUrl: reportImages.imageUrl,
        similarity,
      })
      .from(reportImages)
      .where(gt(similarity, 0.9))
      .innerJoin(reports, eq(reportImages.report_id, reports.id))
      .orderBy((t) => desc(t.similarity)) // Order by highest similarity
      .limit(5); // Limit results

    res.status(200).json({
      success: true,
      message: "Matching faces found",
      data: similarFaces,
    });

  } catch (error) {
    console.error("Error in findMatchingFace:", error);
    res.status(500).json({ success: false, message: "An unexpected error occurred" });
  }
};