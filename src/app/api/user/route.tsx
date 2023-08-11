import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/schema/schema";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { and, eq } from "drizzle-orm";
import NextCors from "nextjs-cors";

type UserType = {
  username: string;
  email: string;
  password: string;
  salt: string;
  createdDate: Date;
};

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};


export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest, res: NextResponse) {
  const { username, email, password } = await req.json();

  try {
    if (!username || !email || !password) {
      return NextResponse.json({
        msg: "Failed due to missing fields",
        username,
        email,
        password,
      }, { status: 500 });
    }

    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");

    const userInfo: UserType = {
      username,
      email,
      password: hash,
      salt,
      createdDate: new Date(),
    };

    const user = await db.insert(users).values(userInfo);

    if (!user) {
      return NextResponse.json({ msg: "SQL Error: could not insert user" }, { status: 500 });
    }
    

    return NextResponse.json({ msg: "Successful" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        msg: "Credentials may already exist.",
        errorCode: "CREDENTIALS_EXIST",
        username,
        email,
        password,
      },
      {
        status: 500,
      }
    );
  }
}
