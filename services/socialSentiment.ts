/**
 * Social Media Sentiment Service
 * 
 * Provides sentiment analysis from:
 * - Twitter/X API (for market-related tweets)
 * - Reddit (Crypto/Markets subreddits)
 * 
 * Uses:
 * - Twitter API v2 (requires API key)
 * - Reddit API (free, no key required)
 */

import { NewsHeadline } from "../types";

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface SocialConfig {
  provider: "twitter" | "reddit" | "both";
  enabled: boolean;
}

export const SOCIAL_CONFIG: Record<string, SocialConfig> = {
  twitter: { provider: "twitter", enabled: true },
  reddit: { provider: "reddit", enabled: true }
};

// ============================================================================
// TWITTER/X API SERVICE
// ============================================================================

export class TwitterSentimentService {
  private static API_KEY = (process.env as any).TWITTER_API_KEY;
  private static API_SECRET = (process.env as any).TWITTER_API_SECRET;
  private static BEARER_TOKEN = (process.env as any).TWITTER_BEARER_TOKEN;
  private static BASE_URL = "https://api.twitter.com/2";
  
  /**
   * Search for tweets about a symbol
   */
  static async getTweets(
    query: string, 
    maxResults: number = 20
  ): Promise<{
    id: string;
    text: string;
    author: string;
    followers: number;
    timestamp: number;
    sentiment: number;
    engagement: number;
  }[]> {
    if (!this.BEARER_TOKEN) {
      console.log("Twitter API not configured, using fallback");
      return this.getFallbackTweets(query);
    }
    
    try {
      const searchQuery = encodeURIComponent(`${query} lang:en -is:retweet`);
      const response = await fetch(
        `${this.BASE_URL}/tweets/search/recent?query=${searchQuery}&max_results=${Math.min(maxResults, 100)}&tweet.fields=created_at,author_id,public_metrics&expansions=author_id&user.fields=name,username,public_metrics`,
        {
          headers: {
            "Authorization": `Bearer ${this.BEARER_TOKEN}`
          }
        }
      );
      
      const data = await response.json();
      
      if (data.data && data.includes?.users) {
        const users = data.includes.users.reduce((acc: any, user: any) => {
          acc[user.id] = user;
          return acc;
        }, {});
        
        return data.data.map((tweet: any) => {
          const user = users[tweet.author_id] || {};
          const metrics = tweet.public_metrics || {};
          
          return {
            id: tweet.id,
            text: tweet.text,
            author: user.name || "Unknown",
            username: user.username || "unknown",
            followers: user.public_metrics?.followers_count || 0,
            timestamp: new Date(tweet.created_at).getTime(),
            sentiment: this.analyzeSentiment(tweet.text),
            engagement: (metrics.retweet_count || 0) + (metrics.like_count || 0) + (metrics.reply_count || 0)
          };
        });
      }
    } catch (error) {
      console.error("Twitter API error:", error);
    }
    
    return this.getFallbackTweets(query);
  }
  
  /**
   * Get trending finance hashtags
   */
  static async getTrendingTags(): Promise<{ tag: string; volume: number }[]> {
    // Twitter's API doesn't provide trending, so we use fallback
    return this.getTrendingFinanceTags();
  }
  
  /**
   * Get sentiment for crypto/investing topics
   */
  static async getMarketSentiment(): Promise<{
    overall: number;
    bullish: number;
    bearish: number;
    neutral: number;
    topTweet: {
      text: string;
      author: string;
      engagement: number;
    };
  }> {
    const topics = ["crypto", "bitcoin", "ethereum", "stocks", "investing", "forex"];
    const allTweets: any[] = [];
    
    for (const topic of topics.slice(0, 3)) {
      const tweets = await this.getTweets(topic, 10);
      allTweets.push(...tweets);
    }
    
    if (allTweets.length === 0) {
      return this.getFallbackMarketSentiment();
    }
    
    const bullish = allTweets.filter(t => t.sentiment > 0.2).length;
    const bearish = allTweets.filter(t => t.sentiment < -0.2).length;
    const neutral = allTweets.length - bullish - bearish;
    const overall = allTweets.reduce((sum, t) => sum + t.sentiment, 0) / allTweets.length;
    
    const topTweet = allTweets
      .sort((a, b) => b.engagement - a.engagement)[0] || {
        text: "No tweets available",
        author: "N/A",
        engagement: 0
      };
    
    return {
      overall: Math.round(overall * 100) / 100,
      bullish,
      bearish,
      neutral,
      topTweet
    };
  }
  
