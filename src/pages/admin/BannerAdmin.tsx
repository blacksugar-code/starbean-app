import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, GripVertical, ImageIcon, X, Loader2 } from 'lucide-react';
import * as api from '../../services/api';
import { API_BASE } from '../../services/api';

interface Banner {
  id: string;
  image_url: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

/**
 * Banner 管理模块
 * 支持上传、编辑、删除首页轮播图
 */
export const BannerAdmin: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({ image_url: '', link_url: '', sort_order: 0 });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE + '/admin/banners');
      const data = await res.json();
      setBanners(data);
    } catch (e) {
      console.error('获取 Banner 失败:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.uploadImage(file);
      setFormData((prev) => ({ ...prev, image_url: result.url }));
    } catch (err) {
      alert('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.image_url) {
      alert('请先上传图片');
      return;
    }
    setSaving(true);
    try {
      const method = editingBanner ? 'PUT' : 'POST';
      const url = editingBanner
        ? `/api/admin/banners/${editingBanner.id}`
        : '/api/admin/banners';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setShowForm(false);
      setEditingBanner(null);
      setFormData({ image_url: '', link_url: '', sort_order: 0 });
      fetchBanners();
    } catch (err) {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此 Banner 吗？')) return;
    try {
      await fetch(`{API_BASE}/admin/banners/${id}`, { method: 'DELETE' });
      fetchBanners();
    } catch (err) {
      alert('删除失败');
    }
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      image_url: banner.image_url,
      link_url: banner.link_url,
      sort_order: banner.sort_order,
    });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditingBanner(null);
    setFormData({ image_url: '', link_url: '', sort_order: banners.length });
    setShowForm(true);
  };

  return (
    <div>
      {/* 操作栏 */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-500">管理首页轮播 Banner，建议尺寸 750×375px（2:1 比例）</p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> 添加 Banner
        </button>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : banners.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>暂无 Banner，点击上方按钮添加</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex items-center gap-4 p-4 group">
              <GripVertical className="w-5 h-5 text-gray-300 shrink-0 cursor-grab" />
              <div className="w-40 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                <img src={banner.image_url} alt="Banner" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{banner.link_url || '无跳转链接'}</p>
                <p className="text-xs text-gray-400 mt-1">排序: {banner.sort_order}</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(banner)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(banner.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 弹窗表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">{editingBanner ? '编辑 Banner' : '添加 Banner'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              {/* 图片上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner 图片 <span className="text-red-500">*</span></label>
                <p className="text-xs text-gray-400 mb-2">建议尺寸: 750×375px（2:1 比例）</p>
                {formData.image_url ? (
                  <div className="relative w-full aspect-[2/1] rounded-lg overflow-hidden bg-gray-100">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="block w-full aspect-[2/1] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer flex items-center justify-center hover:border-pink-400 transition-colors">
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin text-gray-400" /> : (
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 mx-auto text-gray-300 mb-1" />
                        <span className="text-sm text-gray-400">点击上传</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                )}
              </div>

              {/* 跳转链接 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">跳转链接（可选）</label>
                <input
                  type="text"
                  value={formData.link_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, link_url: e.target.value }))}
                  placeholder="例如 /template/xxx"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
                />
              </div>

              {/* 排序 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">排序权重</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">数字越小越靠前</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                取消
              </button>
              <button onClick={handleSave} disabled={saving || !formData.image_url} className="flex-1 py-2.5 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 disabled:opacity-50 transition-colors">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
