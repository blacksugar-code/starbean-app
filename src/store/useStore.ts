import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '../services/api';

export type Rarity = 'N' | 'R' | 'SR' | 'SSR';

export interface Card {
  id: string;
  name: string;
  rarity: Rarity;
  imageUrl: string;
  artistId: string;
  series: string;
  obtainedAt: string;
  description?: string;
  isDuplicate?: boolean;
  fragmentsGained?: number;
}

export interface User {
  id: string;
  username?: string;
  name: string;
  avatarUrl: string;
  /** AI 虚拟形象 URL，与头像分开管理 */
  digitalAvatarUrl: string;
  starBeans: number;
  fragments: number;
  collection: Card[];
  digitalAvatarGenerated: boolean;
  pullsSinceLastSsr?: number;
  totalPulls?: number;
}

interface StoreState {
  // 认证状态
  token: string;
  user: User;
  isLoading: boolean;
  error: string | null;

  /** 是否已登录 */
  isLoggedIn: () => boolean;

  // 认证操作
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  /** 用 token 恢复用户信息 */
  restoreSession: () => Promise<void>;

  // 用户操作
  setUser: (user: User) => void;
  setUserAvatar: (url: string) => void;
  resetUser: () => void;

  // 与后端同步的异步操作
  fetchUser: (userId: string) => Promise<void>;
  createUser: (name: string) => Promise<void>;
  generateAvatar: (photos: File[]) => Promise<string>;
  deleteAvatar: () => Promise<void>;

  // 数字形象生成页面状态（存入 store 防止组件重挂载丢失）
  avatarGenerateStep: 'upload' | 'generating' | 'preview';
  generatedAvatarUrl: string;
  setAvatarGenerateStep: (step: 'upload' | 'generating' | 'preview') => void;
  setGeneratedAvatarUrl: (url: string) => void;

  // 抽卡
  drawGacha: (templateId: string, drawType: 'single' | 'ten') => Promise<Card[]>;

  // 卡牌
  fetchCollection: () => Promise<void>;

  // 本地货币操作（兼容旧逻辑，实际由后端处理）
  addStarBeans: (amount: number) => void;
  deductStarBeans: (amount: number) => boolean;
  addFragments: (amount: number) => void;
  deductFragments: (amount: number) => boolean;
  addToCollection: (card: Card) => void;
}

/** 未登录时的空用户 */
const EMPTY_USER: User = {
  id: '',
  name: '',
  avatarUrl: '',
  digitalAvatarUrl: '',
  starBeans: 0,
  fragments: 0,
  collection: [],
  digitalAvatarGenerated: false,
  pullsSinceLastSsr: 0,
  totalPulls: 0,
};

/**
 * 将后端用户数据映射为前端 User 类型
 * NOTE: 后端使用 snake_case，前端使用 camelCase
 */
function mapUserData(data: api.UserData, existingCollection: Card[] = []): User {
  return {
    id: data.id,
    username: (data as any).username || '',
    name: data.name,
    avatarUrl: data.avatar_url,
    digitalAvatarUrl: (data as any).digital_avatar_url || data.avatar_url || '',
    starBeans: data.star_beans,
    fragments: data.fragments,
    collection: existingCollection,
    digitalAvatarGenerated: data.digital_avatar_generated,
    pullsSinceLastSsr: data.pulls_since_last_ssr,
    totalPulls: data.total_pulls,
  };
}

/**
 * 将后端卡牌数据映射为前端 Card 类型
 */
