import { API_BASE, resolveAssetUrl } from '../../services/api';
import React, { useState, useEffect } from 'react';
import { Trash2, Users, Eye, X, Loader2, Edit2, Gem, Check } from 'lucide-react';

interface UserInfo {
  id: string;
  name: string;
  avatar_url: string;
  star_beans: number;
  fragments: number;
  digital_avatar_generated: boolean;
  total_pulls: number;
  pulls_since_last_ssr: number;
  created_at: string;
}

interface CardInfo {
  id: string;
  name: string;
  rarity: string;
  image_url: string;
  obtained_at: string;
}

export const UserAdmin: React.FC = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [userCards, setUserCards] = useState<CardInfo[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);

  // 修改星豆弹窗状态
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [editBeans, setEditBeans] = useState('');
  const [savingBeans, setSavingBeans] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await fetch(API_BASE + '/admin/users').then((r) => r.json());
      setUsers(data);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const viewDetail = async (user: UserInfo) => {
    setSelectedUser(user);
    setLoadingCards(true);
    try {
      const data = await fetch(`{API_BASE}/gacha/cards/${user.id}`).then((r) => r.json());
      setUserCards(data.cards || []);
    } catch { setUserCards([]); } finally { setLoadingCards(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除？不可恢复！')) return;
    await fetch(`{API_BASE}/admin/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  };

  /** 打开星豆编辑弹窗 */
  const openBeansEditor = (user: UserInfo) => {
    setEditingUser(user);
    setEditBeans(String(user.star_beans));
  };

  /** 保存星豆修改 */
  const saveBeans = async () => {
    if (!editingUser) return;
    const newBeans = parseInt(editBeans);
    if (isNaN(newBeans) || newBeans < 0) {
      alert('请输入有效的非负整数');
      return;
    }
    setSavingBeans(true);
    try {
      const res = await fetch(`{API_BASE}/admin/users/${editingUser.id}/beans`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ star_beans: newBeans }),
      });
      if (!res.ok) {
        alert('修改失败');
        return;
      }
      setEditingUser(null);
      fetchUsers();
    } catch {
      alert('修改失败');
    } finally {
      setSavingBeans(false);
    }
  };

  const rc = (r: string) => r === 'SSR' ? 'text-yellow-500 bg-yellow-50' : r === 'SR' ? 'text-purple-500 bg-purple-50' : r === 'R' ? 'text-blue-500 bg-blue-50' : 'text-gray-500 bg-gray-50';

  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">查看用户信息和抽卡记录</p>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-gray-400"><Users className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>暂无用户</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">用户</th>
              <th className="px-4 py-3 font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 font-medium text-gray-500">形象</th>
              <th className="px-4 py-3 font-medium text-gray-500">星豆</th>
              <th className="px-4 py-3 font-medium text-gray-500">抽卡</th>
              <th className="px-4 py-3 font-medium text-gray-500">操作</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden">{u.avatar_url ? <img src={resolveAssetUrl(u.avatar_url)} className="w-full h-full object-cover" /> : <Users className="w-full h-full p-2 text-gray-300" />}</div>
                    <span className="font-medium text-gray-800">{u.name}</span>
                  </div></td>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">{u.id}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${u.digital_avatar_generated ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{u.digital_avatar_generated ? '已生成' : '未生成'}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-700 font-medium">{u.star_beans}</span>
                      <button onClick={() => openBeansEditor(u)} className="p-1 text-gray-400 hover:text-pink-500 hover:bg-pink-50 rounded" title="修改星豆">
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{u.total_pulls || 0}</td>
                  <td className="px-4 py-3"><div className="flex gap-1">
                    <button onClick={() => viewDetail(u)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(u.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 用户详情弹窗 */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{selectedUser.name}</h2>
              <button onClick={() => setSelectedUser(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold">{selectedUser.star_beans}</p><p className="text-xs text-gray-400">星豆</p></div>
              <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold">{selectedUser.total_pulls || 0}</p><p className="text-xs text-gray-400">抽卡次数</p></div>
              <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold">{selectedUser.fragments}</p><p className="text-xs text-gray-400">碎片</p></div>
            </div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">抽卡记录</h3>
            {loadingCards ? <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto" /></div>
             : userCards.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">暂无</p>
             : <div className="grid grid-cols-4 gap-3">{userCards.map((c) => (
              <div key={c.id} className="rounded-lg border overflow-hidden">
                <div className="aspect-[3/4] bg-gray-100">{c.image_url && <img src={resolveAssetUrl(c.image_url)} className="w-full h-full object-cover" />}</div>
                <div className="p-2"><span className={`text-xs font-bold px-1.5 py-0.5 rounded ${rc(c.rarity)}`}>{c.rarity}</span></div>
              </div>
            ))}</div>}
          </div>
        </div>
      )}

      {/* 修改星豆弹窗 */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Gem className="w-5 h-5 text-pink-500" />
              <h3 className="text-base font-bold text-gray-800">修改星豆余额</h3>
            </div>
            <p className="text-sm text-gray-500 mb-1">用户: {editingUser.name}</p>
            <p className="text-sm text-gray-400 mb-4">当前余额: {editingUser.star_beans}</p>
            <input
              type="number"
              value={editBeans}
              onChange={(e) => setEditBeans(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none mb-4"
              placeholder="输入新的星豆数量"
              min="0"
            />
            <div className="flex gap-3">
              <button onClick={() => setEditingUser(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50">取消</button>
              <button onClick={saveBeans} disabled={savingBeans} className="flex-1 py-2.5 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 disabled:opacity-50 flex items-center justify-center gap-1">
                {savingBeans ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {savingBeans ? '保存中...' : '确认修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