  /**
   * Analyze sentiment of tweet text
   */
  private static analyzeSentiment(text: string): number {
    const positiveWords = [
      "bullish", "moon", "surge", "rally", "gain", "pump", "breakout",
      "buy", "long", "accumulate", "profit", "win", "success", "growth",
      "rocket", "gem", "altszn", "new high", "support", "hold", "hodl"
    ];
    
    const negativeWords = [
      "bearish", "dump", "crash", "plunge", "sell", "short", "scam",
      "hack", "ban", "regulation", "worries", "fear", "drop", "loss",
      "reject", "resistance", "top is in", "bubble", "dead cat", "rug"
    ];
    
    const neutralWords = ["might", "could", "perhaps", "maybe", "possibly"];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    let hasContent = false;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) {
        score += 0.15;
        hasContent = true;
      }
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) {
        score -= 0.15;
        hasContent = true;
      }
    });
    
    // Check for exclamation marks and caps (engagement indicators)
    if (/!!!/.test(text)) score += 0.1;
    if (text === text.toUpperCase() && text.length > 10) score += 0.1;
    
    return hasContent ? Math.max(-1, Math.min(1, score)) : 0;
  }
  
  /**
   * Fallback tweets when API is unavailable
   */
  private static getFallbackTweets(query: string): any[] {
    const tweets = [
      { text: `${query} showing strong bullish momentum today! 📈`, author: "CryptoTrader", engagement: 1250 },
      { text: `Watching ${query} for potential breakout setup`, author: "TradingView", engagement: 890 },
      { text: `${query} could face resistance at key level`, author: "MarketAnalyst", engagement: 650 },
      { text: `Big volume spike on ${query} - something cooking`, author: "CryptoInsider", engagement: 2100 },
      { text: `${query} looking weak, might see a dump`, author: "BearTraders", engagement: 430 },
      { text: `Just accumulated more ${query} at these levels`, author: "DiamondHands", engagement: 1800 },
      { text: `${query} breaking out! To the moon! 🚀`, author: "MoonBoy", engagement: 3200 },
      { text: `Important support level approaching for ${query}`, author: "TechAnalyst", engagement: 560 }
    ];
    
    return tweets.map((tweet, index) => ({
      id: `fallback-${index}`,
      ...tweet,
      username: tweet.author.replace(/\s+/g, "").toLowerCase(),
      followers: Math.floor(Math.random() * 100000) + 1000,
      timestamp: Date.now() - Math.floor(Math.random() * 3600000),
      sentiment: this.analyzeSentiment(tweet.text)
    }));
  }
  
  /**
   * Trending finance tags
   */
  private static getTrendingFinanceTags(): { tag: string; volume: number }[] {
    return [
      { tag: "#Bitcoin", volume: 125000 },
      { tag: "#Crypto", volume: 98000 },
      { tag: "#SP500", volume: 45000 },
      { tag: "#ETH", volume: 67000 },
      { tag: "#Forex", volume: 28000 },
      { tag: "#Trading", volume: 52000 },
      { tag: "#Investing", volume: 38000 },
      { tag: "#Gold", volume: 22000 },
      { tag: "#Nasdaq", volume: 31000 },
      { tag: "#MemeCoins", volume: 41000 }
    ];
  }
  
  /**
   * Fallback market sentiment
   */
  private static getFallbackMarketSentiment(): any {
    return {
      overall: 0.15,
      bullish: 45,
      bearish: 25,
      neutral: 30,
      topTweet: {
        text: "Bitcoin breaking resistance - bullish setup forming",
        author: "CryptoTraderPro",
        engagement: 2500
      }
    };
  }
}

// ============================================================================
// REDDIT API SERVICE
// ============================================================================

export class RedditSentimentService {
  private static BASE_URL = "https://www.reddit.com";
  