function mapCardData(data: api.CardData): Card {
  return {
    id: data.id,
    name: data.name,
    rarity: data.rarity,
    imageUrl: data.image_url,
    artistId: data.artist_id,
    series: data.series,
    obtainedAt: data.obtained_at,
    description: data.description,
    isDuplicate: data.is_duplicate,
    fragmentsGained: data.fragments_gained,
  };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      token: '',
      user: EMPTY_USER,
      isLoading: false,
      error: null,

      // 数字形象生成页面状态
      avatarGenerateStep: 'upload' as const,
      generatedAvatarUrl: '',
      setAvatarGenerateStep: (step: 'upload' | 'generating' | 'preview') => set({ avatarGenerateStep: step }),
      setGeneratedAvatarUrl: (url: string) => set({ generatedAvatarUrl: url }),

      /** 判断是否已登录（有 token 且有 user.id） */
      isLoggedIn: () => {
        const state = get();
        return !!state.token && !!state.user.id;
      },

      /** 用户名+密码登录 */
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await api.authLogin(username, password);
          set({
            token: result.token,
            user: mapUserData(result.user),
            isLoading: false,
          });
        } catch (e: any) {
          set({ isLoading: false });
          throw e;
        }
      },

      /** 用户名+密码注册（注册成功后自动登录） */
      register: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await api.authRegister(username, password);
          set({
            token: result.token,
            user: mapUserData(result.user),
            isLoading: false,
          });
        } catch (e: any) {
          set({ isLoading: false });
          throw e;
        }
      },

      /** 登出 */
      logout: () => {
        set({
          token: '',
          user: EMPTY_USER,
          avatarGenerateStep: 'upload',
          generatedAvatarUrl: '',
        });
      },

      /** 恢复会话：用保存的 token 获取用户信息 */
      restoreSession: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const data = await api.getMe();
          const existing = get().user.collection;
          set({ user: mapUserData(data, existing) });
        } catch {
          // Token 过期或无效，清除登录状态
          set({ token: '', user: EMPTY_USER });
        }
      },

      setUser: (user) => set({ user }),

      // NOTE: setUserAvatar 只修改头像，不影响虚拟形象
      setUserAvatar: (url) =>
        set((state) => ({
          user: { ...state.user, avatarUrl: url },
        })),

      resetUser: () => set({ user: EMPTY_USER, token: '' }),

      // 从后端获取用户信息
      fetchUser: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.getUser(userId);
          const existing = get().user.collection;
          set({ user: mapUserData(data, existing), isLoading: false });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
        }
      },

      // 创建新用户
      createUser: async (name: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.createUser(name);
          set({ user: mapUserData(data), isLoading: false });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
        }
      },

      // 生成数字形象 → 写入 digitalAvatarUrl，不覆盖头像
      generateAvatar: async (photos: File[]) => {
        const { user } = get();
        set({ isLoading: true, error: null });
        try {
          const result = await api.generateAvatar(user.id, photos);
          const imageUrl = result.image_url;
          set((state) => ({
            user: {
              ...state.user,
              digitalAvatarUrl: imageUrl,
              digitalAvatarGenerated: true,
            },
            isLoading: false,
          }));
          return imageUrl;
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
          throw e;
        }
      },

      // 删除数字形象 → 只清 digitalAvatarUrl，保留头像
      deleteAvatar: async () => {
        const { user } = get();
        set({ isLoading: true, error: null });
        try {
          await api.deleteAvatar(user.id);
          set((state) => ({
            user: {
              ...state.user,
              digitalAvatarUrl: '',
              digitalAvatarGenerated: false,
            },
            isLoading: false,
          }));
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
        }
      },

      // 执行抽卡（核心逻辑已移至后端）
      drawGacha: async (templateId: string, drawType: 'single' | 'ten') => {
        const { user } = get();
        set({ isLoading: true, error: null });
        try {
          const result = await api.drawGacha(user.id, templateId, drawType);
          const cards = result.cards.map(mapCardData);

          set((state) => ({
            user: {
              ...state.user,
              starBeans: result.remaining_star_beans,
              fragments: result.remaining_fragments,
              collection: [...cards, ...state.user.collection],
              pullsSinceLastSsr: result.pulls_since_last_ssr,
              totalPulls: result.total_pulls,
            },
            isLoading: false,
          }));

          return cards;
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
          throw e;
        }
      },

      // 从后端拉取收藏
      fetchCollection: async () => {
        const { user } = get();
        try {
          const result = await api.getUserCards(user.id);
          const cards = result.cards.map(mapCardData);
          set((state) => ({
            user: { ...state.user, collection: cards },
          }));
        } catch (e: any) {
          console.error('获取卡牌集合失败:', e);
        }
      },

      // 以下为本地兼容方法，保持向后兼容
      addStarBeans: (amount) =>
        set((state) => ({
          user: { ...state.user, starBeans: state.user.starBeans + amount },
        })),

      deductStarBeans: (amount) => {
        const { user } = get();
        if (user.starBeans >= amount) {
          set({ user: { ...user, starBeans: user.starBeans - amount } });
          return true;
        }
        return false;
      },

      addFragments: (amount) =>
        set((state) => ({
          user: { ...state.user, fragments: state.user.fragments + amount },
        })),

      deductFragments: (amount) => {
        const { user } = get();
        if (user.fragments >= amount) {
          set({ user: { ...user, fragments: user.fragments - amount } });
          return true;
        }
        return false;
      },

      addToCollection: (card) =>
        set((state) => ({
          user: { ...state.user, collection: [card, ...state.user.collection] },
        })),
    }),
    {
      // NOTE: persist key 改为 starbean-auth，api.ts 的 getAuthToken 需要与此一致
      name: 'starbean-auth',
      // NOTE: 只持久化认证信息和精简用户数据，不存 collection（含大量 base64 图片会超 localStorage 5MB 限制）
      partialize: (state) => ({
        token: state.token,
        user: {
          ...state.user,
          // 排除 collection 和含 data URI 的大字段
          collection: [],
          avatarUrl: state.user.avatarUrl?.startsWith('data:') ? '' : state.user.avatarUrl,
          digitalAvatarUrl: state.user.digitalAvatarUrl?.startsWith('data:') ? '' : state.user.digitalAvatarUrl,
        },
      }),
    },
  ),
);
