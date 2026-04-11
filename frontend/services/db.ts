
import { Post, User, BadgeTier, Comment, ReportType } from '../types';

const API_BASE = '/api';
const SESSION_KEY = 'storyverse_session';

const MOCK_POSTS: Post[] = [
  {
    id: 'mock-1',
    userId: 'system',
    username: 'storyverse_guide',
    title: 'Welcome to the Verse',
    content: '<p>This is your space to share stories that matter. Connect your MongoDB backend to start saving your own narratives and interacting with the community.</p><p>StoryVerse supports rich text, real-time engagement, and a dynamic badge system.</p>',
    likes: 42,
    likedBy: [],
    shares: 12,
    createdAt: new Date().toISOString(),
    userAvatar: 'https://picsum.photos/seed/guide/100',
    comments: [
      { id: 'c1', userId: 'u1', username: 'explorer', content: 'Excited to be here!', createdAt: new Date().toISOString() }
    ]
  },
  {
    id: 'mock-2',
    userId: 'system',
    username: 'creative_soul',
    title: 'The Art of Digital Storytelling',
    content: '<p>In the digital age, stories are no longer just text on a page. They are living, breathing entities that evolve with every like, comment, and share.</p><p>Use the AI assistant to help you find the right words when you get stuck.</p>',
    likes: 88,
    likedBy: [],
    shares: 24,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    userAvatar: 'https://picsum.photos/seed/soul/100',
    comments: []
  }
];

export const getBadge = (likes: number): BadgeTier => {
  if (likes >= 500) return BadgeTier.PLATINUM;
  if (likes >= 100) return BadgeTier.GOLD;
  if (likes >= 25) return BadgeTier.SILVER;
  if (likes >= 5) return BadgeTier.BRONZE;
  return BadgeTier.NOVICE;
};

