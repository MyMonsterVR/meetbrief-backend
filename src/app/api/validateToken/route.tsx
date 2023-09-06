import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/schema/schema";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { and, eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest, res: NextApiResponse) {
    try {
      const token = req.headers.get("Authorization")?.split(" ")[1];
      const decoded = jwt.decode(token);
  
      if (!decoded) {
        return NextResponse.json(
          {
            msg: "Invalid token",
            errorCode: "INVALID_TOKEN",
            status: "failed",
          },
          { status: 500 }
        );
      }
  
      // expired token
      if (Date.now() > decoded.exp * 1000) {
        return NextResponse.json(
          {
            msg: "Expired token, please renew it",
            errorCode: "EXPIRED_TOKEN",
            status: "failed",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          msg: "Valid token",
          status: "success",
        },
        { status: 200 }
      );
    }
    catch (error)
    {
        return NextResponse.json(
            {
            msg: error,
            errorCode: "UNKNOWN_ERROR",
            status: "failed",
            },
            { status: 500 }
        );
    }
}