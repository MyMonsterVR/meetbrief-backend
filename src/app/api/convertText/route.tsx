import { NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
import { Hercai } from "hercai";
import { HercaiData } from "hercai/types/src/hercai";

export async function GET(req: NextRequest, res: NextApiResponse) {
  const text = req.nextUrl.searchParams.get("text");
  const type = req.nextUrl.searchParams.get("type");

  const client = new Hercai();
  let extractedTopics = "";

  if (type === "topics")
  {
    await client
      .question({
        model: "v2",
        content: `Please extract the main topics or themes present in the given text. Do not provide explanations or context, just list the topics or themes. Here is the text: "${text}"`,
      })
      .then((data: HercaiData) => (extractedTopics = data.reply));
  }

  else if(type === "summarize")
  {
    await client
      .question({
        model: "v2",
        content: `Extract main topics from the text and provide summaries with each topic as a title, capturing the relevant summary: "${text}"`,
      })
      .then((data: HercaiData) => (extractedTopics = data.reply));
  }

  else {
    return NextResponse.json(
        {
            msg: "Invalid type provided for text conversion",
            errorCode: "INVALID_TYPE",
            status: "failed",
        },
        { status: 500 }
    );
  }

  return NextResponse.json(
    { msg: "Successful", status: "success", extractedTopics },
    { status: 200 }
  );
}
