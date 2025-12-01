# IdeaRadar

> Discover trending startup ideas from Reddit's most active entrepreneurial communities

IdeaRadar aggregates startup ideas from Reddit, processes them with AI to generate enhanced summaries and market potential scores, and presents them in a beautiful, searchable interface.

## Features

✨ **AI-Powered Summaries** - Gemini AI analyzes each idea and generates:
- Professional, enhanced titles
- Structured descriptions (Problem → Solution → Audience → Use Case)
- Market potential scores (1-100)

🔍 **Smart Filtering** - Search, filter by subreddit, and sort by:
- Popularity (upvotes)
- Recency (newest first)
- Discussion (comment count)
- Market potential score

📱 **Responsive Design** - Beautiful dark theme UI that works on all devices

🔗 **Reddit Integration** - Direct links to original posts, full attribution to authors

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API credentials

# Run development server
npm run dev

# Fetch initial data (in browser or via curl)
curl -X POST http://localhost:3000/api/ideas/fetch
```

See [QUICK_START.md](QUICK_START.md) for detailed instructions.

## Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get running in 5 minutes
- **[SETUP.md](SETUP.md)** - Complete setup guide with API credentials
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture and implementation
- **[IdeaRadar.md](IdeaRadar.md)** - Project overview and API usage policy

## Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes, Node.js 20+
- **APIs**: Reddit API (snoowrap), Google Gemini AI
- **Type Safety**: TypeScript 5

## API Endpoints

```bash
GET  /api/ideas           # List ideas with filters & pagination
GET  /api/ideas/[id]      # Get single idea by ID
POST /api/ideas/fetch     # Refresh ideas from Reddit
```

## Configuration

### Subreddits (8 configured by default)
- r/startup
- r/startupideas
- r/Entrepreneur
- r/sideproject
- r/businessideas
- r/EntrepreneurRideAlong
- r/saas
- r/smallbusiness

Customize in [lib/types.ts](lib/types.ts)

### Environment Variables

```bash
REDDIT_CLIENT_ID=        # Reddit OAuth client ID
REDDIT_CLIENT_SECRET=    # Reddit OAuth client secret
REDDIT_USER_AGENT=       # User agent string
GEMINI_API_KEY=          # Google Gemini API key
```

## Reddit API Compliance

IdeaRadar is fully compliant with Reddit's API Terms:
- ✅ Read-only access (no posting/commenting)
- ✅ Respects rate limits
- ✅ Links back to original posts
- ✅ Full attribution to authors
- ✅ Does not republish full content
- ✅ Uses official API (no scraping)

See [IdeaRadar.md](IdeaRadar.md) for full compliance documentation.

## Development

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
```

## Project Structure

```
├── app/
│   ├── api/ideas/         # API routes
│   ├── idea/[id]/         # Idea detail page
│   └── page.tsx           # Homepage
├── lib/
│   ├── types.ts           # TypeScript definitions
│   ├── reddit-client.ts   # Reddit API wrapper
│   ├── gemini-client.ts   # Gemini AI wrapper
│   └── ideas-cache.ts     # In-memory cache
├── components/ui/         # Reusable components
└── docs/                  # Documentation
```

## License

MIT

## Credits

- Built with [Next.js](https://nextjs.org)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Data from [Reddit API](https://www.reddit.com/dev/api)
- AI processing by [Google Gemini](https://ai.google.dev)
