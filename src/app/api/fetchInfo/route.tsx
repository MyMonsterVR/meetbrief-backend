import { NextRequest, NextResponse } from "next/server";
import jsw from "jsonwebtoken";
import { db } from "@/lib/db";
import { users } from "@/schema/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, res: NextResponse) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  const secret = process.env.JWT_SECRET;

  if (!token) {
    return NextResponse.json({ msg: "No token provided" }, { status: 401 });
  }

  if (!secret) {
    return NextResponse.json({ msg: "No secret provided" }, { status: 401 });
  }

  try {
    const decoded = jsw.verify(token, secret);

    const userInfo = db
      .select({
        username: users.username,
        email: users.email,
      })
      .from(users)
      .where(eq(users, decoded.userid))
      .limit(1);

    return NextResponse.json({ msg: userInfo }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ msg: "Invalid token" }, { status: 401 });
  }
}
