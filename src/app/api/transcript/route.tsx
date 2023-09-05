import { NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trancripts } from "@/schema/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest, res: NextApiResponse) {
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

  const transcripts = await db
    .select({
      id: trancripts.id,
      name: trancripts.name,
      createdDate: trancripts.createdDate,
    })
    .from(trancripts)
    .where(eq(trancripts.userId, Number.parseInt(decoded.userid)))

  if (!transcripts) {
    return NextResponse.json(
      {
        msg: "SQL Error: could not find transcripts",
        errorCode: "FAILED_TO_FIND_TRANSCRIPTS",
        status: "failed",
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { msg: "Successful", status: "success", transcripts },
    { status: 200 }
  );
}

export async function POST(req: NextRequest, res: NextApiResponse) {
  const { name, content } = await req.json();
  const token = req.headers.get("Authorization")?.split(" ")[1];
  const decoded = jwt.decode(token);

  if (!decoded) {
    return NextResponse.json(
      {
        msg: "Invalid token",
        errorCode: "INVALID_TOKEN",
        status: "failed",
        token
      },
      { status: 500 }
    );
  }

  if (!name || !content) {
    return NextResponse.json(
      { msg: "Failed due to missing fields", errorCode: "MISSING_FIELDS" },
      { status: 500 }
    );
  }

  const input = {userId:decoded.userid, name, content}

  const transcripts = await db.insert(trancripts).values(input);

  if (!transcripts) {
    return NextResponse.json(
      { msg: "SQL Error: could not insert transcripts" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { msg: "Successful", status: "success" },
    { status: 200 }
  );
}