export const db = {
  // --- Auth & Identity ---
  async sendRegistrationOtp(email: string): Promise<{ success: boolean, message?: string, error?: string }> {
    const lowerEmail = email.toLowerCase().trim();
    try {
      const response = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lowerEmail })
      });
      const result = await response.json();
      if (!response.ok || !result.success) return { success: false, error: result.error || 'Failed to send OTP' };
      return { success: true, message: result.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async register(username: string, email: string, password: string, otp: string): Promise<{ success: boolean, user?: User, error?: string }> {
    const lowerEmail = email.toLowerCase().trim();
    if (!lowerEmail.endsWith('@gmail.com')) {
      return { success: false, error: 'Registration restricted to @gmail.com addresses only.' };
    }
    
    if (!otp) {
      return { success: false, error: 'OTP is required.' };
    }
    
    try {
      const userId = Math.random().toString(36).substr(2, 9);
      const userPayload = {
        id: userId,
        username: username.toLowerCase().trim(),
        email: lowerEmail,
        password: password,
        otp: otp,
        avatar: `https://picsum.photos/seed/${username}/100`,
        bio: '',
        bookmarks: [],
        blocked_users: [],
        total_likes: 0,
        badge: BadgeTier.NOVICE,
        report_count: 0
      };
      
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPayload)
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          return { success: false, error: errorData.error || `Server error: ${response.status}` };
        } catch {
          return { success: false, error: `Server error: ${response.status}` };
        }
      }
      const result = await response.json();
      if (!result.success) return { success: false, error: result.error };

      const user: User = {
        id: userId,
        username: userPayload.username,
        email: userPayload.email,
        avatar: userPayload.avatar,
        bio: '',
        bookmarks: [],
        blockedUsers: [],
        totalLikes: 0,
        badge: BadgeTier.NOVICE,
        followerCount: 0,
        followingCount: 0,
        reportCount: 0,
        settings: { showReportCount: true, showStats: true }
      };
      
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return { success: true, user };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async login(identifier: string, password: string, method: 'username' | 'email'): Promise<{ success: boolean, user?: User, error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, method })
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          return { success: false, error: errorData.error || `Server error: ${response.status}` };
        } catch {
          return { success: false, error: `Server error: ${response.status}` };
        }
      }
      const result = await response.json();
      if (!result.success) return { success: false, error: result.error };
      
      const user = await this.refreshUser(result.user.id);
      return user ? { success: true, user } : { success: false, error: 'Session error.' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async signInWithGoogle(token: string): Promise<{ success: boolean, user?: User, error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          return { success: false, error: errorData.error || `Server error: ${response.status}` };
        } catch {
          return { success: false, error: `Server error: ${response.status}` };
        }
      }
      
      const result = await response.json();
      if (!result.success) return { success: false, error: result.error };
      
      const user = await this.refreshUser(result.user.id);
      return user ? { success: true, user } : { success: false, error: 'Session error.' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async updateUserProfile(userId: string, data: { username?: string; avatar?: string; bio?: string }): Promise<User | null> {
    if (!userId) return null;
    try {
      const updatePayload: any = {};
      if (data.username !== undefined) updatePayload.username = data.username.toLowerCase();
      if (data.avatar !== undefined) updatePayload.avatar = data.avatar;
      if (data.bio !== undefined) updatePayload.bio = data.bio;

      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) return null;

      if (data.username || data.avatar) {
        // In a real app, the backend should handle cascading updates
        // For now, we'll assume the backend handles it or we'd need more endpoints
      }

      return await this.refreshUser(userId);
    } catch (err) {
      return null;
    }
  },

  // --- Blocking System ---
  async blockUser(userId: string, targetId: string): Promise<User | null> {
    if (!userId || !targetId) return null;
    try {
      const user = await this.getUserById(userId);
      if (!user) return null;
      
      let blockedList = user.blockedUsers || [];
      if (!blockedList.includes(targetId)) {
        blockedList = [...blockedList, targetId];
        const response = await fetch(`${API_BASE}/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blocked_users: blockedList })
        });
        if (!response.ok) return null;
      }
      return await this.refreshUser(userId);
    } catch (err) {
      console.error("blockUser failed:", err);
      return null;
    }
  },

  async unblockUser(userId: string, targetId: string): Promise<User | null> {
    if (!userId || !targetId) return null;
    try {
      const user = await this.getUserById(userId);
      if (!user) return null;
      
      let blockedList = user.blockedUsers || [];
      const newBlockedList = blockedList.filter((id: string) => id !== targetId);
      
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked_users: newBlockedList })
      });
      if (!response.ok) return null;
      
      return await this.refreshUser(userId);
    } catch (err) {
      console.error("unblockUser failed:", err);
      return null;
    }
  },

  // --- Posts & Content ---
  async checkDBStatus(): Promise<{ connected: boolean, error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/db-status`);
      if (!response.ok) return { connected: false, error: `Backend returned status ${response.status}.` };
      return await response.json();
    } catch {
      return { connected: false, error: 'Failed to reach backend.' };
    }
  },

  async getPosts(): Promise<Post[]> {
    try {
      const response = await fetch(`${API_BASE}/posts`);
      if (!response.ok) {
        console.warn(`getPosts failed with status ${response.status}. Check database connection.`);
        return MOCK_POSTS;
      }
      const data = await response.json();

      if (!Array.isArray(data)) {
        console.warn("getPosts failed: Data is not an array. Check database connection.");
        return MOCK_POSTS;
      }

      const posts = data.map((post: any) => ({
        id: post.id,
        userId: post.user_id,
        username: post.username,
        title: post.title,
        content: post.content,
        likes: post.likes || 0,
        likedBy: Array.isArray(post.liked_by) ? post.liked_by : [],
        shares: post.shares || 0,
        createdAt: post.created_at,
        userAvatar: post.user_avatar,
        reportCount: post.report_count || 0,
        lastEditedAt: post.last_edited_at,
        comments: (post.comments || []).map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          username: c.username,
          content: c.content,
          createdAt: c.created_at,
          reportCount: c.report_count || 0
        }))
      }));

      return posts;
    } catch (err) {
      console.error("getPosts failed:", err);
      return MOCK_POSTS;
    }
  },

  async savePost(post: Post): Promise<void> {
    const user = this.getCurrentUser();
    if (this.isBanned(user)) throw new Error("Suspended account.");
    
    const response = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: post.id,
        user_id: post.userId,
        username: post.username,
        title: post.title,
        content: post.content,
        likes: post.likes,
        liked_by: post.likedBy,
        shares: post.shares,
        user_avatar: post.userAvatar,
        created_at: post.createdAt,
        report_count: 0
      })
    });
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
  },

  async updatePost(updatedPost: Post): Promise<void> {
    const response = await fetch(`${API_BASE}/posts/${updatedPost.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        likes: updatedPost.likes,
        liked_by: updatedPost.likedBy,
        shares: updatedPost.shares,
        title: updatedPost.title,
        content: updatedPost.content
      })
    });
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
  },

  async updatePostContent(postId: string, title: string, content: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          last_edited_at: new Date().toISOString()
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async deletePost(postId: string): Promise<{ success: boolean, error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/posts/${postId}`, {
        method: 'DELETE'
      });
      if (!response.ok) return { success: false, error: `Server error: ${response.status}` };
      const result = await response.json();
      return { success: result.success };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async addComment(postId: string, comment: Comment): Promise<void> {
    const user = this.getCurrentUser();
    if (this.isBanned(user)) throw new Error("Suspended account.");
    
    const response = await fetch(`${API_BASE}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: comment.id,
        post_id: postId,
        user_id: comment.userId,
        username: comment.username,
        content: comment.content,
        created_at: comment.createdAt,
        report_count: 0
      })
    });
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
  },

  // --- Global Utility ---
  async getUserById(userId: string): Promise<User | null> {
    if (!userId) return null;
    try {
      const response = await fetch(`${API_BASE}/users/${userId}`);
      if (!response.ok) {
        console.warn(`getUserById failed for user ${userId}. Status: ${response.status}`);
        return null;
      }
      const data = await response.json();
      
      let stats = { followers: 0, following: 0 };
      try {
        const statsResponse = await fetch(`${API_BASE}/follows/stats/${userId}`);
        if (statsResponse.ok) {
          stats = await statsResponse.json();
        } else {
          console.warn(`getFollowStats failed for user ${userId}. Status: ${statsResponse.status}`);
        }
      } catch (statsErr) {
        console.warn(`getFollowStats error for user ${userId}:`, statsErr);
      }

      return {
        id: data.id,
        username: data.username,
        email: data.email,
        avatar: data.avatar,
        bio: data.bio || '',
        bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
        blockedUsers: Array.isArray(data.blocked_users) ? data.blocked_users : [],
        totalLikes: data.total_likes || 0,
        badge: (data.badge as BadgeTier) || BadgeTier.NOVICE,
        followerCount: stats.followers || 0,
        followingCount: stats.following || 0,
        reportCount: data.report_count || 0,
        bannedUntil: data.banned_until,
        settings: { showReportCount: true, showStats: true }
      };
    } catch (err) {
      console.error("getUserById error:", err);
      return null;
    }
  },

  async refreshUser(userId: string): Promise<User | null> {
    const user = await this.getUserById(userId);
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  getCurrentUser(): User | null {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  },

  async toggleBookmark(userId: string, postId: string): Promise<User | null> {
    if (!userId) return null;
    try {
      const user = await this.getUserById(userId);
      if (!user) return null;
      let bookmarks = user.bookmarks || [];
      const newBookmarks = bookmarks.includes(postId)
        ? bookmarks.filter((id: string) => id !== postId)
        : [...bookmarks, postId];
        
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarks: newBookmarks })
      });
      if (!response.ok) return null;
      
      return await this.refreshUser(userId);
    } catch (err) {
      return null;
    }
  },

  async updateUserLikes(userId: string, delta: number): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) return;
    const newTotalLikes = Math.max(0, (user.totalLikes || 0) + delta);
    const newBadge = getBadge(newTotalLikes);
    
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total_likes: newTotalLikes, badge: newBadge })
    });
    if (!response.ok) console.error(`updateUserLikes failed with status ${response.status}`);
  },

  async updateUserSettings(userId: string, settings: any): Promise<User | null> {
    if (!userId) return null;
    try {
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });
      if (!response.ok) return null;
      return await this.refreshUser(userId);
    } catch (err) {
      console.error("updateUserSettings error:", err);
      return null;
    }
  },

  async reportEntity(reporterId: string, targetType: ReportType, targetId: string, reason: string): Promise<{ success: boolean, message: string }> {
    try {
      const checkResponse = await fetch(`${API_BASE}/reports/check?reporterId=${reporterId}&targetType=${targetType}&targetId=${targetId}`);
      const checkResult = await checkResponse.json();
      if (checkResult.reported) return { success: false, message: 'Already reported.' };

      const response = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: Math.random().toString(36).substr(2, 9),
          reporter_id: reporterId,
          target_type: targetType,
          target_id: targetId,
          reason
        })
      });
      
      if (!response.ok) return { success: false, message: `Server error: ${response.status}` };
      const result = await response.json();
      if (result.success) return { success: true, message: 'Report submitted.' };
      return { success: false, message: 'Error submitting report.' };
    } catch {
      return { success: false, message: 'Error submitting report.' };
    }
  },

  async hasAlreadyReported(reporterId: string, targetType: ReportType, targetId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/reports/check?reporterId=${reporterId}&targetType=${targetType}&targetId=${targetId}`);
      if (!response.ok) return false;
      const result = await response.json();
      return result.reported;
    } catch {
      return false;
    }
  },

  async getFollowStats(userId: string): Promise<{ followers: number, following: number }> {
    try {
      const response = await fetch(`${API_BASE}/follows/stats/${userId}`);
      if (!response.ok) return { followers: 0, following: 0 };
      return await response.json();
    } catch { return { followers: 0, following: 0 }; }
  },

  async getFollowers(userId: string): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE}/follows/followers/${userId}`);
      if (!response.ok) return [];
      const data = await response.json();
      if (!Array.isArray(data)) return [];
      return data.map((u: any) => ({
        ...u,
        blockedUsers: u.blocked_users || [],
        totalLikes: u.total_likes || 0,
        reportCount: u.report_count || 0,
        settings: { showReportCount: true, showStats: true }
      }));
    } catch { return []; }
  },

  async getFollowingList(userId: string): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE}/follows/following/${userId}`);
      if (!response.ok) return [];
      const data = await response.json();
      if (!Array.isArray(data)) return [];
      return data.map((u: any) => ({
        ...u,
        blockedUsers: u.blocked_users || [],
        totalLikes: u.total_likes || 0,
        reportCount: u.report_count || 0,
        settings: { showReportCount: true, showStats: true }
      }));
    } catch { return []; }
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/follows/is-following?followerId=${followerId}&followingId=${followingId}`);
      if (!response.ok) return false;
      const result = await response.json();
      return result.isFollowing;
    } catch { return false; }
  },

  async followUser(followerId: string, followingId: string): Promise<{ follower: User | null, following: User | null }> {
    try {
      const response = await fetch(`${API_BASE}/follows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower_id: followerId, following_id: followingId })
      });
      if (!response.ok) console.error(`Follow failed with status ${response.status}`);
    } catch (e) {
      console.error("Follow failed:", e);
    }
    return { follower: await this.refreshUser(followerId), following: await this.getUserById(followingId) };
  },

  async unfollowUser(followerId: string, followingId: string): Promise<{ follower: User | null, following: User | null }> {
    try {
      const response = await fetch(`${API_BASE}/follows?followerId=${followerId}&followingId=${followingId}`, {
        method: 'DELETE'
      });
      if (!response.ok) console.error(`Unfollow failed with status ${response.status}`);
    } catch (e) {
      console.error("Unfollow failed:", e);
    }
    return { follower: await this.refreshUser(followerId), following: await this.getUserById(followingId) };
  },

  async deleteAccount(userId: string): Promise<{ success: boolean, error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'DELETE'
      });
      if (!response.ok) return { success: false, error: `Server error: ${response.status}` };
      const result = await response.json();
      if (result.success) {
        this.logout();
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (err: any) {
      console.error("Account deletion failed:", err);
      return { success: false, error: err.message || 'Deletion failed.' };
    }
  },

  isBanned(user: User | null): boolean {
    if (!user || !user.bannedUntil) return false;
    return new Date(user.bannedUntil) > new Date();
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  }
};
