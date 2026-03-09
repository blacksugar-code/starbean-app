import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, LayoutGrid, X, Loader2, ImageIcon, Upload } from 'lucide-react';
import * as api from '../../services/api';
import { API_BASE } from '../../services/api';

interface Artist {
  id: string;
  name: string;
}

interface TemplateFormData {
  title: string;
  artist_id: string;
  artist_name: string;
  cover_image: string;
  detail_image: string;
  artist_ref_images: string[];
  rarity_prompts: { N: string; R: string; SR: string; SSR: string };
  single_draw_price: number;
  ten_draw_price: number;
  description: string;
  rarity_rates: { N: string; R: string; SR: string; SSR: string };
  is_published: boolean;
}

const DEFAULT_FORM: TemplateFormData = {
  title: '', artist_id: '', artist_name: '', cover_image: '', detail_image: '',
  artist_ref_images: [],
  rarity_prompts: { N: '', R: '', SR: '', SSR: '' },
  single_draw_price: 99, ten_draw_price: 890,
  description: '',
  rarity_rates: { N: '70%', R: '20%', SR: '8%', SSR: '2%' },
  is_published: true,
};

/**
 * 模板管理模块
 * 核心模块：涵盖照片、prompt、价格、概率等全部模板配置
 */
export const TemplateAdmin: React.FC = () => {
  const [templates, setTemplates] = useState<api.TemplateData[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tplRes, artistRes] = await Promise.all([
        fetch(API_BASE + '/templates?all=true').then((r) => r.json()),
        fetch(API_BASE + '/admin/artists').then((r) => r.json()),
      ]);
      setTemplates(tplRes);
      setArtists(artistRes);
    } catch (e) {
      console.error('获取数据失败:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleImageUpload = async (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field);
    try {
      const result = await api.uploadImage(file);
      if (field === 'cover_image' || field === 'detail_image') {
        setFormData((prev) => ({ ...prev, [field]: result.url }));
      }
    } catch {
      alert('图片上传失败');
    } finally {
      setUploading('');
    }
  };

  const handleRefImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (formData.artist_ref_images.length >= 5) { alert('最多上传 5 张参考图'); return; }
    setUploading('ref');
    try {
      const result = await api.uploadImage(file);
      setFormData((prev) => ({ ...prev, artist_ref_images: [...prev.artist_ref_images, result.url] }));
    } catch {
      alert('图片上传失败');
    } finally {
      setUploading('');
    }
  };

  const removeRefImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      artist_ref_images: prev.artist_ref_images.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) { alert('请填写模板名称'); return; }
    if (!formData.artist_name.trim() && !formData.artist_id) { alert('请选择关联明星'); return; }
    setSaving(true);
    try {
      // 将四个等级的 prompt 合并为 template_prompt（兼容现有结构）
      const combinedPrompt = `N:${formData.rarity_prompts.N}||R:${formData.rarity_prompts.R}||SR:${formData.rarity_prompts.SR}||SSR:${formData.rarity_prompts.SSR}`;
      const body = {
        title: formData.title,
        artist_name: formData.artist_name,
        cover_image: formData.cover_image,
        detail_image: formData.detail_image,
        artist_ref_images: formData.artist_ref_images,
        template_prompt: combinedPrompt,
        single_draw_price: formData.single_draw_price,
        ten_draw_price: formData.ten_draw_price,
        description: formData.description,
        rarity_rates: formData.rarity_rates,
        is_published: formData.is_published,
      };

      let res: Response;
      if (editingId) {
        res = await fetch(`{API_BASE}/templates/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(API_BASE + '/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: '未知错误' }));
        alert(`保存失败: ${err.detail || JSON.stringify(err)}`);
        setSaving(false);
        return;
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ ...DEFAULT_FORM });
      fetchData();
    } catch (e: any) {
      alert(`保存失败: ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`{API_BASE}/templates/${id}`, { method: 'DELETE' });
      setDeletingId(null);
      fetchData();
    } catch {
      alert('删除失败');
    }
  };

  const openEdit = (tpl: api.TemplateData) => {
    // 解析 rarity_prompts
    const rp = { N: '', R: '', SR: '', SSR: '' };
    if (tpl.template_prompt?.includes('||')) {
      tpl.template_prompt.split('||').forEach((seg) => {
        const [key, ...val] = seg.split(':');
        const k = key?.trim() as keyof typeof rp;
        if (k && rp.hasOwnProperty(k)) rp[k] = val.join(':').trim();
      });
    } else {
      // 旧格式：相同 prompt 给所有等级
      rp.N = rp.R = rp.SR = rp.SSR = tpl.template_prompt || '';
    }

    setEditingId(tpl.id);
    setFormData({
      title: tpl.title,
      artist_id: '',
      artist_name: tpl.artist_name,
      cover_image: tpl.cover_image,
      detail_image: tpl.detail_image,
      artist_ref_images: tpl.artist_ref_images || [],
      rarity_prompts: rp,
      single_draw_price: tpl.single_draw_price,
      ten_draw_price: tpl.ten_draw_price,
      description: tpl.description,
      rarity_rates: tpl.rarity_rates as any || { N: '70%', R: '20%', SR: '8%', SSR: '2%' },
      is_published: tpl.is_published,
    });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ ...DEFAULT_FORM });
    setShowForm(true);
  };

  const selectArtist = (artistId: string) => {
    const a = artists.find((x) => x.id === artistId);
    setFormData((prev) => ({ ...prev, artist_id: artistId, artist_name: a?.name || '' }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-500">管理合拍模板，包含照片、Prompt、价格和概率</p>
        <button onClick={openCreate} className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> 创建模板
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <LayoutGrid className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>暂无模板</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden group">
              <div className="aspect-[3/4] bg-gray-100 relative">
                {tpl.cover_image ? (
                  <img src={tpl.cover_image} alt={tpl.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-10 h-10 text-gray-300" /></div>
                )}
                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold ${tpl.is_published ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                  {tpl.is_published ? '已上架' : '未上架'}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-sm text-gray-800 truncate">{tpl.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{tpl.artist_name} · 单抽 {tpl.single_draw_price}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => openEdit(tpl)} className="flex-1 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                    <Edit2 className="w-3 h-3" /> 编辑
                  </button>
                  <button onClick={() => setDeletingId(tpl.id)} className="py-1.5 px-3 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建 / 编辑弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">{editingId ? '编辑模板' : '创建模板'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-5">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">模板名称 <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    placeholder="例如：嘉年华" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">关联明星 <span className="text-red-500">*</span></label>
                  <select value={formData.artist_id} onChange={(e) => selectArtist(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none bg-white">
                    <option value="">-- 选择明星 --</option>
                    {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  {formData.artist_name && !formData.artist_id && (
                    <p className="text-xs text-gray-400 mt-1">当前: {formData.artist_name}</p>
                  )}
                </div>
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  rows={2} placeholder="模板简介..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none resize-none" />
              </div>

              {/* 图片上传 */}
              <div className="grid grid-cols-2 gap-4">
                {(['cover_image', 'detail_image'] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field === 'cover_image' ? '封面图 (3:4)' : '详情长图 (2:3)'}
                    </label>
                    {(formData as any)[field] ? (
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                        <img src={(formData as any)[field]} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => setFormData((p) => ({ ...p, [field]: '' }))} className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-xs">✕</button>
                      </div>
                    ) : (
                      <label className="block aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer flex items-center justify-center hover:border-pink-400 transition-colors">
                        {uploading === field ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : <Upload className="w-6 h-6 text-gray-300" />}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(field, e)} />
                      </label>
                    )}
                  </div>
                ))}
              </div>

              {/* 明星参考图 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">明星参考图（1~5 张）<span className="text-red-500">*</span></label>
                <div className="flex gap-2 flex-wrap">
                  {formData.artist_ref_images.map((img, i) => (
                    <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 relative group/ref">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeRefImage(i)} className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover/ref:opacity-100 flex items-center justify-center transition-opacity text-xs">删除</button>
                    </div>
                  ))}
                  {formData.artist_ref_images.length < 5 && (
                    <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer flex items-center justify-center hover:border-pink-400 transition-colors">
                      {uploading === 'ref' ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <Plus className="w-5 h-5 text-gray-300" />}
                      <input type="file" accept="image/*" className="hidden" onChange={handleRefImageUpload} />
                    </label>
                  )}
                </div>
              </div>

              {/* 四级 Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">合照生成 Prompt（按稀有度）</label>
                {(['N', 'R', 'SR', 'SSR'] as const).map((rarity) => (
                  <div key={rarity} className="mb-2">
                    <label className="text-xs font-bold text-gray-500 mb-0.5 block">{rarity} 级</label>
                    <textarea
                      value={formData.rarity_prompts[rarity]}
                      onChange={(e) => setFormData((p) => ({ ...p, rarity_prompts: { ...p.rarity_prompts, [rarity]: e.target.value } }))}
                      rows={2} placeholder={`${rarity} 级 Prompt...`}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none resize-none"
                    />
                  </div>
                ))}
              </div>

              {/* 价格 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">单抽价格</label>
                  <input type="number" value={formData.single_draw_price} onChange={(e) => setFormData((p) => ({ ...p, single_draw_price: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">十连价格</label>
                  <input type="number" value={formData.ten_draw_price} onChange={(e) => setFormData((p) => ({ ...p, ten_draw_price: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none" />
                </div>
              </div>

              {/* 概率设定 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">概率设定</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['N', 'R', 'SR', 'SSR'] as const).map((r) => (
                    <div key={r}>
                      <label className="text-xs font-bold text-gray-500 mb-0.5 block">{r}</label>
                      <input type="text" value={formData.rarity_rates[r]} onChange={(e) => setFormData((p) => ({ ...p, rarity_rates: { ...p.rarity_rates, [r]: e.target.value } }))}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none" />
                    </div>
                  ))}
                </div>
              </div>

              {/* 上架状态 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_published} onChange={(e) => setFormData((p) => ({ ...p, is_published: e.target.checked }))}
                  className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-200" />
                <span className="text-sm text-gray-700">立即上架</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50">取消</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 mb-1">确认删除</h3>
            <p className="text-sm text-gray-500 mb-6">此操作不可恢复，确定要删除该模板吗？</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50">取消</button>
              <button onClick={() => handleDelete(deletingId)} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
