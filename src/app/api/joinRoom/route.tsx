import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/schema/schema";
import { and, eq } from "drizzle-orm";
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import AccessToken from 'twilio/lib/jwt/AccessToken';
import { cwd } from 'node:process';
import { loadEnvConfig } from '@next/env';
import Twilio from 'twilio';


export async function GET(req: NextRequest, res: NextApiResponse) {
  loadEnvConfig(cwd());
  
  const roomNameInput = req.nextUrl.searchParams.get("roomname");
  const chatName = roomNameInput as string + "-chat";

  const token = req.headers.get("Authorization")?.split(" ")[1];
  const decoded = jwt.decode(token);
  const VideoGrant = AccessToken.VideoGrant;
  const ChatGrant = AccessToken.ChatGrant;

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

  const getChatroom = async (name: string) => {
    try {
      const newConversation = await twilioClient.conversations.v1.conversations.list();
      for (let i = 0; i < newConversation.length; i++) {
        if (newConversation[i].friendlyName === name) {
          return newConversation[i];
        } else {
          const newConversation = await twilioClient.conversations.v1.conversations.create({
            friendlyName: name
          });
          return newConversation;
        }
      }
    } catch {
      // a conversation with the given name does not exist ==> create a new one
      const newConversation = await twilioClient.conversations.v1.conversations.create({
        friendlyName: name
      });
      return newConversation;
    }

  }

  const conversation = await getChatroom(chatName);

  const twilioToken = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID as string,
    process.env.TWILIO_API_KEY as string,
    process.env.TWILIO_API_SECRET as string,
    // generate a random unique identity for this participant
    { identity: uuidv4() }
  );

  const videoGrant = new VideoGrant({
    room: roomNameInput as string,
  });

  const chatGrant = new ChatGrant({
    serviceSid: "IS655aa7db384842ecb7419c4ce6ac585c"
  });
  
  twilioToken.addGrant(videoGrant);
  twilioToken.addGrant(chatGrant);
  return NextResponse.json(
    { msg: "Successful", status: "success", twilioToken: twilioToken.toJwt(), conversationSid: conversation.sid },
    { status: 200 }
  );
}
