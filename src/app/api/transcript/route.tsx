import { NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trancripts } from "@/schema/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, res: NextApiResponse) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { msg: "Failed due to missing fields", errorCode: "MISSING_FIELDS" },
      { status: 500 }
    );
  }

  const transcripts = await db
    .select({
      content: trancripts.content
    })
    .from(trancripts)
    .where(eq(trancripts.id, Number.parseInt(id)))


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
    { msg: "Successful", status: "success" },
    { status: 200 }
  );
}

export async function POST(req: NextRequest, res: NextApiResponse) {
  const { userId, name, content } = await req.json();


  if (!userId || !name || !content) {
    return NextResponse.json(
      { msg: "Failed due to missing fields", errorCode: "MISSING_FIELDS" },
      { status: 500 }
    );
  }

  const input = {id:userId, name, content}

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