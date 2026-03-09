-- ============================================
-- 星豆 StarBean Supabase 数据库 Schema
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL DEFAULT '星豆用户',
    avatar_url TEXT DEFAULT '',
    star_beans INTEGER DEFAULT 1250,
    fragments INTEGER DEFAULT 25,
    digital_avatar_generated BOOLEAN DEFAULT FALSE,
    pulls_since_last_ssr INTEGER DEFAULT 0,
    total_pulls INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 艺人表
CREATE TABLE IF NOT EXISTS artists (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    fans_count TEXT DEFAULT '0',
    digital_avatar_url TEXT DEFAULT '',
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 卡池模板表
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    series TEXT DEFAULT '',
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    artist_id TEXT REFERENCES artists(id),
    artist_ref_images TEXT[] DEFAULT '{}',
    template_prompt TEXT NOT NULL DEFAULT '',
    rarity TEXT DEFAULT 'R',
    issue_count TEXT DEFAULT '0',
    rarity_rates JSONB DEFAULT '{"N":"70%","R":"20%","SR":"8%","SSR":"2%"}',
    tags TEXT[] DEFAULT '{}',
    rarity_color TEXT DEFAULT 'text-blue-500',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户卡牌表
CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('N', 'R', 'SR', 'SSR')),
    image_url TEXT DEFAULT '',
    artist_id TEXT DEFAULT '',
    series TEXT DEFAULT '',
    description TEXT DEFAULT '',
    obtained_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nanobanana 提示词模板表
CREATE TABLE IF NOT EXISTS prompt_templates (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    rarity TEXT NOT NULL CHECK (rarity IN ('N', 'R', 'SR', 'SSR')),
    name TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 社区帖子表
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    image_url TEXT DEFAULT '',
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    location TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_templates_artist_id ON templates(artist_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_rarity ON prompt_templates(rarity);

-- RLS 策略（开发阶段暂时全开放）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 允许通过 service_role key 全量访问
CREATE POLICY "Allow all via service role" ON users FOR ALL USING (true);
CREATE POLICY "Allow all via service role" ON artists FOR ALL USING (true);
CREATE POLICY "Allow all via service role" ON templates FOR ALL USING (true);
CREATE POLICY "Allow all via service role" ON cards FOR ALL USING (true);
CREATE POLICY "Allow all via service role" ON prompt_templates FOR ALL USING (true);
CREATE POLICY "Allow all via service role" ON posts FOR ALL USING (true);
CREATE POLICY "Allow all via service role" ON comments FOR ALL USING (true);
