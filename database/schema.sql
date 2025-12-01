-- IdeaRadar Database Schema
-- PostgreSQL / Supabase compatible
-- Uses Clerk for authentication (user IDs are TEXT from Clerk)

-- ============================================
-- PROFILES TABLE
-- Stores user profile information synced from Clerk
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,                          -- Clerk user ID
    email TEXT NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE profiles IS 'User profiles synced from Clerk authentication';

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================
-- IDEAS TABLE
-- Stores startup ideas from Reddit AND user-submitted ideas
-- ============================================
CREATE TABLE IF NOT EXISTS ideas (
    id TEXT PRIMARY KEY,                          -- Reddit post ID or UUID for user ideas
    title TEXT NOT NULL,                          -- AI-enhanced title or user title
    original_title TEXT,                          -- Original Reddit post title (NULL for user ideas)
    description TEXT NOT NULL,                    -- AI-generated or user-written summary
    body_text TEXT,                               -- Original Reddit content or user details (optional)
    
    -- Source tracking
    source TEXT NOT NULL DEFAULT 'reddit'         -- 'reddit' or 'user'
        CHECK (source IN ('reddit', 'user')),
    user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,  -- NULL for Reddit, Clerk ID for user ideas
    
    -- Reddit-specific fields (NULL for user-submitted ideas)
    subreddit TEXT,                               -- Source subreddit (e.g., 'r/startup')
    reddit_author TEXT,                           -- Reddit author username
    post_url TEXT,                                -- URL to original Reddit post
    reddit_score INTEGER DEFAULT 0,               -- Original Reddit upvotes (preserved)
    reddit_comments INTEGER DEFAULT 0,            -- Original Reddit comment count (preserved)
    
    -- Platform engagement metrics (for user ideas AND Reddit ideas on our platform)
    upvotes INTEGER NOT NULL DEFAULT 0,           -- Platform upvotes (from idea_votes)
    downvotes INTEGER NOT NULL DEFAULT 0,         -- Platform downvotes (from idea_votes)
    comments_count INTEGER NOT NULL DEFAULT 0,    -- Platform comments (from idea_comments)
    
    -- Media
    thumbnail TEXT,                               -- Thumbnail image URL (if available)
    
    -- AI scoring
    market_potential_score INTEGER                -- AI-generated score (1-100), NULL until processed
        CHECK (market_potential_score IS NULL OR (market_potential_score >= 1 AND market_potential_score <= 100)),
    
    -- Status for user ideas
    status TEXT DEFAULT 'published'               -- 'draft', 'published', 'archived'
        CHECK (status IN ('draft', 'published', 'archived')),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,                     -- When processed by Gemini (NULL if not yet)
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE ideas IS 'Startup ideas from Reddit (auto-fetched) and user submissions';

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ideas_subreddit ON ideas(subreddit);
CREATE INDEX IF NOT EXISTS idx_ideas_market_potential_score ON ideas(market_potential_score DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_upvotes ON ideas(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_processed_at ON ideas(processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_source ON ideas(source);
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);

-- Full-text search index for title and description
CREATE INDEX IF NOT EXISTS idx_ideas_search ON ideas 
    USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(body_text, '')));

-- ============================================
-- SUBREDDITS TABLE
-- Tracks configured subreddits for fetching
-- ============================================
CREATE TABLE IF NOT EXISTS subreddits (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,                    -- Subreddit name without 'r/' prefix
    display_name TEXT NOT NULL,                   -- Display name with 'r/' prefix
    is_active BOOLEAN NOT NULL DEFAULT TRUE,      -- Whether to fetch from this subreddit
    last_fetched_at TIMESTAMPTZ,                  -- Last time posts were fetched
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default subreddits
INSERT INTO subreddits (name, display_name) VALUES
    ('startup', 'r/startup'),
    ('startupideas', 'r/startupideas'),
    ('Entrepreneur', 'r/Entrepreneur'),
    ('sideproject', 'r/sideproject'),
    ('businessideas', 'r/businessideas'),
    ('EntrepreneurRideAlong', 'r/EntrepreneurRideAlong'),
    ('saas', 'r/saas'),
    ('smallbusiness', 'r/smallbusiness')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- FETCH_LOGS TABLE
-- Tracks API fetch operations for rate limiting
-- ============================================
CREATE TABLE IF NOT EXISTS fetch_logs (
    id SERIAL PRIMARY KEY,
    fetch_type TEXT NOT NULL,                     -- 'reddit' or 'gemini'
    subreddit TEXT,                               -- Which subreddit was fetched (for reddit)
    posts_fetched INTEGER DEFAULT 0,              -- Number of posts fetched
    posts_processed INTEGER DEFAULT 0,            -- Number of posts processed by Gemini
    status TEXT NOT NULL,                         -- 'success', 'partial', 'error'
    error_message TEXT,                           -- Error details if failed
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fetch_logs_created_at ON fetch_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fetch_logs_status ON fetch_logs(status);

-- ============================================
-- USER_BOOKMARKS TABLE
-- Allows users to save favorite ideas
-- ============================================
CREATE TABLE IF NOT EXISTS user_bookmarks (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, idea_id)
);
COMMENT ON TABLE user_bookmarks IS 'User bookmarked/saved ideas';

CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_idea_id ON user_bookmarks(idea_id);

-- ============================================
-- IDEA_VOTES TABLE
-- Allows users to upvote/downvote ideas
-- ============================================
CREATE TABLE IF NOT EXISTS idea_votes (
    id SERIAL PRIMARY KEY,
    idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vote_type INTEGER NOT NULL CHECK (vote_type IN (1, -1)),  -- 1 = upvote, -1 = downvote
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(idea_id, user_id)  -- One vote per user per idea
);
COMMENT ON TABLE idea_votes IS 'User votes on ideas (upvote/downvote)';

CREATE INDEX IF NOT EXISTS idx_idea_votes_idea_id ON idea_votes(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_votes_user_id ON idea_votes(user_id);

-- ============================================
-- IDEA_COMMENTS TABLE
-- Allows users to comment on ideas
-- ============================================
CREATE TABLE IF NOT EXISTS idea_comments (
    id SERIAL PRIMARY KEY,
    idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
    parent_id INTEGER REFERENCES idea_comments(id) ON DELETE CASCADE,  -- For nested replies
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE idea_comments IS 'User comments on startup ideas';

CREATE INDEX IF NOT EXISTS idx_idea_comments_idea_id ON idea_comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_comments_user_id ON idea_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_idea_comments_parent_id ON idea_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_idea_comments_created_at ON idea_comments(created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on ideas table
DROP TRIGGER IF EXISTS trigger_ideas_updated_at ON ideas;
CREATE TRIGGER trigger_ideas_updated_at
    BEFORE UPDATE ON ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on profiles table
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on idea_comments table
DROP TRIGGER IF EXISTS trigger_idea_comments_updated_at ON idea_comments;
CREATE TRIGGER trigger_idea_comments_updated_at
    BEFORE UPDATE ON idea_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) for Supabase
-- ============================================

-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE subreddits ENABLE ROW LEVEL SECURITY;
ALTER TABLE fetch_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================
-- Anyone can view profiles (for displaying comment authors)
CREATE POLICY "Profiles are publicly readable"
    ON profiles FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Note: Service role (used for Clerk webhooks) bypasses RLS automatically
-- No explicit policy needed for service_role

-- ============================================
-- IDEAS POLICIES
-- ============================================
-- Public read access for published ideas (anyone can view)
CREATE POLICY "Published ideas are publicly readable"
    ON ideas FOR SELECT
    USING (status = 'published' OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Note: Service role (used for Reddit fetching) bypasses RLS automatically
-- No explicit policy needed for service_role

-- Authenticated users can create their own ideas
CREATE POLICY "Users can create own ideas"
    ON ideas FOR INSERT
    WITH CHECK (
        source = 'user' 
        AND user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );

-- Users can update their own ideas
CREATE POLICY "Users can update own ideas"
    ON ideas FOR UPDATE
    USING (
        source = 'user' 
        AND user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );

-- Users can delete their own ideas
CREATE POLICY "Users can delete own ideas"
    ON ideas FOR DELETE
    USING (
        source = 'user' 
        AND user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );

-- ============================================
-- SUBREDDITS POLICIES
-- ============================================
-- Public read access for subreddits
CREATE POLICY "Subreddits are publicly readable"
    ON subreddits FOR SELECT
    USING (true);

-- ============================================
-- USER_BOOKMARKS POLICIES
-- ============================================
-- Users can view their own bookmarks
CREATE POLICY "Users can view own bookmarks"
    ON user_bookmarks FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can create their own bookmarks
CREATE POLICY "Users can create own bookmarks"
    ON user_bookmarks FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
    ON user_bookmarks FOR DELETE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================
-- IDEA_VOTES POLICIES
-- ============================================
-- Anyone can view vote counts (aggregated)
CREATE POLICY "Votes are publicly readable"
    ON idea_votes FOR SELECT
    USING (true);

-- Authenticated users can create votes
CREATE POLICY "Authenticated users can vote"
    ON idea_votes FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their own votes (change vote type)
CREATE POLICY "Users can update own votes"
    ON idea_votes FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can delete their own votes (remove vote)
CREATE POLICY "Users can delete own votes"
    ON idea_votes FOR DELETE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================
-- IDEA_COMMENTS POLICIES
-- ============================================
-- Anyone can view comments (public)
CREATE POLICY "Comments are publicly readable"
    ON idea_comments FOR SELECT
    USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
    ON idea_comments FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
    ON idea_comments FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
    ON idea_comments FOR DELETE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================
-- VIEWS
-- ============================================

-- View for ideas with formatted data (includes both Reddit and user ideas)
CREATE OR REPLACE VIEW ideas_view
WITH (security_invoker = true) AS
SELECT
    i.id,
    i.title,
    i.original_title,
    i.description,
    LEFT(i.body_text, 500) AS body_preview,
    i.source,
    i.user_id,
    i.subreddit,
    i.post_url,
    i.thumbnail,
    i.market_potential_score,
    i.status,
    
    -- Reddit original metrics (only for Reddit posts)
    i.reddit_score,
    i.reddit_comments,
    i.reddit_author,
    
    -- Platform engagement metrics (for all posts)
    i.upvotes AS platform_upvotes,
    i.downvotes AS platform_downvotes,
    (i.upvotes - i.downvotes) AS platform_score,
    i.comments_count AS platform_comments,
    
    -- Source badge/label for UI
    CASE
        WHEN i.source = 'reddit' THEN 'From Reddit'
        ELSE 'Community'
    END AS source_label,
    
    -- Score label
    CASE
        WHEN i.market_potential_score >= 80 THEN 'Excellent'
        WHEN i.market_potential_score >= 60 THEN 'Good'
        WHEN i.market_potential_score >= 40 THEN 'Moderate'
        WHEN i.market_potential_score >= 20 THEN 'Low'
        WHEN i.market_potential_score IS NULL THEN 'Pending'
        ELSE 'Very Low'
    END AS score_label,
    
    -- Author display: profile name for user ideas, reddit_author for Reddit ideas
    CASE
        WHEN i.source = 'user' THEN COALESCE(p.username, p.first_name || ' ' || p.last_name, 'Anonymous')
        ELSE i.reddit_author
    END AS author_display,
    
    -- Author type for UI styling
    CASE
        WHEN i.source = 'user' THEN 'member'
        ELSE 'reddit'
    END AS author_type,
    
    p.image_url AS author_image,
    i.created_at,
    i.processed_at,
    
    -- Hot/trending score (platform engagement weighted by recency)
    -- Higher score = more recent + more engagement
    ROUND(
        (i.upvotes - i.downvotes + 1) / 
        POWER(EXTRACT(EPOCH FROM (NOW() - i.created_at)) / 3600 + 2, 1.5)::numeric * 1000
    , 2) AS trending_score
    
FROM ideas i
LEFT JOIN profiles p ON i.user_id = p.id
WHERE i.status = 'published'
ORDER BY i.created_at DESC;

-- View for user's own ideas (including drafts)
CREATE OR REPLACE VIEW my_ideas_view
WITH (security_invoker = true) AS
SELECT
    i.id,
    i.title,
    i.description,
    LEFT(i.body_text, 500) AS body_preview,
    i.user_id,
    i.upvotes AS platform_upvotes,
    i.downvotes AS platform_downvotes,
    (i.upvotes - i.downvotes) AS platform_score,
    i.comments_count AS platform_comments,
    i.thumbnail,
    i.market_potential_score,
    i.status,
    CASE
        WHEN i.market_potential_score >= 80 THEN 'Excellent'
        WHEN i.market_potential_score >= 60 THEN 'Good'
        WHEN i.market_potential_score >= 40 THEN 'Moderate'
        WHEN i.market_potential_score >= 20 THEN 'Low'
        WHEN i.market_potential_score IS NULL THEN 'Pending'
        ELSE 'Very Low'
    END AS score_label,
    CASE
        WHEN i.status = 'draft' THEN 'Draft'
        WHEN i.status = 'published' THEN 'Published'
        WHEN i.status = 'archived' THEN 'Archived'
    END AS status_label,
    i.created_at,
    i.processed_at,
    i.updated_at
FROM ideas i
WHERE i.source = 'user'
ORDER BY i.updated_at DESC;

-- View for user activity summary (for profile page)
CREATE OR REPLACE VIEW user_activity_summary
WITH (security_invoker = true) AS
SELECT
    p.id AS user_id,
    p.username,
    p.first_name,
    p.last_name,
    p.image_url,
    -- Ideas created
    (SELECT COUNT(*) FROM ideas WHERE user_id = p.id AND source = 'user') AS ideas_created,
    -- Votes given
    (SELECT COUNT(*) FROM idea_votes WHERE user_id = p.id AND vote_type = 1) AS upvotes_given,
    (SELECT COUNT(*) FROM idea_votes WHERE user_id = p.id AND vote_type = -1) AS downvotes_given,
    -- Comments made
    (SELECT COUNT(*) FROM idea_comments WHERE user_id = p.id) AS comments_made,
    -- Bookmarks
    (SELECT COUNT(*) FROM user_bookmarks WHERE user_id = p.id) AS bookmarks_count,
    -- Engagement received on user's ideas
    (SELECT COALESCE(SUM(upvotes), 0) FROM ideas WHERE user_id = p.id) AS total_upvotes_received,
    (SELECT COALESCE(SUM(comments_count), 0) FROM ideas WHERE user_id = p.id) AS total_comments_received,
    p.created_at AS member_since
FROM profiles p;

-- View for user's voted ideas (upvoted/downvoted)
CREATE OR REPLACE VIEW user_voted_ideas
WITH (security_invoker = true) AS
SELECT
    v.user_id,
    v.idea_id,
    v.vote_type,
    CASE WHEN v.vote_type = 1 THEN 'upvoted' ELSE 'downvoted' END AS vote_label,
    v.created_at AS voted_at,
    i.title,
    i.description,
    i.source,
    i.market_potential_score,
    i.status
FROM idea_votes v
JOIN ideas i ON v.idea_id = i.id
WHERE i.status = 'published'
ORDER BY v.created_at DESC;

-- View for user's commented ideas
CREATE OR REPLACE VIEW user_commented_ideas
WITH (security_invoker = true) AS
SELECT DISTINCT ON (c.user_id, c.idea_id)
    c.user_id,
    c.idea_id,
    i.title,
    i.description,
    i.source,
    i.market_potential_score,
    (SELECT COUNT(*) FROM idea_comments WHERE idea_id = c.idea_id AND user_id = c.user_id) AS user_comment_count,
    (SELECT MAX(created_at) FROM idea_comments WHERE idea_id = c.idea_id AND user_id = c.user_id) AS last_commented_at
FROM idea_comments c
JOIN ideas i ON c.idea_id = i.id
WHERE i.status = 'published'
ORDER BY c.user_id, c.idea_id, c.created_at DESC;

-- View for user's bookmarked ideas
CREATE OR REPLACE VIEW user_bookmarked_ideas
WITH (security_invoker = true) AS
SELECT
    b.user_id,
    b.idea_id,
    b.created_at AS bookmarked_at,
    i.title,
    i.description,
    i.source,
    i.market_potential_score,
    i.upvotes AS platform_upvotes,
    i.comments_count AS platform_comments,
    CASE
        WHEN i.source = 'reddit' THEN 'From Reddit'
        ELSE 'Community'
    END AS source_label
FROM user_bookmarks b
JOIN ideas i ON b.idea_id = i.id
WHERE i.status = 'published'
ORDER BY b.created_at DESC;

-- View for comments with user profile info
CREATE OR REPLACE VIEW comments_with_profiles
WITH (security_invoker = true) AS
SELECT
    c.id,
    c.idea_id,
    c.user_id,
    c.content,
    c.parent_id,
    c.created_at,
    c.updated_at,
    p.username,
    p.first_name,
    p.last_name,
    p.image_url,
    COALESCE(p.username, p.first_name || ' ' || p.last_name, 'Anonymous') AS display_name
FROM idea_comments c
LEFT JOIN profiles p ON c.user_id = p.id
ORDER BY c.created_at DESC;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get comment count for an idea
CREATE OR REPLACE FUNCTION get_idea_comment_count(p_idea_id TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM idea_comments WHERE idea_id = p_idea_id);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if user has bookmarked an idea
CREATE OR REPLACE FUNCTION is_idea_bookmarked(p_idea_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_bookmarks 
        WHERE idea_id = p_idea_id AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get user's vote on an idea (-1, 0, or 1)
CREATE OR REPLACE FUNCTION get_user_vote(p_idea_id TEXT, p_user_id TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT vote_type FROM idea_votes WHERE idea_id = p_idea_id AND user_id = p_user_id),
        0
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update idea vote counts (called by trigger)
CREATE OR REPLACE FUNCTION update_idea_votes()
RETURNS TRIGGER AS $$
DECLARE
    target_idea_id TEXT;
BEGIN
    -- Determine which idea to update
    IF TG_OP = 'DELETE' THEN
        target_idea_id := OLD.idea_id;
    ELSE
        target_idea_id := NEW.idea_id;
    END IF;
    
    -- Update both upvotes and downvotes counts
    UPDATE ideas 
    SET 
        upvotes = (SELECT COUNT(*) FROM idea_votes WHERE idea_id = target_idea_id AND vote_type = 1),
        downvotes = (SELECT COUNT(*) FROM idea_votes WHERE idea_id = target_idea_id AND vote_type = -1)
    WHERE id = target_idea_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update vote counts when votes change
DROP TRIGGER IF EXISTS trigger_update_idea_votes ON idea_votes;
CREATE TRIGGER trigger_update_idea_votes
    AFTER INSERT OR UPDATE OR DELETE ON idea_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_idea_votes();

-- Function to update idea comments count (called by trigger)
CREATE OR REPLACE FUNCTION update_idea_comments_count()
RETURNS TRIGGER AS $$
DECLARE
    target_idea_id TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_idea_id := OLD.idea_id;
    ELSE
        target_idea_id := NEW.idea_id;
    END IF;
    
    UPDATE ideas 
    SET comments_count = (SELECT COUNT(*) FROM idea_comments WHERE idea_id = target_idea_id)
    WHERE id = target_idea_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update comments count when comments change
DROP TRIGGER IF EXISTS trigger_update_idea_comments_count ON idea_comments;
CREATE TRIGGER trigger_update_idea_comments_count
    AFTER INSERT OR DELETE ON idea_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_idea_comments_count();

-- Function to generate short ID for user ideas (8 chars like Reddit)
CREATE OR REPLACE FUNCTION generate_user_idea_id()
RETURNS TEXT AS $$
BEGIN
    -- Generate 8 character alphanumeric ID with 'u' prefix
    RETURN 'u' || substr(md5(gen_random_uuid()::text), 1, 7);
END;
$$ LANGUAGE plpgsql;
