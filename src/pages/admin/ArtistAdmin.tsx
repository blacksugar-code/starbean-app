import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Star, X, Loader2, ImageIcon } from 'lucide-react';
import * as api from '../../services/api';
import { API_BASE } from '../../services/api';

interface Artist {
  id: string;
  name: string;
  avatar_url: string;
  description: string;
  template_count?: number;
  created_at: string;
}

/**
 * 明星管理模块
 * 支持创建、编辑、删除明星，自动关联模板
 */
export const ArtistAdmin: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [formData, setFormData] = useState({ name: '', avatar_url: '', description: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchArtists = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE + '/admin/artists');
      const data = await res.json();
      setArtists(data);
    } catch (e) {
      console.error('获取明星列表失败:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArtists(); }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.uploadImage(file);
      setFormData((prev) => ({ ...prev, avatar_url: result.url }));
    } catch {
      alert('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { alert('请填写明星名称'); return; }
    setSaving(true);
    try {
      const method = editingArtist ? 'PUT' : 'POST';
      const url = editingArtist ? `/api/admin/artists/${editingArtist.id}` : '/api/admin/artists';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setShowForm(false);
      setEditingArtist(null);
      setFormData({ name: '', avatar_url: '', description: '' });
      fetchArtists();
    } catch {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该明星？关联的模板不会被删除。')) return;
    try {
      await fetch(`{API_BASE}/admin/artists/${id}`, { method: 'DELETE' });
      fetchArtists();
    } catch {
      alert('删除失败');
    }
  };

  const openEdit = (a: Artist) => {
    setEditingArtist(a);
    setFormData({ name: a.name, avatar_url: a.avatar_url, description: a.description });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditingArtist(null);
    setFormData({ name: '', avatar_url: '', description: '' });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-500">管理明星档案，模板创建时选择明星将自动关联</p>
        <button onClick={openCreate} className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> 添加明星
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : artists.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>暂无明星，点击上方按钮添加</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {artists.map((artist) => (
            <div key={artist.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 group">
              <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden shrink-0">
                {artist.avatar_url ? (
                  <img src={artist.avatar_url} alt={artist.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Star className="w-6 h-6 text-gray-300" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-800">{artist.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{artist.description || '暂无简介'}</p>
                {artist.template_count !== undefined && (
                  <p className="text-xs text-pink-500 mt-1">关联 {artist.template_count} 个模板</p>
                )}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(artist)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(artist.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
              <h2 className="text-lg font-bold text-gray-800">{editingArtist ? '编辑明星' : '添加明星'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              {/* 头像 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">头像</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden shrink-0">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-300" /></div>
                    )}
                  </div>
                  <label className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors">
                    {uploading ? '上传中...' : '选择图片'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                  </label>
                </div>
              </div>
              {/* 名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称 <span className="text-red-500">*</span></label>
                <input
                  type="text" value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：周杰伦"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
                />
              </div>
              {/* 简介 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="明星介绍..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50">取消</button>
              <button onClick={handleSave} disabled={saving || !formData.name.trim()} className="flex-1 py-2.5 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