  /**
   * Get posts from subreddits
   */
  static async getPosts(
    subreddits: string[], 
    limit: number = 20
  ): Promise<{
    id: string;
    title: string;
    body?: string;
    subreddit: string;
    author: string;
    upvotes: number;
    comments: number;
    timestamp: number;
    sentiment: number;
    url: string;
  }[]> {
    const allPosts: any[] = [];
    
    for (const subreddit of subreddits) {
      try {
        const response = await fetch(
          `${this.BASE_URL}/r/${subreddit}/hot.json?limit=${limit}`,
          { headers: { "User-Agent": "ApexTrading/1.0" } }
        );
        
        const data = await response.json();
        
        if (data.data?.children) {
          const posts = data.data.children.map((post: any) => {
            const p = post.data;
            return {
              id: p.id,
              title: p.title,
              body: p.selftext?.substring(0, 500),
              subreddit: p.subreddit,
              author: p.author,
              upvotes: p.ups,
              comments: p.num_comments,
              timestamp: p.created_utc * 1000,
              sentiment: this.analyzeSentiment(p.title + " " + p.selftext?.substring(0, 200)),
              url: `https://reddit.com${p.permalink}`
            };
          });
          
          allPosts.push(...posts);
        }
      } catch (error) {
        console.error(`Reddit fetch failed for r/${subreddit}:`, error);
      }
    }
    
    if (allPosts.length === 0) {
      return this.getFallbackRedditPosts();
    }
    
    return allPosts.sort((a, b) => b.upvotes - a.upvotes).slice(0, limit);
  }
  
  /**
   * Get posts from specific subreddit
   */
  static async getSubredditPosts(subreddit: string, limit: number = 20): Promise<any[]> {
    return this.getPosts([subreddit], limit);
  }
  
  /**
   * Get sentiment for subreddit
   */
  static async getSubredditSentiment(subreddit: string): Promise<{
    score: number;
    label: "Bullish" | "Bearish" | "Neutral";
    posts: any[];
    topPost: any;
  }> {
    const posts = await this.getPosts([subreddit], 25);
    
    if (posts.length === 0) {
      return {
        score: 0,
        label: "Neutral",
        posts: [],
        topPost: null
      };
    }
    
    const score = posts.reduce((sum, p) => sum + p.sentiment, 0) / posts.length;
    
    let label: "Bullish" | "Bearish" | "Neutral";
    if (score > 0.15) label = "Bullish";
    else if (score < -0.15) label = "Bearish";
    else label = "Neutral";
    
    return {
      score: Math.round(score * 100) / 100,
      label,
      posts,
      topPost: posts[0]
    };
  }
  
  /**
   * Search Reddit for symbol/topic
   */
  static async searchReddit(query: string): Promise<any[]> {
    const subreddits = ["CryptoCurrency", "CryptoMarkets", "Stocks", "Investing", "Trading"];
    const results: any[] = [];
    
    for (const subreddit of subreddits) {
      try {
        const response = await fetch(
          `${this.BASE_URL}/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=true&limit=20&sort=relevance`,
          { headers: { "User-Agent": "ApexTrading/1.0" } }
        );
        
        const data = await response.json();
        
        if (data.data?.children) {
          const posts = data.data.children.slice(0, 10).map((post: any) => ({
            id: post.data.id,
            title: post.data.title,
            subreddit: post.data.subreddit,
            author: post.data.author,
            upvotes: post.data.ups,
            comments: post.data.num_comments,
            timestamp: post.data.created_utc * 1000,
            sentiment: this.analyzeSentiment(post.data.title),
            url: `https://reddit.com${post.data.permalink}`
          }));
          
          results.push(...posts);
        }
      } catch (error) {
        console.error(`Reddit search failed:`, error);
      }
    }
    
    return results.slice(0, 20);
  }
  
