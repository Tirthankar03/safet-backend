import { Request, Response } from "express";
import bcrypt from 'bcryptjs';
import { db } from "../db";
import { users } from "../db/schemas/users";
import jwt from 'jsonwebtoken';
import { eq, sql } from "drizzle-orm";
import { generateUniqueId } from "../lib/utils";
import { parseFormData } from "../lib/parser";


export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    console.log("userId>>>>", userId);

    // Parse and clean the request body
    const parsedBody = parseFormData(req.body);
    console.log("parsedBody>>>>", parsedBody);

    // Ensure password is not updated through this endpoint
    if (parsedBody.password) {
      res.status(400).json({ success: false, message: "Password cannot be updated through this endpoint." });
      return;
    }

    // Convert latitude & longitude into a spatial point
    if (parsedBody.latitude !== undefined && parsedBody.longitude !== undefined) {
      const { latitude, longitude } = parsedBody;
      
      parsedBody.currentLocation = sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
      
      // Remove latitude and longitude from parsedBody to avoid unnecessary updates
      delete parsedBody.latitude;
      delete parsedBody.longitude;
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set(parsedBody)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // @ts-ignore
    delete updatedUser.password;

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (e) {
    console.log("Error updating user >>>", e);
    res.status(500).json({ success: false, message: "An unexpected error occurred" });
  }
};




export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedUser = await db.delete(users).where(eq(users.id, id)).returning();

    if (!deletedUser.length) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (e) {
    console.log("Error deleting user >>>", e);
    res.status(500).json({ success: false, message: "An unexpected error occurred" });
  }
};
