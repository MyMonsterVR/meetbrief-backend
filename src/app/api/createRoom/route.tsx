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
  
  const options = await req.json();

  const roomNameInput = options.options.roomName; 
  const roomTypeInput = options.options.type; 
  const maxParticipantsInput = options.options.maxParticipants; 
  const audioOnlyInput = options.options.audioOnly; 

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
        msg: "SQL Error: Could not get user",
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

  const findOrCreateRoom = async () => {
    try {
        await twilioClient.video.v1.rooms(roomNameInput).fetch();
        return { msg: "Room already exists!", status: "failed", options: options};
    } catch (error: any) {
      try {
        let newRoom = null as any;
        await twilioClient.video.v1.rooms.create({
          uniqueName: roomNameInput, 
          type: roomTypeInput, 
          maxParticipants: maxParticipantsInput, 
          audioOnly: audioOnlyInput 
        }).then(room => newRoom = room);
        return {uniqueName: newRoom.uniqueName, room: newRoom, options: options}
      } catch (error: any) {
        return { msg: "Room could not be created", status: "failed"};
      }
    }
  }

  const result = await findOrCreateRoom();

  return NextResponse.json(
    { msg: "Successful", status: "success", room: result},
    { status: 200 }
  );
}
