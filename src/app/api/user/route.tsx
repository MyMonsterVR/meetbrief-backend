import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/schema/schema";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { and, eq } from "drizzle-orm";

type UserType = {
  username: string;
  email: string;
  password: string;
  salt: string;
  createdDate: Date;
};

export async function GET(req: NextRequest, res: NextApiResponse) {
  const usernameInput = req.nextUrl.searchParams.get("username");
  const passwordInput = req.nextUrl.searchParams.get("password");

  if (!usernameInput || !passwordInput) {
    return NextResponse.json({ msg: "Failed due to missing fields", errorCode: 'MISSING_FIELDS' }, { status: 500 });
  }

  const user = await db
    .select({
      username: users.username,
      password: users.password,
      salt: users.salt,
    })
    .from(users)
    .where(eq(users.username, usernameInput)).limit(1);

  if (!user) {
    return NextResponse.json({ msg: "SQL Error: could not get user" }, { status: 500 });
  }
  
  // check if user length is 1
  // if not return error
  
  if(user.length < 1) {
    return NextResponse.json({ msg: "User do not exist" }, { status: 500 });
  }

   const { password, salt } = user[0];

  const hashedBuffer = scryptSync(passwordInput, salt, 64);

  const keyBuffer = Buffer.from(password, "hex");
  const match = timingSafeEqual(hashedBuffer, keyBuffer);

  if(!match) {
    return NextResponse.json({ msg: "Credentials do not match" }, { status: 500 });
  }

  return NextResponse.json({ msg: "Successful", }, { status: 200 });
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
