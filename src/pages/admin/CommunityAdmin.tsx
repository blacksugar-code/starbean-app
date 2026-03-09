import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MessageSquare, X, Loader2, ImageIcon } from 'lucide-react';
import * as api from '../../services/api';
import { API_BASE, resolveAssetUrl } from '../../services/api';

interface Post {
  id: string;
  user_id: string;
  user_name?: string;
  content: string;
  image_url: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export const CommunityAdmin: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ content: '', image_url: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await fetch(API_BASE + '/posts?limit=100').then((r) => r.json());
      setPosts(data);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.uploadImage(file);
      setFormData((p) => ({ ...p, image_url: result.url }));
    } catch { alert('上传失败'); } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!formData.content.trim()) { alert('请填写内容'); return; }
    setSaving(true);
    try {
      await fetch(API_BASE + '/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'admin', content: formData.content, image_url: formData.image_url }),
      });
      setShowForm(false);
      setFormData({ content: '', image_url: '' });
      fetchPosts();
    } catch { alert('发布失败'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该帖子？')) return;
    await fetch(`{API_BASE}/posts/${id}`, { method: 'DELETE' });
    fetchPosts();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-500">管理社区墙内容</p>
        <button onClick={() => { setShowForm(true); setFormData({ content: '', image_url: '' }); }}
          className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> 发布内容
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400"><MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>暂无帖子</p></div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-4 group">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 line-clamp-3">{post.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>❤️ {post.likes_count}</span>
                    <span>💬 {post.comments_count || 0}</span>
                    <span>{post.created_at?.slice(0, 10)}</span>
                  </div>
                </div>
                {post.image_url && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 ml-4 shrink-0">
                    <img src={resolveAssetUrl(post.image_url)} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <button onClick={() => handleDelete(post.id)} className="ml-3 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">发布内容</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <textarea value={formData.content} onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                rows={4} placeholder="写点什么..." className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-200 outline-none resize-none" />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">配图（可选）</label>
                {formData.image_url ? (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                    <img src={resolveAssetUrl(formData.image_url)} className="w-full h-full object-cover" />
                    <button onClick={() => setFormData((p) => ({ ...p, image_url: '' }))} className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full text-xs flex items-center justify-center">✕</button>
                  </div>
                ) : (
                  <label className="w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer flex items-center justify-center hover:border-pink-400">
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : <ImageIcon className="w-8 h-8 text-gray-300" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border text-gray-600 rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600 disabled:opacity-50">{saving ? '发布中...' : '发布'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