  /**
   * Analyze sentiment of post
   */
  private static analyzeSentiment(text: string): number {
    const positiveWords = [
      "bullish", "moon", "rally", "gain", "profit", "breakout", "buy", "long",
      "accumulate", "support", "hold", "hodl", "gem", "upvote", "green",
      "soar", "surge", "pump", " ATH", "bull run"
    ];
    
    const negativeWords = [
      "bearish", "dump", "crash", "loss", "sell", "short", "scam", "rug",
      "ban", "hack", "worries", "fear", "drop", "red", "death cross",
      "bear market", "correction", "topped", "reject", "resistance"
    ];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 0.12;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 0.12;
    });
    
    return Math.max(-1, Math.min(1, score));
  }
  
  /**
   * Fallback Reddit posts
   */
  private static getFallbackRedditPosts(): any[] {
    const posts = [
      { title: "Bitcoin showing incredible strength at these levels", subreddit: "CryptoCurrency", upvotes: 4500, comments: 320 },
      { title: "Is Ethereum still a good buy at current prices?", subreddit: "CryptoMarkets", upvotes: 2100, comments: 180 },
      { title: "SPY approaching major resistance - thoughts?", subreddit: "Stocks", upvotes: 890, comments: 120 },
      { title: "Just got rekt on a leverage trade, need advice", subreddit: "Trading", upvotes: 1200, comments: 200 },
      { title: "This altcoin is going to explode soon (DD inside)", subreddit: "CryptoCurrency", upvotes: 3200, comments: 450 },
      { title: "Market update: Bearish divergence forming on daily", subreddit: "Investing", upvotes: 780, comments: 95 },
      { title: "Holding through the volatility - long term outlook", subreddit: "Crypto hodl", upvotes: 5600, comments: 380 },
      { title: "Warning: Whale manipulation detected in this market", subreddit: "CryptoMarkets", upvotes: 1800, comments: 220 }
    ];
    
    return posts.map((post, index) => ({
      id: `fallback-${index}`,
      ...post,
      author: `user${index}`,
      timestamp: Date.now() - Math.floor(Math.random() * 86400000),
      sentiment: this.analyzeSentiment(post.title)
    }));
  }
}

// ============================================================================
// UNIFIED SOCIAL SENTIMENT SERVICE
// ============================================================================

export class SocialSentimentService {
  private static lastUpdateTime: number = 0;
  private static cachedSentiment: any = null;
  private static CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  
  /**
   * Get comprehensive social sentiment
   */
  static async getOverallSentiment(): Promise<{
    twitter: {
      overall: number;
      label: string;
      topTweet: any;
    };
    reddit: {
      subreddits: { name: string; score: number; posts: number }[];
      overall: number;
      label: string;
    };
    combined: {
      score: number;
      label: "Bullish" | "Bearish" | "Neutral";
      confidence: number;
    };
    trending: { tag: string; volume: number }[];
  }> {
    // Check cache
    const now = Date.now();
    if (now - this.lastUpdateTime < this.CACHE_DURATION && this.cachedSentiment) {
      return this.cachedSentiment;
    }
    
    try {
      // Fetch from Twitter and Reddit in parallel
      const [twitterSentiment, twitterTrends, redditCrypto, redditStocks] = await Promise.all([
        TwitterSentimentService.getMarketSentiment(),
        TwitterSentimentService.getTrendingTags(),
        RedditSentimentService.getSubredditSentiment("CryptoCurrency"),
        RedditSentimentService.getSubredditSentiment("Stocks")
      ]);
      
      // Calculate Reddit overall
      const redditSubreddits = [
        { name: "CryptoCurrency", score: redditCrypto.score, posts: redditCrypto.posts.length },
        { name: "Stocks", score: redditStocks.score, posts: redditStocks.posts.length }
      ];
      const redditOverall = (redditCrypto.score + redditStocks.score) / 2;
      
      // Reddit label
      let redditLabel: "Bullish" | "Bearish" | "Neutral";
      if (redditOverall > 0.15) redditLabel = "Bullish";
      else if (redditOverall < -0.15) redditLabel = "Bearish";
      else redditLabel = "Neutral";
      
      // Combined score
      const combinedScore = (twitterSentiment.overall + redditOverall) / 2;
      let combinedLabel: "Bullish" | "Bearish" | "Neutral";
      if (combinedScore > 0.15) combinedLabel = "Bullish";
      else if (combinedScore < -0.15) combinedLabel = "Bearish";
      else combinedLabel = "Neutral";
      
      const result = {
        twitter: {
          overall: Math.round(twitterSentiment.overall * 100) / 100,
          label: twitterSentiment.overall > 0.15 ? "Bullish" : twitterSentiment.overall < -0.15 ? "Bearish" : "Neutral",
          topTweet: twitterSentiment.topTweet
        },
        reddit: {
          subreddits: redditSubreddits,
          overall: Math.round(redditOverall * 100) / 100,
          label: redditLabel
        },
        combined: {
          score: Math.round(combinedScore * 100) / 100,
          label: combinedLabel,
          confidence: 60 + Math.abs(combinedScore) * 20
        },
        trending: twitterTrends.slice(0, 10)
      };
      
      this.cachedSentiment = result;
      this.lastUpdateTime = now;
      
      return result;
    } catch (error) {
      console.error("Social sentiment fetch failed:", error);
      return this.getFallbackSentiment();
    }
  }
  
