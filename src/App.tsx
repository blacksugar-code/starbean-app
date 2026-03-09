import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { Login } from './pages/Login';
import { Gacha } from './pages/Gacha';
import { Result } from './pages/Result';
import { Collection } from './pages/Collection';
import { CollectionDetail } from './pages/CollectionDetail';
import { CollectionAlbumDetail } from './pages/CollectionAlbumDetail';
import { CollectionArtistDetail } from './pages/CollectionArtistDetail';
import { Community } from './pages/Community';
import { Profile } from './pages/Profile';
import { ArtistSpace } from './pages/ArtistSpace';
import { TemplateDetails } from './pages/TemplateDetails';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AvatarGenerate } from './pages/AvatarGenerate';
import { SettingsPage } from './pages/SettingsPage';
import { InviteLottery } from './pages/InviteLottery';
import { RechargePage } from './pages/RechargePage';
import { useStore } from './store/useStore';
import { CommunityPostDetail } from './pages/CommunityPostDetail';
import { CommunityPublish } from './pages/CommunityPublish';

/**
 * 认证守卫：未登录跳转 /auth
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useStore();
  return isLoggedIn() ? <>{children}</> : <Navigate to="/auth" />;
}

/**
 * Gacha 路由守卫：需要先登录 + 生成数字形象才能进入抽卡
 */
function GachaGuard() {
  const { user, isLoggedIn } = useStore();
  if (!isLoggedIn()) return <Navigate to="/auth" />;
  return user.digitalAvatarGenerated ? <Gacha /> : <Navigate to="/avatar-generate" />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 公开页面 */}
        <Route path="/auth" element={<Auth />} />

        {/* 需要登录的页面 */}
        <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
        <Route path="/login" element={<AuthGuard><Login /></AuthGuard>} />
        <Route path="/artist/:id" element={<AuthGuard><ArtistSpace /></AuthGuard>} />
        <Route path="/template/:id" element={<AuthGuard><TemplateDetails /></AuthGuard>} />
        <Route path="/gacha/:id" element={<GachaGuard />} />
        <Route path="/result" element={<AuthGuard><Result /></AuthGuard>} />
        <Route path="/collection" element={<AuthGuard><Collection /></AuthGuard>} />
        <Route path="/collection/album/:seriesId" element={<AuthGuard><CollectionAlbumDetail /></AuthGuard>} />
        <Route path="/collection/artist/:artistId" element={<AuthGuard><CollectionArtistDetail /></AuthGuard>} />
        <Route path="/collection/:rarity" element={<AuthGuard><CollectionDetail /></AuthGuard>} />
        <Route path="/community" element={<AuthGuard><Community /></AuthGuard>} />
        <Route path="/community/publish" element={<AuthGuard><CommunityPublish /></AuthGuard>} />
        <Route path="/community/post/:postId" element={<AuthGuard><CommunityPostDetail /></AuthGuard>} />
        <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
        <Route path="/avatar-generate" element={<AuthGuard><AvatarGenerate /></AuthGuard>} />
        <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />
        <Route path="/invite" element={<AuthGuard><InviteLottery /></AuthGuard>} />
        <Route path="/recharge" element={<AuthGuard><RechargePage /></AuthGuard>} />
        <Route path="/admin" element={<AuthGuard><AdminLayout /></AuthGuard>} />

        {/* 兜底 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
