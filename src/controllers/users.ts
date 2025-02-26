import { Request, Response } from "express";
import bcrypt from 'bcryptjs';
import { db } from "../db/index.js";
import { userContacts, users } from "../db/schemas/users.js";
import jwt from 'jsonwebtoken';
import { and, eq, sql } from "drizzle-orm";
import { generateUniqueId } from "../lib/utils.js";
import { parseFormData } from "../lib/parser.js";


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


export const addContact = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!; // Extract user ID from token
    const { id: contactId } = req.params; // Contact user ID

    // Prevent users from adding themselves
    if (userId === contactId) {
      res.status(400).json({ success: false, message: "You cannot add yourself as a contact" });
      return;
    }

    // Check if contact already exists
    const existingContact = await db
      .select()
      .from(userContacts)
      .where(and(eq(userContacts.userId, userId), eq(userContacts.contactId, contactId)));

    if (existingContact.length > 0) {
      res.status(400).json({ success: false, message: "Contact already exists" });
      return;
    }

    // Insert new contact
    const newContact = await db.insert(userContacts).values({ userId, contactId }).returning();

    console.log("newContact>>>", newContact)
    res.status(201).json({ success: true, message: "Contact added successfully", data: newContact });

  } catch (e) {
    console.error("Error adding contact:", e);
    res.status(500).json({ success: false, message: "An unexpected error occurred" });
  }
};

export const getAllContacts = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!; // Extract user ID from token

    // Fetch all contacts for the user
    const contacts = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        phoneNumber: users.phoneNumber,
        longitude: sql`ST_X(${users.currentLocation})`.as("longitude"),
        latitude: sql`ST_Y(${users.currentLocation})`.as("latitude"),
      })
      .from(userContacts)
      .innerJoin(users, eq(userContacts.contactId, users.id))
      .where(eq(userContacts.userId, userId));

      console.log("contacts>>", contacts)

    // Convert longitude & latitude into an array format
    const formattedContacts = contacts.map(contact => ({
      ...contact,
      currentLocation: [contact.longitude, contact.latitude],
    }));

    console.log("formattedContacts>>", formattedContacts)

    res.status(200).json({ success: true, data: formattedContacts });

  } catch (e) {
    console.error("Error fetching contacts:", e);
    res.status(500).json({ success: false, message: "An unexpected error occurred" });
  }
};


export const getContactById = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!; // Extract user ID from token
    const contactId = req.params.id; // Get contact ID from params

    // Fetch contact details only if they are in the user's contacts list
    const contact = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        phoneNumber: users.phoneNumber,
        longitude: sql`ST_X(${users.currentLocation})`.as("longitude"),
        latitude: sql`ST_Y(${users.currentLocation})`.as("latitude"),
      })
      .from(userContacts)
      .innerJoin(users, eq(userContacts.contactId, users.id))
      .where(and(eq(userContacts.userId, userId), eq(userContacts.contactId, contactId)))
      .limit(1);

    if (!contact.length) {
      res.status(404).json({ success: false, message: "Contact not found" });
      return;
    }

    // Format the response to include location as an array
    const formattedContact = {
      ...contact[0],
      currentLocation: [contact[0].longitude, contact[0].latitude],
    };

    res.status(200).json({ success: true, data: formattedContact });

  } catch (e) {
    console.error("Error fetching contact:", e);
    res.status(500).json({ success: false, message: "An unexpected error occurred" });
  }
};
