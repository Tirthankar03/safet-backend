import { Request, Response } from "express";
import { db } from "../db/index";
import { sql, eq } from "drizzle-orm";
import { generateUniqueId } from "../lib/utils";
import { reportClusters, reports } from "../db/schemas/reports";
import {
  assignReportClusterIds,
  updateReportClusters,
} from "../lib/report-clustering";
import { parseFormData } from "../lib/parser";
import { userContacts, users } from "../db/schemas/users";


import { OpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import axios from "axios";

const NEWS_API_URL = `https://newsapi.org/v2/everything?q=crime&apiKey=${process.env.NEWS_API_KEY}`;

// OpenAI model for structured data extraction
const model = new OpenAI({ openAIApiKey: process.env.OPENAI_API_KEY });

// Corrected Prompt Template with proper input variables
const template = new PromptTemplate({
  template: `Extract the following details from the given news article text and return a JSON response:
  - Name of the incident
  - Time of the incident
  - Address of the incident
  - Latitude and Longitude
  - Description
  - Image URLs (if any)
  
  Return JSON:
  {{
    "name": "{name}",
    "time": "{time}",
    "address": "{address}",
    "latitude": "{latitude}",
    "longitude": "{longitude}",
    "description": "{description}",
    "imageUrls": {imageUrls}
  }}

  News: {news}`,
  inputVariables: ["news", "name", "time", "address", "latitude", "longitude", "description", "imageUrls"]
});


export const createReport = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!; // Extract user ID from token

    console.log("userId>>>>", userId)
    const parsedBody = parseFormData(req.body); // Parse request body

    console.log("parsedBody>>>>", parsedBody)

    const {
      name,
      description,
      address,
      country,
      city,
      type,
      latitude,
      longitude,
    } = parsedBody;

    if (!latitude || !longitude) {
      res
        .status(400)
        .json({
          success: false,
          message: "Latitude and longitude are required",
        });
      return;
    }

    const id = generateUniqueId();

    const data = await db
      .insert(reports)
      .values({
        id,
        name,
        description,
        address,
        country,
        city,
        type,
        userId,
        location: sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`,
      })
      .returning();

    console.log("Report created successfully:", id);
    console.log("data:>?>>>", data);

    // Assign clusters and update clusters after a new report is added
    await assignReportClusterIds();
    await updateReportClusters();

    let nearbyUsers: any[] = [];
    let contactUsers: any[] = [];
    let uniqueUsers: any[] = [];

    if (type === "sos") {
      const userLocation = sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
      const formData = new FormData();
      formData.append("title","Alert" );
      formData.append("message","Incident Occured" );

      const response = await axios.post(
        "https://ce10-14-139-221-40.ngrok-free.app/api/reports/notify",
      formData
      );

      console.log("reponse.data>>>", response.data)

      // console.log("response of sos>>>", response)
      // 1️⃣ Get users within 4 km (4000 meters)
      const distance = 4000;
      nearbyUsers = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          phoneNumber: users.phoneNumber,
          longitude: sql<number>`ST_X(${users.currentLocation})::float`,
          latitude: sql<number>`ST_Y(${users.currentLocation})::float`,
          distance: sql<number>`ST_DistanceSphere(${users.currentLocation}, ${userLocation})::float`,
        })
        .from(users)
        .where(
          sql`${sql<number>`ST_DistanceSphere(${users.currentLocation}, ${userLocation})`} <= ${distance}`
        );

      console.log("nearbyUsers>>>", nearbyUsers);

      // 2️⃣ Get all contacts of the SOS creator
      contactUsers = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          phoneNumber: users.phoneNumber,
          longitude: sql<number>`ST_X(${users.currentLocation})::float`,
          latitude: sql<number>`ST_Y(${users.currentLocation})::float`,
        })
        .from(userContacts)
        .innerJoin(users, eq(userContacts.contactId, users.id))
        .where(eq(userContacts.userId, userId));

      console.log("contactUsers>>>", contactUsers);

      // 3️⃣ Merge users and remove duplicates based on `id`
      const mergedUsers = [...nearbyUsers, ...contactUsers];
      console.log("mergedUsers>>>", mergedUsers);

      uniqueUsers = Array.from(
        new Map(mergedUsers.map((user) => [user.id, user])).values()
      );

      console.log("Unique users for SOS alert:", uniqueUsers);

      res
        .status(201)
        .json({
          success: true,
          message: "SOS Report created successfully",
          data,
          sosUsers: uniqueUsers,
        });
      return;
    }

    res
      .status(201)
      .json({ success: true, message: "Report created successfully", data });
  } catch (error) {
    console.error("Error creating report:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create report" });
  }
};

export const getAllRegionMaps = async (req: Request, res: Response) => {
  try {
    await updateReportClusters();

    const data = await db
      .select({
        cluster_id: reportClusters.cluster_id,
        polygon: reportClusters.polygon,
        centroid: reportClusters.centroid,
        markers: reportClusters.markers,
      })
      .from(reportClusters);

    res
      .status(201)
      .json({ success: true, message: "Report created successfully", data });
  } catch (error) {
    console.error("Error fetching regionMaps:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch region maps" });
  }
};

export const updateReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!; // Extract user ID from token
    const parsedBody = parseFormData(req.body); // Parse request body

    // Step 1: Check if the report exists and belongs to the user
    const report = await db
      .select({ userId: reports.userId })
      .from(reports)
      .where(eq(reports.id, id));

    if (!report.length) {
      res.status(404).json({ success: false, message: "Report not found" });
      return;
    }

    if (report[0].userId !== userId) {
      res
        .status(403)
        .json({
          success: false,
          message: "Unauthorized to update this report",
        });
      return;
    }

    // Step 2: Convert latitude & longitude into spatial point (if provided)
    if (
      parsedBody.latitude !== undefined &&
      parsedBody.longitude !== undefined
    ) {
      const { latitude, longitude } = parsedBody;
      parsedBody.location = sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;

      // Remove latitude & longitude keys (no need to store separately)
      delete parsedBody.latitude;
      delete parsedBody.longitude;
    }

    parsedBody.updatedAt = new Date();
    // Step 3: Update report
    const updatedReport = await db
      .update(reports)
      .set(parsedBody)
      .where(eq(reports.id, id))
      .returning();

    // Step 4: Recalculate clusters if location was updated
    if (parsedBody.location) {
      await assignReportClusterIds();
      await updateReportClusters();
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Report updated successfully",
        data: updatedReport,
      });
  } catch (error) {
    console.error("Error updating report:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update report" });
  }
};

export const deleteReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!; // Extract user ID from token

    // Step 1: Check if the report exists and belongs to the user
    const report = await db
      .select({ userId: reports.userId })
      .from(reports)
      .where(eq(reports.id, id));

    if (!report.length) {
      res.status(404).json({ success: false, message: "Report not found" });
      return;
    }

    if (report[0].userId !== userId) {
      res
        .status(403)
        .json({
          success: false,
          message: "Unauthorized to delete this report",
        });
      return;
    }

    // Step 2: Delete report
    await db.delete(reports).where(eq(reports.id, id));

    // Step 3: Update clusters after deletion
    //this didn't become -1
    await assignReportClusterIds();
    await updateReportClusters();

    res
      .status(200)
      .json({ success: true, message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete report" });
  }
};

export const getAllSosReports = async (req: Request, res: Response) => {
  try {
    const data = await db.select().from(reports).where(eq(reports.type, "sos"));

    res
      .status(201)
      .json({ success: true, message: "SOS reports fetched", data });
  } catch (error) {
    console.error("Error fetching sos reports:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch sos reports" });
  }
};

export const getReportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const report = await db
      .select({
        id: reports.id,
        name: reports.name,
        description: reports.description,
        createdAt: reports.createdAt,
        updatedAt: reports.updatedAt,
        address: reports.address,
        country: reports.country,
        city: reports.city,
        clusterId: reports.cluster_id,
        type: reports.type,
        longitude: sql`ST_X(${reports.location})`.as("longitude"),
        latitude: sql`ST_Y(${reports.location})`.as("latitude"),
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          phoneNumber: users.phoneNumber,
        },
      })
      .from(reports)
      .innerJoin(users, eq(reports.userId, users.id))
      .where(eq(reports.id, id))
      .limit(1);

    if (!report.length) {
      res.status(404).json({ success: false, message: "Report not found" });
      return;
    }

    // Format location as [longitude, latitude]
    const formattedReport = {
      ...report[0],
      location: [report[0].longitude, report[0].latitude],
    };

    res
      .status(200)
      .json({
        success: true,
        message: "Report fetched",
        data: formattedReport,
      });
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ success: false, message: "Failed to fetch report" });
  }
};

export const getNewsReport = async (req:Request, res: Response) => {
  try {
      // Fetch crime news
      const response = await axios.get(NEWS_API_URL);
      const articles = response.data.articles.slice(0, 5); // Get top 5 articles

      const results = await Promise.all(
          articles.map(async (article) => {
              const prompt = await template.format({ news: article.description || article.title });
              const structuredData = await model.call(prompt);
              const parsedData = JSON.parse(structuredData);
              parsedData.description = article.description || "";
              parsedData.imageUrls = article.urlToImage ? [article.urlToImage] : [];
              return parsedData;
          })
      );

      res.status(200).json({ crimeReports: results });
  } catch (error) {
    console.error("Error get crime report:", error);
    res.status(500).json({ success: false, message: "Failed to get crime report" });
  }
}


export const sendNotification = async (req:Request, res: Response) => {
  try {
    const parsedBody = parseFormData(req.body); // Parse request body

    console.log("parsedBody>>>>", parsedBody)

    const {title, message} = parsedBody

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Basic ${process.env.ONESIGNAL_API_KEY}`
  };

  const body = {
      app_id: process.env.ONESIGNAL_APP_ID,
      // include_player_ids: [playerId], // Send notification to specific user
      headings: { "en": title },
      contents: { "en": message },
      included_segments: ["All"]
  };

  const response = await axios.post("https://onesignal.com/api/v1/notifications", body, { headers });

  return res.status(200).json({ success: true, message: "Notification sent successfully"})

} catch (error) {
  console.error("Error get crime report:", error);
  res.status(500).json({ success: false, message: "Failed to get crime report" });
}
}