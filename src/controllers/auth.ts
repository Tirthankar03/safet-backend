import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db/index";
import { users } from "../db/schemas/users";
import jwt from "jsonwebtoken";
import { eq, sql } from "drizzle-orm";
import { generateUniqueId } from "../lib/utils";
import { parseFormData } from "../lib/parser";

export const loginUser = async (req: Request, res: Response) => {
  try {
    const parsedBody = parseFormData(req.body);
    console.log("parsedBody", parsedBody);

    const { email, password } = parsedBody;

    // Validate required fields
    if (!email || !password) {
      res
        .status(400)
        .json({ success: false, message: "Missing email or password" });
      return;
    }

    // Fetch user from database
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    // Compare hashed password
    const matched = await bcrypt.compare(String(password), user.password);
    if (!matched) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    // Remove password from user object before sending response
    // @ts-ignore
    delete user.password;

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    console.log("user logged in successfully")

    res.status(200).json({
      success: true,
      message: "User signed in successfully",
      data: {
        token,
        user,
      },
    });
  } catch (e) {
    console.log("Error in loginUser>>>", e);
    res
      .status(500)
      .json({ success: false, message: "An unexpected error occurred" });
  }
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    console.log("req.body", req.body);

    const parsedBody = parseFormData(req.body);
    console.log("parsedBody", parsedBody);

    // Extract and validate required fields
    const { email, phoneNumber, username, password, latitude, longitude } =
      parsedBody;

    if (
      !email ||
      !phoneNumber ||
      !username ||
      !password ||
      !latitude ||
      !longitude
    ) {
      res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
      return;
    }

    console.log("phno>>>", phoneNumber);

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      res.status(409).json({ success: false, message: "User already exists" });
      return;
    }

    // Generate ID and hash password
    const hashedPassword = await bcrypt.hash(String(password), 10);

    const userId = generateUniqueId(); // Use UUID for id

    // Create a properly typed user object
    const newUser = {
      id: userId,
      email,
      phoneNumber: Number(phoneNumber), // Ensure it's a number
      username,
      password: hashedPassword,
      currentLocation: sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`, // PostgreSQL GIS type
    };

    // Insert user into DB
    const [user] = await db.insert(users).values(newUser).returning();

    // Remove password before sending response
    // @ts-ignore
    delete user.password;

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        token,
        user,
      },
    });
  } catch (e) {
    console.log("Error in register user>>>", e);
    res
      .status(500)
      .json({ success: false, message: "An unexpected error occurred" });
  }
};
