import Snoowrap from 'snoowrap';
import type { RedditPost, Subreddit } from './types';

// Initialize Reddit client
let redditClient: Snoowrap | null = null;

async function getRedditClient(): Promise<Snoowrap> {
  if (!redditClient) {
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;
    const userAgent = process.env.REDDIT_USER_AGENT || 'IdeaRadar/1.0.0';

    if (!clientId || !clientSecret) {
      throw new Error('Reddit API credentials not configured');
    }

    // Use application-only OAuth (client credentials grant)
    // This requires fetching an access token first
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': userAgent,
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to obtain Reddit access token');
    }

    const tokenData = await tokenResponse.json();

    redditClient = new Snoowrap({
      userAgent,
      clientId,
      clientSecret,
      accessToken: tokenData.access_token,
    });

    // Configure to avoid rate limiting issues
    redditClient.config({ requestDelay: 1000, continueAfterRatelimitError: true });
  }

  return redditClient;
}

// Fetch posts from a specific subreddit
export async function fetchSubredditPosts(
  subreddit: Subreddit,
  options: {
    sort?: 'hot' | 'new' | 'top';
    time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    limit?: number;
  } = {}
): Promise<RedditPost[]> {
  try {
    const client = await getRedditClient();
    const { sort = 'hot', time = 'week', limit = 25 } = options;

    // Get subreddit instance
    const sub = client.getSubreddit(subreddit);

    // Fetch posts based on sort type
    let posts;
    if (sort === 'hot') {
      posts = await sub.getHot({ limit });
    } else if (sort === 'new') {
      posts = await sub.getNew({ limit });
    } else {
      posts = await sub.getTop({ time, limit });
    }

    // Transform to our RedditPost interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return posts.map((post: any) => ({
      id: post.id,
      title: post.title,
      selftext: post.selftext || '',
      subreddit: `r/${post.subreddit.display_name}`,
      author: post.author.name,
      score: post.score,
      num_comments: post.num_comments,
      created_utc: post.created_utc,
      permalink: `https://reddit.com${post.permalink}`,
      url: post.url,
      thumbnail: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : undefined,
    }));
  } catch (error) {
    console.error(`Error fetching posts from r/${subreddit}:`, error);
    throw new Error(`Failed to fetch posts from r/${subreddit}`);
  }
}

// Fetch posts from multiple subreddits
export async function fetchFromMultipleSubreddits(
  subreddits: Subreddit[],
  options: {
    sort?: 'hot' | 'new' | 'top';
    time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    limit?: number;
    postsPerSubreddit?: number;
  } = {}
): Promise<RedditPost[]> {
  const { postsPerSubreddit = 10, ...fetchOptions } = options;

  try {
    // Fetch from all subreddits in parallel
    const allPosts = await Promise.all(
      subreddits.map((sub) =>
        fetchSubredditPosts(sub, { ...fetchOptions, limit: postsPerSubreddit })
      )
    );

    // Flatten all posts (filtering done separately by relevance-filter)
    const posts = allPosts.flat();

    return posts;
  } catch (error) {
    console.error('Error fetching from multiple subreddits:', error);
    throw error;
  }
}

// Get a single post by ID
export async function fetchPostById(postId: string): Promise<RedditPost | null> {
  try {
    const client = await getRedditClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const submission = await (client.getSubmission(postId).fetch() as Promise<any>);

    return {
      id: submission.id,
      title: submission.title,
      selftext: submission.selftext || '',
      subreddit: `r/${submission.subreddit.display_name}`,
      author: submission.author.name,
      score: submission.score,
      num_comments: submission.num_comments,
      created_utc: submission.created_utc,
      permalink: `https://reddit.com${submission.permalink}`,
      url: submission.url,
      thumbnail:
        submission.thumbnail && submission.thumbnail.startsWith('http')
          ? submission.thumbnail
          : undefined,
    };
  } catch (error) {
    console.error(`Error fetching post ${postId}:`, error);
    return null;
  }
}
