import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/schema/schema";
import { and, eq } from "drizzle-orm";
import jwt from 'jsonwebtoken';
import Twilio from 'twilio';

export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS(req: NextRequest) {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest, res: NextApiResponse) {
  
  const roomNameInput = req.nextUrl.searchParams.get("roomname");

  const token = req.headers.get("Authorization")?.split(" ")[1];
  const decoded = jwt.decode(token);
  const twilioClient = Twilio(
    process.env.TWILIO_API_KEY as string,
    process.env.TWILIO_API_SECRET as string,
    { accountSid: process.env.TWILIO_ACCOUNT_SID as string }
    );

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
        msg: "Expired token",
        errorCode: "EXPIRED_TOKEN",
        status: "failed",
      },
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
    .where(eq(users.id, decoded.userid))
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

  const findOrCreateRoom = async (roomNameInput: string) => {
    try {
        await twilioClient.video.v1.rooms(roomNameInput).fetch();
        return NextResponse.json(
            { msg: `A room with the name ${roomNameInput} already exists`, status: "failed" },
            { status: 409 }
          );
    } catch (error: any) {
        if (error.code === 20404) {
            await twilioClient.video.v1.rooms.create({uniqueName: roomNameInput, type: "go"}).then(room => {
                return NextResponse.json(
                    { msg: "Successful", status: "success", room: room.sid},
                    { status: 200 }
                  );
            });
        } else {
            return NextResponse.json(
                { msg: error, status: "failed" },
                { status: error.code }
              );
        }
    }
  }

  await findOrCreateRoom(roomNameInput as string);

  return NextResponse.json(
    { msg: "Successful", status: "success"},
    { status: 200 }
  );
}
