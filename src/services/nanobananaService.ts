/**
 * Nanobanana 服务层
 * 已迁移为调用后端 API，此文件作为兼容层保留
 * 
 * NOTE: 所有AI生成逻辑已移至后端 service/nanobanana_service.py
 * 前端仅通过 api.ts 调用后端接口
 */
import { v4 as uuidv4 } from 'uuid';

interface NanobananaGenerationResponse {
  id: string;
  imageUrl: string;
  status: 'success' | 'failed';
}

/**
 * Nanobanana 服务（前端降级兼容层）
 * 当后端不可用时，提供本地 Mock 作为降级方案
 */
export const nanobananaService = {
  /**
   * 生成用户数字形象（降级 Mock）
   */
  generateUserAvatar: async (photos: File[]): Promise<NanobananaGenerationResponse> => {
    console.log('Nanobanana Mock (Frontend Fallback): Uploading photos...', photos.length);

    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Nanobanana Mock: Digital Avatar Generated');
        resolve({
          id: uuidv4(),
          imageUrl: `https://picsum.photos/seed/${uuidv4()}/400/400`,
          status: 'success',
        });
      }, 2000);
    });
  },

  /**
   * 生成合照（降级 Mock）
   * NOTE: 正常流程由后端处理，此方法仅在后端不可用时使用
   */
  generateFusionImage: async (
    userAvatarUrl: string,
    artistAvatarUrl: string,
    rarity: 'N' | 'R' | 'SR' | 'SSR',
  ): Promise<NanobananaGenerationResponse> => {
    console.log('Nanobanana Mock (Frontend Fallback): Generating Fusion Image...');

    return new Promise((resolve) => {
      setTimeout(() => {
        const seedPrefix = rarity.toLowerCase();
        resolve({
          id: uuidv4(),
          imageUrl: `https://picsum.photos/seed/${seedPrefix}_${uuidv4()}/600/800`,
          status: 'success',
        });
      }, 1500);
    });
  },
};
