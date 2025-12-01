import { NextResponse } from 'next/server';
import { SUBREDDITS } from '@/lib/types';
import { fetchFromMultipleSubreddits } from '@/lib/reddit-client';
import { batchProcessPosts } from '@/lib/gemini-client';
import {
  combinePostAndGeminiData,
  replaceCacheWithIdeas,
  shouldRefreshCache,
} from '@/lib/ideas-cache';
import { quickFilterPosts, filterRelevantPosts } from '@/lib/relevance-filter';

// POST /api/ideas/fetch - Fetch new ideas from Reddit and process with Gemini
export async function POST() {
  try {
    // Check if we need to refresh (rate limiting)
    if (!shouldRefreshCache()) {
      return NextResponse.json(
        { message: 'Cache is still fresh. Wait before refreshing.' },
        { status: 429 }
      );
    }

    console.log('Fetching posts from Reddit...');

    // Fetch posts from configured subreddits (more posts to filter from)
    const redditPosts = await fetchFromMultipleSubreddits(
      [...SUBREDDITS],
      {
        sort: 'hot',
        time: 'week',
        postsPerSubreddit: 10, // Fetch 10 per subreddit to filter from
      }
    );

    if (redditPosts.length === 0) {
      return NextResponse.json(
        { message: 'No posts found', ideas: [] },
        { status: 200 }
      );
    }

    console.log(`Fetched ${redditPosts.length} posts. Applying quick filters...`);

    // Step 1: Quick filter (heuristic-based, no API calls)
    const quickFiltered = quickFilterPosts(redditPosts);
    console.log(`Quick filter: ${quickFiltered.length}/${redditPosts.length} posts passed`);

    if (quickFiltered.length === 0) {
      return NextResponse.json(
        { message: 'No posts passed quick filter', ideas: [] },
        { status: 200 }
      );
    }

    // Step 2: AI relevance filter (checks if post is about startup/project ideas)
    console.log('Checking relevance with AI...');
    const relevantPosts = await filterRelevantPosts(
      quickFiltered,
      (checked, total, relevant) => {
        console.log(`Relevance check: ${checked}/${total} (${relevant} relevant)`);
      }
    );

    console.log(`AI filter: ${relevantPosts.length}/${quickFiltered.length} posts are relevant`);

    if (relevantPosts.length === 0) {
      return NextResponse.json(
        { message: 'No relevant startup ideas found', ideas: [] },
        { status: 200 }
      );
    }

    console.log(`Processing ${relevantPosts.length} relevant posts with Gemini...`);

    // Step 3: Process relevant posts with Gemini for enhanced content
    const geminiResults = await batchProcessPosts(
      relevantPosts,
      (processed, total) => {
        console.log(`Gemini processing: ${processed}/${total} posts`);
      }
    );

    // Combine Reddit + Gemini data
    const ideas = relevantPosts.map((post, index) =>
      combinePostAndGeminiData(post, geminiResults[index])
    );

    // Update cache
    replaceCacheWithIdeas(ideas);

    console.log(`Successfully processed and cached ${ideas.length} ideas`);

    return NextResponse.json(
      {
        message: 'Successfully fetched and processed ideas',
        count: ideas.length,
        ideas: ideas.map((idea) => ({
          id: idea.id,
          title: idea.title,
          subreddit: idea.subreddit,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching and processing ideas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch and process ideas', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/ideas/fetch - Check if fetch is needed
export async function GET() {
  const needsRefresh = shouldRefreshCache();

  return NextResponse.json({
    needsRefresh,
    message: needsRefresh
      ? 'Cache needs refresh'
      : 'Cache is fresh',
  });
}
