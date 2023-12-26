import { NextResponse } from "next/server";

export const config = {
  runtime: "edge",
};

type Story = {
  by: string;
  descendants: number;
  id: number;
  kids: number[];
  score: number;
  time: number;
  title: string;
  // type: "story" | "job" | "poll" | "comment" | "pollopt";
  type: "story";
  url: string;
};

export default async function handler() {
  try {
    const topStoriesUrl =
      "https://hacker-news.firebaseio.com/v0/topstories.json";

    // Fetch the top stories IDs
    const response = await fetch(topStoriesUrl);
    const storyIds = (await response.json()) as number[];
    const top5StoryIds = storyIds.slice(0, 5);

    // Fetch the story details for each top story in parallel
    const storyDetailsPromises = top5StoryIds.map((id) =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(
        (res) => res.json() as Promise<Story>
      )
    );

    // Resolve all story detail promises
    const topStories = await Promise.all(storyDetailsPromises);
    await sendEmail(topStories);

    return new NextResponse("Done");
  } catch (error) {
    return new NextResponse("Error", { status: 500 });
  }
}

async function sendEmail(stories: Story[]) {
  const emailHtml = `<html>
    <body>
      <h1>Top 5 Hacker News Stories</h1>
      <ol>  
        ${stories
          .map((story) => `<li><a href="${story.url}">${story.title}</a></li>`)
          .join("")}
      </ol>
    </body>
  </html>`;

  const emailUrl = `https://api.resend.com/emails`;
  const emailHeaders = {
    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
  };
  const emailBody = JSON.stringify({
    to: process.env.EMAIL_RECIPIENT,
    from: process.env.EMAIL_SENDER,
    subject: "Top 5 Hacker News Stories Roundup",
    html: emailHtml,
  });

  const emailResponse = fetch(emailUrl, {
    method: "POST",
    headers: emailHeaders,
    body: emailBody,
  }).then((res) => {
    if (res.ok) {
      console.log("Email sent successfully");
      return res.json();
    }
    throw new Error("Error sending email");
  });

  return emailResponse;
}
