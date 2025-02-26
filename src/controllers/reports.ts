import { Request, Response } from "express";
import { db } from "../db/index.js";
import { sql, eq } from "drizzle-orm";
import { generateUniqueId } from "../lib/utils.js";
import { reportClusters, reports } from "../db/schemas/reports.js";
import { assignReportClusterIds, updateReportClusters } from "../lib/report-clustering.js";
import { parseFormData } from "../lib/parser.js";
import { userContacts, users } from "../db/schemas/users.js";

export const createReport = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!; // Extract user ID from token
    const parsedBody = parseFormData(req.body); // Parse request body

    const { name, description, address, country, city, type, latitude, longitude } = parsedBody;

    if (!latitude || !longitude) {
    res.status(400).json({ success: false, message: "Latitude and longitude are required" });
    return;
}

    const id = generateUniqueId();




    const data = await db.insert(reports).values({
      id,
      name,
      description,
      address,
      country,
      city,
      type,
      userId,
      location: sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`,
    }).returning();

    console.log("Report created successfully:", id);

    // Assign clusters and update clusters after a new report is added
    await assignReportClusterIds();
    await updateReportClusters();



    let nearbyUsers: any[] = [];
    let contactUsers: any[] = [];
    let uniqueUsers: any[] = [];

    if (type === "sos") {
      const userLocation = sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;

      // 1️⃣ Get users within 4 km (4000 meters)
      const distance = 4000
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
        .where(sql`${sql<number>`ST_DistanceSphere(${users.currentLocation}, ${userLocation})`} <= ${distance}`);

        console.log("nearbyUsers>>>", nearbyUsers)

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

        console.log("contactUsers>>>", contactUsers)


      // 3️⃣ Merge users and remove duplicates based on `id`
      const mergedUsers = [...nearbyUsers, ...contactUsers];
      console.log("mergedUsers>>>", mergedUsers)

      uniqueUsers = Array.from(new Map(mergedUsers.map((user) => [user.id, user])).values());

      console.log("Unique users for SOS alert:", uniqueUsers);

    res.status(201).json({ success: true, message: "SOS Report created successfully", data, sosUsers: uniqueUsers });
    return;
    }

    res.status(201).json({ success: true, message: "Report created successfully", data });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ success: false, message: "Failed to create report" });
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

    res.status(201).json({ success: true, message: "Report created successfully", data });

    } catch (error) {
        console.error("Error fetching regionMaps:", error);
        res.status(500).json({ success: false, message: "Failed to fetch region maps" });
      }
}

export const updateReport = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!; // Extract user ID from token
      const parsedBody = parseFormData(req.body); // Parse request body
  
      // Step 1: Check if the report exists and belongs to the user
      const report = await db.select({ userId: reports.userId }).from(reports).where(eq(reports.id, id));
  
      if (!report.length) {
         res.status(404).json({ success: false, message: "Report not found" });
         return
        }
  
      if (report[0].userId !== userId) {
         res.status(403).json({ success: false, message: "Unauthorized to update this report" });
         return
        }
  
      // Step 2: Convert latitude & longitude into spatial point (if provided)
      if (parsedBody.latitude !== undefined && parsedBody.longitude !== undefined) {
        const { latitude, longitude } = parsedBody;
        parsedBody.location = sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
  
        // Remove latitude & longitude keys (no need to store separately)
        delete parsedBody.latitude;
        delete parsedBody.longitude;
      }
      
      parsedBody.updatedAt = new Date()
      // Step 3: Update report
      const updatedReport = await db.update(reports).set(parsedBody).where(eq(reports.id, id)).returning();
  
      // Step 4: Recalculate clusters if location was updated
      if (parsedBody.location) {
        await assignReportClusterIds();
        await updateReportClusters();
      }
  
      res.status(200).json({ success: true, message: "Report updated successfully", data: updatedReport });
  
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({ success: false, message: "Failed to update report" });
    }
  };
  


  export const deleteReport = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!; // Extract user ID from token
  
      // Step 1: Check if the report exists and belongs to the user
      const report = await db.select({ userId: reports.userId }).from(reports).where(eq(reports.id, id));
  
      if (!report.length) {
         res.status(404).json({ success: false, message: "Report not found" });
         return
        }
  
      if (report[0].userId !== userId) {
         res.status(403).json({ success: false, message: "Unauthorized to delete this report" });
         return
        }
  
      // Step 2: Delete report
      await db.delete(reports).where(eq(reports.id, id));
  
      // Step 3: Update clusters after deletion
      //this didn't become -1
        await assignReportClusterIds();
      await updateReportClusters();
  
      res.status(200).json({ success: true, message: "Report deleted successfully" });
  
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({ success: false, message: "Failed to delete report" });
    }
  };
  


export const getAllSosReports = async (req: Request, res: Response) => {
    try {
        const data = await db
        .select()
        .from(reports).where(eq(reports.type, 'sos'));

    res.status(201).json({ success: true, message: "SOS reports fetched", data });

    } catch (error) {
        console.error("Error fetching sos reports:", error);
        res.status(500).json({ success: false, message: "Failed to fetch sos reports" });
      }
}


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
  
      res.status(200).json({ success: true, message: "Report fetched", data: formattedReport });
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ success: false, message: "Failed to fetch report" });
    }
  };



