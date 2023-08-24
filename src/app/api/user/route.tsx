import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/schema/schema";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { and, eq } from "drizzle-orm";

type UserType = {
  username?: string;
  email: string;
  password: string;
  salt: string;
  createdDate?: Date;
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
      return NextResponse.json(
        {
          msg: "Failed due to missing fields",
          username,
          email,
          password,
        },
        { status: 500 }
      );
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
      return NextResponse.json(
        { msg: "SQL Error: could not insert user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ msg: "Successful" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        msg: error,
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(req: NextRequest, res: NextApiResponse) {
  const {
    userId,
    email: emailInput,
    password: passwordInput,
    newPassword,
  } = await req.json();

  try {
    if (!emailInput || !passwordInput) {
      return NextResponse.json(
        {
          msg: "Failed due to missing fields",
          errorCode: "MISSING_FIELDS",
          emailInput,
          passwordInput,
        },
        { status: 500 }
      );
    }

    const userDetails = await db
      .select({
        email: users.email,
        password: users.password,
        salt: users.salt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userDetails) {
      return NextResponse.json(
        {
          msg: "SQL Error: Could not get user",
          errorCode: "FAILED_TO_FETCH_USER",
          status: "failed",
        },
        { status: 500 }
      );
    }

    // check if user length is 1
    // if not return error

    if (userDetails.length < 1) {
      return NextResponse.json(
        { msg: "User do not exist", errorCode: "NO_USER", status: "failed" },
        { status: 500 }
      );
    }

    const { password, salt } = userDetails[0];

    const hashedBuffer = scryptSync(escape(passwordInput), salt, 64);

    const keyBuffer = Buffer.from(password, "hex");
    const match = timingSafeEqual(hashedBuffer, keyBuffer);

    if (!match) {
      return NextResponse.json(
        {
          msg: "Invalid credentials",
          errorCode: "INVALID_CREDENTIALS",
          status: "failed",
        },
        { status: 500 }
      );
    }

    const newSalt = randomBytes(16).toString("hex");
    const hash = scryptSync(newPassword, newSalt, 64).toString("hex");

    const userInfo: UserType = {
      email: emailInput,
      password: hash,
      salt: newSalt,
    };

    const user = await db.update(users).set(userInfo).where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json(
        {
          msg: "SQL Error: Could not insert user",
          errorCode: "FAILED_TO_INSERT_USER",
          status: "failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ msg: "Successful" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        msg: error,
        errorCode: "UNKNOWN_ERROR",
      },
      {
        status: 500,
      }
    );
  }
}

const escape = (str: string) => {
  const escapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };

  return str
    .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
      switch (char) {
        case "\0":
          return "\\0";
        case "\x08":
          return "\\b";
        case "\x09":
          return "\\t";
        case "\x1a":
          return "\\z";
        case "\n":
          return "\\n";
        case "\r":
          return "\\r";
        case '"':
        case "'":
        case "\\":
        case "%":
          return `\\${char}`; // prepends a backslash to backslash, percent,
        // and double/single quotes
        default:
          return char;
      }
    })
    .replace(/[&<>"'`=\/]/g, (s) => escapeMap[s]);
};