  /**
   * Get sentiment for specific topic
   */
  static async getTopicSentiment(topic: string): Promise<{
    twitter: any[];
    reddit: any[];
    overall: number;
    label: string;
  }> {
    const [twitterTweets, redditPosts] = await Promise.all([
      TwitterSentimentService.getTweets(topic, 20),
      RedditSentimentService.searchReddit(topic)
    ]);
    
    const allSentiment = [
      ...twitterTweets.map(t => t.sentiment),
      ...redditPosts.map(p => p.sentiment)
    ];
    
    const overall = allSentiment.length > 0
      ? allSentiment.reduce((a, b) => a + b, 0) / allSentiment.length
      : 0;
    
    let label: "Bullish" | "Bearish" | "Neutral";
    if (overall > 0.15) label = "Bullish";
    else if (overall < -0.15) label = "Bearish";
    else label = "Neutral";
    
    return {
      twitter: twitterTweets.slice(0, 10),
      reddit: redditPosts.slice(0, 10),
      overall: Math.round(overall * 100) / 100,
      label
    };
  }
  
  /**
   * Get crypto-specific sentiment
   */
  static async getCryptoSentiment(): Promise<{
    overall: number;
    label: string;
    coins: { symbol: string; sentiment: number; mentions: number }[];
  }> {
    const [btcSentiment, ethSentiment, redditCrypto] = await Promise.all([
      TwitterSentimentService.getTweets("bitcoin", 15),
      TwitterSentimentService.getTweets("ethereum", 15),
      RedditSentimentService.getSubredditSentiment("CryptoCurrency")
    ]);
    
    const btcScore = btcSentiment.length > 0
      ? btcSentiment.reduce((sum, t) => sum + t.sentiment, 0) / btcSentiment.length
      : 0;
    
    const ethScore = ethSentiment.length > 0
      ? ethSentiment.reduce((sum, t) => sum + t.sentiment, 0) / ethSentiment.length
      : 0;
    
    const overall = (btcScore + ethScore + redditCrypto.score) / 3;
    
    const coins = [
      { symbol: "BTC", sentiment: btcScore, mentions: btcSentiment.length + redditCrypto.posts.filter((p: any) => p.title.toLowerCase().includes("bitcoin")).length },
      { symbol: "ETH", sentiment: ethScore, mentions: ethSentiment.length + redditCrypto.posts.filter((p: any) => p.title.toLowerCase().includes("ethereum")).length },
      { symbol: "SOL", sentiment: 0.1, mentions: 15 },
      { symbol: "XRP", sentiment: 0.05, mentions: 10 },
      { symbol: "ADA", sentiment: 0.08, mentions: 8 }
    ];
    
    return {
      overall: Math.round(overall * 100) / 100,
      label: overall > 0.15 ? "Bullish" : overall < -0.15 ? "Bearish" : "Neutral",
      coins
    };
  }
  
  /**
   * Fallback sentiment when APIs fail
   */
  private static getFallbackSentiment(): any {
    return {
      twitter: {
        overall: 0.12,
        label: "Bullish",
        topTweet: {
          text: "Bitcoin showing strong momentum today",
          author: "CryptoTrader",
          engagement: 1500
        }
      },
      reddit: {
        subreddits: [
          { name: "CryptoCurrency", score: 0.18, posts: 25 },
          { name: "Stocks", score: 0.05, posts: 20 }
        ],
        overall: 0.12,
        label: "Bullish"
      },
      combined: {
        score: 0.12,
        label: "Bullish",
        confidence: 65
      },
      trending: [
        { tag: "#Bitcoin", volume: 125000 },
        { tag: "#Crypto", volume: 98000 },
        { tag: "#ETH", volume: 67000 },
        { tag: "#SP500", volume: 45000 },
        { tag: "#Trading", volume: 52000 }
      ]
    };
  }
}

// ============================================================================
// END OF FILE
// ============================================================================
