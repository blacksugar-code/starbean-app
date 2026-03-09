/**
 * REST API 封装层
 * 所有后端接口通过此层调用
 */

// NOTE: 本地开发走 Vite 代理（/api），Vercel 部署时通过环境变量指向后端地址
export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

/**
 * 后端根地址（不含 /api），用于拼接 /uploads 等静态资源路径
 * 例如本地为 ''，部署时为 'https://starbean-app.onrender.com'
 */
export const BACKEND_BASE = API_BASE.replace(/\/api$/, '');

/**
 * 通用请求封装
 * @param url API 路径
 * @param options fetch 选项
 * @returns 解析后的 JSON 响应
 */
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '请求失败' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ==================== 用户接口 ====================

export interface UserData {
  id: string;
  name: string;
  avatar_url: string;
  star_beans: number;
  fragments: number;
  digital_avatar_generated: boolean;
  created_at?: string;
  pulls_since_last_ssr?: number;
  total_pulls?: number;
}

/** 创建用户 */
export async function createUser(name: string): Promise<UserData> {
  return request<UserData>('/users', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

/** 获取用户信息 */
export async function getUser(userId: string): Promise<UserData> {
  return request<UserData>(`/users/${userId}`);
}

/** 生成数字形象（上传照片） */
export async function generateAvatar(userId: string, photos: File[]): Promise<{
  avatar_id: string;
  image_url: string;
  user: UserData;
}> {
  const formData = new FormData();
  photos.forEach((photo) => {
    formData.append('photos', photo);
  });

  const response = await fetch(`${API_BASE}/users/${userId}/generate-avatar`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '生成失败' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/** 删除数字形象 */
export async function deleteAvatar(userId: string): Promise<UserData> {
  return request<UserData>(`/users/${userId}/avatar`, { method: 'DELETE' });
}

// ==================== 合拍模板接口 ====================

export interface TemplateData {
  id: string;
  title: string;
  artist_name: string;
  cover_image: string;
  detail_image: string;
  artist_ref_images: string[];
  template_prompt: string;
  single_draw_price: number;
  ten_draw_price: number;
  description: string;
  rarity_rates: Record<string, string>;
  is_published: boolean;
  created_at: string;
}

/** 获取模板列表（仅上架的） */
export async function getTemplates(): Promise<TemplateData[]> {
  return request<TemplateData[]>('/templates');
}

/** 获取模板详情 */
export async function getTemplate(templateId: string): Promise<TemplateData> {
  return request<TemplateData>(`/templates/${templateId}`);
}

export type TemplateCreateData = Omit<TemplateData, 'id' | 'created_at' | 'is_published' | 'rarity_rates'> & {
  is_published?: boolean;
  rarity_rates?: Record<string, string>;
};

/** 创建模板 */
export async function createTemplate(data: TemplateCreateData): Promise<TemplateData> {
  return request<TemplateData>('/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 上传单张图片 */
export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('图片上传失败');
  }

  return response.json();
}

// ==================== 抽卡接口 ====================

export interface CardData {
  id: string;
  name: string;
  rarity: 'N' | 'R' | 'SR' | 'SSR';
  image_url: string;
  artist_id: string;
  series: string;
  obtained_at: string;
  description?: string;
  is_duplicate?: boolean;
  fragments_gained?: number;
}

export interface DrawResult {
  cards: CardData[];
  remaining_star_beans: number;
  remaining_fragments: number;
  total_pulls: number;
  pulls_since_last_ssr: number;
}

/** 执行抽卡（快速版 — 只返回等级，不生成图片） */
export async function drawGacha(
  userId: string,
  templateId: string,
  drawType: 'single' | 'ten',
): Promise<DrawResult> {
  return request<DrawResult>('/gacha/draw', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      template_id: templateId,
      draw_type: drawType,
    }),
  });
}

export interface GenerateImageResult {
  card_id: string;
  image_url: string;
  rarity: string;
}

/** 按需为指定卡牌生成 AI 合照 */
export async function generateCardImage(
  cardId: string,
  userId: string,
  mode: 'avatar' | 'photo' = 'avatar',
  userPhoto?: string,
): Promise<GenerateImageResult> {
  return request<GenerateImageResult>('/gacha/generate-image', {
    method: 'POST',
    body: JSON.stringify({
      card_id: cardId,
      user_id: userId,
      mode,
      user_photo: userPhoto,
    }),
  });
}

/** 获取用户卡牌集合 */
export async function getUserCards(
  userId: string,
  rarity?: string,
): Promise<{ cards: CardData[]; total: number }> {
  const params = rarity ? `?rarity=${rarity}` : '';
  return request(`/gacha/cards/${userId}${params}`);
}

// ==================== 社区接口 ====================

export interface PostData {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  content: string;
  image_url: string;
  likes_count: number;
  created_at: string;
  comments_count: number;
}

/** 获取帖子列表 */
export async function getPosts(
  limit = 20,
  offset = 0,
): Promise<PostData[]> {
  return request<PostData[]>(`/posts?limit=${limit}&offset=${offset}`);
}

/** 点赞帖子 */
export async function likePost(
  postId: string,
): Promise<{ likes_count: number }> {
  return request(`/posts/${postId}/like`, { method: 'POST' });
}
