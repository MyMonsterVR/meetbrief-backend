import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/schema/schema";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { and, eq } from "drizzle-orm";
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import AccessToken from 'twilio/lib/jwt/AccessToken';

type User = {
  username: string;
  email: string;
  password: string;
  salt: string;
};

export async function GET(req: NextRequest, res: NextApiResponse) {
  const usernameInput = req.nextUrl.searchParams.get("username");
  const passwordInput = req.nextUrl.searchParams.get("password");

  if (!usernameInput || !passwordInput) {
    return NextResponse.json(
      { msg: "Failed due to missing fields", errorCode: "MISSING_FIELDS" },
      { status: 500 }
    );
  }

  const user = await db
    .select({
      userid: users.id,
      email: users.email,
      username: users.username,
      password: users.password,
      salt: users.salt,
    })
    .from(users)
    .where(eq(users.username, usernameInput))
    .limit(1);

  if (!user) {
    return NextResponse.json(
      {
        msg: "SQL Error: could not get user",
        errorCode: "FAILED_TO_FETCH_USER",
        status: "failed",
      },
      { status: 500 }
    );
  }

  // check if user length is 1
  // if not return error

  if (user.length < 1) {
    return NextResponse.json(
      { msg: "User do not exist", errorCode: "NO_USER", status: "failed" },
      { status: 500 }
    );
  }

  const { password, salt } = user[0];

  const hashedBuffer = scryptSync(passwordInput, salt, 64);

  const keyBuffer = Buffer.from(password, "hex");
  const match = timingSafeEqual(hashedBuffer, keyBuffer);

  if (!match) {
    return NextResponse.json(
      {
        msg: "Credentials do not match",
        errorCode: "BAD_CREDENTIALS",
        status: "failed",
      },
      { status: 500 }
    );
  }

  const userid = user[0].userid;

  const token = jwt.sign({ userid }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  const twilioToken = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID as string,
    process.env.TWILIO_API_KEY_SID as string,
    process.env.TWILIO_API_KEY_SECRET as string,
    // generate a random unique identity for this participant
    { identity: uuidv4() }
  ).toJwt();

  return NextResponse.json(
    { msg: "Successful", status: "success", token, twilioToken },
    { status: 200 }
  );
}
