import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

// export const config = {
//   runtime: 'edge',
// }

export default async function handler(req: NextRequest, response: NextResponse) {
  const cron = req.nextUrl.pathname.split('/')[3]
  console.log(cron)
  // return new Response('Hello', { status: 200 });

  try {
    // The endpoint to retrieve the best stories IDs
    const bestStoriesUrl = 'https://hacker-news.firebaseio.com/v0/beststories.json';

    // Fetch the top stories IDs from the best stories endpoint
    const response = await fetch(bestStoriesUrl);
    const storyIds = await response.json();

    // Limit to the top 5 stories
    const top5StoryIds = storyIds.slice(0, 5);

    // Fetch the story details for each top story in parallel
    const storyDetailsPromises = top5StoryIds.map(id =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(res => res.json())
    );

    // Resolve all story detail promises
    const topStories = await Promise.all(storyDetailsPromises);

    console.log({topStories});
    

    // Respond with a JSON object containing the top stories
    // res.status(200).json(topStories);
    response.status(200).json(topStories)
  
  } catch (error) {
    // Handle any errors that occurred during the process
    response.status(500).json({ error: 'Failed fetching top Hacker News stories' });
  }
}

async function update(interval: string) {
  const topstories = await fetch(
    'https://hacker-news.firebaseio.com/v0/newstories.json?print=pretty'
  ).then((res) => res.json())

  const response = await kv.set(interval, {
    fetchedAt: Date.now(),
    id: topstories[0],
  })

  return response
}
