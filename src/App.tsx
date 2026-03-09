import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
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

/**
 * Gacha 路由守卫：需要先生成数字形象才能进入抽卡
 * NOTE: 抽离为独立组件，避免在 App 顶层订阅 user 导致全局 re-render
 */
function GachaGuard() {
  const { user } = useStore();
  return user.digitalAvatarGenerated ? <Gacha /> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/artist/:id" element={<ArtistSpace />} />
        <Route path="/template/:id" element={<TemplateDetails />} />
        <Route path="/gacha/:id" element={<GachaGuard />} />
        <Route path="/result" element={<Result />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/collection/album/:seriesId" element={<CollectionAlbumDetail />} />
        <Route path="/collection/artist/:artistId" element={<CollectionArtistDetail />} />
        <Route path="/collection/:rarity" element={<CollectionDetail />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/post/:postId" element={<CommunityPostDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/avatar-generate" element={<AvatarGenerate />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/invite" element={<InviteLottery />} />
        <Route path="/recharge" element={<RechargePage />} />
        <Route path="/admin" element={<AdminLayout />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
