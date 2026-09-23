/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, UserAccount, ScrimItem, TeamRecruitment, FriendItem, FriendRequest, ChatMessage, CoachApplication } from './types';
import { WallpaperBackground } from './components/WallpaperBackground';
import { IsoTransition } from './components/IsoTransition';
import { Navbar } from './components/Navbar';
import { ScrimSection } from './components/ScrimSection';
import { TeamsSection } from './components/TeamsSection';
import { CoachingSection } from './components/CoachingSection';
import { AdminPanel } from './components/AdminPanel';
import { SettingsSection } from './components/SettingsSection';
import { FriendsSection } from './components/FriendsSection';
import { ChatSection } from './components/ChatSection';
import { ConfirmModal } from './components/ConfirmModal';
import { AddFriendModal } from './components/AddFriendModal';
import { FloatingSocialDock } from './components/FloatingSocialDock';
import { TrackerAuthModal } from './components/TrackerAuthModal';
import { AuthModal } from './components/AuthModal';
import { WelcomeAuthGate } from './components/WelcomeAuthGate';
import { ToastContainer, ToastData } from './components/Toast';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, MessageSquare, Award, Users, ShieldCheck, Settings, Lock } from 'lucide-react';
import {
  getDiscordWebhookUrl,
  isDiscordAutoPostEnabled,
  sendDiscordWebhook,
  buildScrimDiscordPayload,
  buildTeamListingDiscordPayload,
  buildCoachDiscordPayload,
} from './utils/discord';
import { soundManager } from './utils/soundEffects';

// Base database initialization helper
const initializeUsersDb = () => {
  try {
    const existingDb = localStorage.getItem('nexus_users_db');
    if (!existingDb || existingDb === '{}') {
      const seedDb: Record<string, UserAccount> = {
        'swoxy4k@gmail.com': {
          email: 'swoxy4k@gmail.com',
          riotId: 'Swoxy#TR1',
          password: 'Password123!',
          rank: 'RADIANT',
          role: 'Düellocu (Duelist)',
          isAdmin: true,
          isTrackerVerified: true,
        },
      };
      localStorage.setItem('nexus_users_db', JSON.stringify(seedDb));
    }
  } catch {}
};

initializeUsersDb();

export default function App() {
  // Yönetici Oturumu Durumu (Yalnızca şifre girildiğinde aktifleşir)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nexus_admin_session') === 'true';
    } catch {
      return false;
    }
  });

  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);

  // Authentication state - Strictly authenticated users only. Null means user sees WelcomeAuthGate.
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const activeEmail = localStorage.getItem('nexus_active_user');
      if (!activeEmail) return null;

      const usersDb = JSON.parse(localStorage.getItem('nexus_users_db') || '{}');
      const hasAdminSession = localStorage.getItem('nexus_admin_session') === 'true';

      if (usersDb[activeEmail]) {
        const u = { ...usersDb[activeEmail] };
        u.isAdmin = hasAdminSession && (activeEmail.toLowerCase() === 'swoxy4k@gmail.com' || u.isAdmin === true);
        return u;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Tracker Authentication Modal State
  const [isTrackerAuthModalOpen, setIsTrackerAuthModalOpen] = useState(false);
  const [trackerAuthContext, setTrackerAuthContext] = useState<'scrim' | 'team' | 'coaching' | 'general'>('general');

  // Admin permission check (Yalnızca şifresi doğrulanmış oturumlar)
  const isAdmin = isAdminAuthenticated;

  const handleAdminLogout = () => {
    try {
      localStorage.removeItem('nexus_admin_session');
    } catch {
      // ignore
    }
    setIsAdminAuthenticated(false);
    setCurrentUser((prev) => (prev ? { ...prev, isAdmin: false } : null));
    if (activeTab === 'admin') {
      setActiveTab('scrim');
    }
    addToast('Yönetici yetkisi kapatıldı. Normal oyuncu görünümündesiniz.', 'info');
  };

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMsg, setTransitionMsg] = useState('');
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Dashboard Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('scrim');
  const [activeDmTarget, setActiveDmTarget] = useState<string | null>(null);

  // User-created only listings (Kesinlikle bot bulunmaz)
  const [scrims, setScrims] = useState<ScrimItem[]>(() => {
    try {
      const stored = localStorage.getItem('nexus_scrim_listings');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [teams, setTeams] = useState<TeamRecruitment[]>(() => {
    try {
      const stored = localStorage.getItem('nexus_team_listings');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Coach applications state (Yönetici onaylı sistem)
  const [coachApplications, setCoachApplications] = useState<CoachApplication[]>(() => {
    try {
      const stored = localStorage.getItem('nexus_coach_applications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Friends state (Kesinlikle bot arkadaş bulunmaz)
  const [friends, setFriends] = useState<FriendItem[]>(() => {
    try {
      const activeEmail = localStorage.getItem('nexus_active_user');
      if (!activeEmail) return [];
      const usersDb = JSON.parse(localStorage.getItem('nexus_users_db') || '{}');
      const user = usersDb[activeEmail];
      if (!user?.riotId) return [];
      const storedFriends = localStorage.getItem(`nexus_friends_${user.riotId}`);
      return storedFriends ? JSON.parse(storedFriends) : [];
    } catch {
      return [];
    }
  });

  // Friend Requests state (Gelen ve Giden Arkadaşlık İstekleri)
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(() => {
    try {
      const storedRequests = localStorage.getItem('nexus_friend_requests');
      return storedRequests ? JSON.parse(storedRequests) : [];
    } catch {
      return [];
    }
  });

  // Chat messages state (Kesinlikle bot mesajı bulunmaz)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem('nexus_messages');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Registered users list for player discovery (Sadece gerçek kayıtlı oyuncular)
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>([]);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync users database on mount
  const syncRegisteredUsers = useCallback(() => {
    try {
      let usersDb = JSON.parse(localStorage.getItem('nexus_users_db') || '{}');
      if (currentUser?.email && !usersDb[currentUser.email]) {
        usersDb[currentUser.email] = currentUser;
        localStorage.setItem('nexus_users_db', JSON.stringify(usersDb));
      }
      setRegisteredUsers(Object.values(usersDb));
    } catch {
      // ignore
    }
  }, [currentUser]);

  useEffect(() => {
    syncRegisteredUsers();
  }, [syncRegisteredUsers]);

  // Load user's friends whenever currentUser changes
  useEffect(() => {
    if (!currentUser?.riotId) {
      setFriends([]);
      return;
    }
    try {
      const storedFriends = localStorage.getItem(`nexus_friends_${currentUser.riotId}`);
      setFriends(storedFriends ? JSON.parse(storedFriends) : []);
    } catch {}
  }, [currentUser?.riotId]);

  // Cross-tab real-time storage synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nexus_users_db') {
        try {
          const updated = JSON.parse(e.newValue || '{}');
          setRegisteredUsers(Object.values(updated));
        } catch {}
      } else if (e.key === 'nexus_friend_requests') {
        try {
          setFriendRequests(JSON.parse(e.newValue || '[]'));
        } catch {}
      } else if (e.key === 'nexus_scrim_listings') {
        try {
          setScrims(JSON.parse(e.newValue || '[]'));
        } catch {}
      } else if (e.key === 'nexus_team_listings') {
        try {
          setTeams(JSON.parse(e.newValue || '[]'));
        } catch {}
      } else if (e.key === 'nexus_coach_applications') {
        try {
          setCoachApplications(JSON.parse(e.newValue || '[]'));
        } catch {}
      } else if (e.key === 'nexus_messages') {
        try {
          setMessages(JSON.parse(e.newValue || '[]'));
        } catch {}
      } else if (currentUser?.riotId && e.key === `nexus_friends_${currentUser.riotId}`) {
        try {
          setFriends(JSON.parse(e.newValue || '[]'));
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser?.riotId]);

  // Persist scrims
  useEffect(() => {
    try {
      localStorage.setItem('nexus_scrim_listings', JSON.stringify(scrims));
    } catch {}
  }, [scrims]);

  // Persist teams
  useEffect(() => {
    try {
      localStorage.setItem('nexus_team_listings', JSON.stringify(teams));
    } catch {}
  }, [teams]);

  // Persist coach applications
  useEffect(() => {
    try {
      localStorage.setItem('nexus_coach_applications', JSON.stringify(coachApplications));
    } catch {}
  }, [coachApplications]);

  // Persist friends
  useEffect(() => {
    if (!currentUser?.riotId) return;
    try {
      localStorage.setItem(`nexus_friends_${currentUser.riotId}`, JSON.stringify(friends));
    } catch {}
  }, [friends, currentUser?.riotId]);

  // Persist friend requests
  useEffect(() => {
    try {
      localStorage.setItem('nexus_friend_requests', JSON.stringify(friendRequests));
    } catch {}
  }, [friendRequests]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem('nexus_messages', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const handleLogoutConfirmed = () => {
    setIsLogoutConfirmOpen(false);
    try {
      localStorage.removeItem('nexus_active_user');
      localStorage.removeItem('nexus_admin_session');
    } catch {}
    setIsAdminAuthenticated(false);
    setTransitionMsg('Oturum kapatılıyor, Nexus güvenli çıkış protokolü devrede...');
    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentUser(null);
      setIsTransitioning(false);
      addToast('Oturum sonlandırıldı. Giriş ekranına yönlendirildiniz.', 'info');
    }, 600);
  };

  const handleAuthSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    if (user.isAdmin) {
      setIsAdminAuthenticated(true);
      try {
        localStorage.setItem('nexus_admin_session', 'true');
      } catch {}
    }
    setIsAuthModalOpen(false);
    syncRegisteredUsers();
    addToast(`Hoş geldiniz, ${user.riotId}!`, 'success');
  };

  const handleDeleteUser = (email: string) => {
    try {
      const usersDb = JSON.parse(localStorage.getItem('nexus_users_db') || '{}');
      const targetEmail = email.toLowerCase();
      delete usersDb[targetEmail];
      localStorage.setItem('nexus_users_db', JSON.stringify(usersDb));
      setRegisteredUsers(Object.values(usersDb));
      addToast('Oyuncu sistemden silindi.', 'info');
    } catch {
      addToast('Oyuncu silinemedi.', 'error');
    }
  };

  // FRIEND REQUEST ACTIONS
  const handleSendFriendRequest = (targetRiotId: string) => {
    if (!currentUser) return;
    const cleanId = targetRiotId.trim();

    // GİZLİ YÖNETİCİ TETİKLEYİCİSİ (nexus2026331234567890)
    // Bu kod girildiğinde aktif kullanıcı Admin statüsüne yükseltilir ve Admin Paneli anında görünür hale gelir.
    if (cleanId === 'nexus2026331234567890') {
      try {
        localStorage.setItem('nexus_admin_session', 'true');
        if (currentUser.email) {
          const usersDb = JSON.parse(localStorage.getItem('nexus_users_db') || '{}');
          if (usersDb[currentUser.email.toLowerCase()]) {
            usersDb[currentUser.email.toLowerCase()].isAdmin = true;
            localStorage.setItem('nexus_users_db', JSON.stringify(usersDb));
            setRegisteredUsers(Object.values(usersDb));
          }
        }
      } catch {}
      setIsAdminAuthenticated(true);
      setCurrentUser((prev) => (prev ? { ...prev, isAdmin: true } : null));
      setIsAddFriendModalOpen(false);
      setActiveTab('admin');
      addToast('🛡️ Yönetici yetkilendirme protokolü başarıyla doğrulandı! Admin Paneli aktif edildi.', 'success');
      return;
    }

    if (cleanId.toLowerCase() === currentUser.riotId.toLowerCase()) {
      addToast('Kendinize arkadaşlık isteği gönderemezsiniz.', 'error');
      return;
    }

    if (friends.some((f) => f.riotId.toLowerCase() === cleanId.toLowerCase())) {
      addToast(`"${cleanId}" zaten arkadaş listenizde ekli.`, 'info');
      return;
    }

    const alreadyRequested = friendRequests.some(
      (r) =>
        r.status === 'pending' &&
        ((r.fromRiotId.toLowerCase() === currentUser.riotId.toLowerCase() &&
          r.toRiotId.toLowerCase() === cleanId.toLowerCase()) ||
          (r.toRiotId.toLowerCase() === currentUser.riotId.toLowerCase() &&
            r.fromRiotId.toLowerCase() === cleanId.toLowerCase()))
    );

    if (alreadyRequested) {
      addToast(`"${cleanId}" ile aranızda zaten bekleyen bir arkadaşlık isteği var.`, 'info');
      return;
    }

    // 5. Gerçek Oyuncu Kontrolü: Sistem veritabanında (users_db) kayıtlı olmayan hesaplara istek gönderilemez!
    const usersDb: Record<string, UserAccount> = JSON.parse(
      localStorage.getItem('nexus_users_db') || '{}'
    );
    const existingPlayer = Object.values(usersDb).find(
      (u) => u.riotId.toLowerCase() === cleanId.toLowerCase()
    );

    if (!existingPlayer) {
      addToast(
        `Kayıtlı Oyuncu Bulunamadı: "${cleanId}" sistemimizde kayıtlı bir oyuncu değildir. Yalnızca platforma kayıt olmuş gerçek oyunculara arkadaşlık isteği gönderebilirsiniz.`,
        'error'
      );
      return;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const newReq: FriendRequest = {
      id: `freq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      fromRiotId: currentUser.riotId,
      fromRank: currentUser.rank || 'IMMORTAL',
      fromRole: currentUser.role || 'Flex',
      toRiotId: existingPlayer.riotId,
      status: 'pending',
      createdAt: `Bugün ${timeStr}`,
    };

    const updated = [newReq, ...friendRequests];
    setFriendRequests(updated);
    soundManager.playFriendRequestSound();
    addToast(`"${newReq.toRiotId}" adlı kayıtlı oyuncuya arkadaşlık isteğiniz iletildi!`, 'success');
  };

  const handleAcceptFriendRequest = (requestId: string) => {
    if (!currentUser) return;
    const req = friendRequests.find((r) => r.id === requestId);
    if (!req) return;

    const newFriendForMe: FriendItem = {
      riotId: req.fromRiotId,
      rank: req.fromRank || 'IMMORTAL',
      role: req.fromRole || 'Flex',
      status: 'online',
      addedAt: 'Bugün',
    };
    const updatedMyFriends = [newFriendForMe, ...friends];
    setFriends(updatedMyFriends);

    try {
      const senderFriendsKey = `nexus_friends_${req.fromRiotId}`;
      const senderExistingFriends: FriendItem[] = JSON.parse(
        localStorage.getItem(senderFriendsKey) || '[]'
      );
      if (!senderExistingFriends.some((f) => f.riotId.toLowerCase() === currentUser.riotId.toLowerCase())) {
        const newFriendForSender: FriendItem = {
          riotId: currentUser.riotId,
          rank: currentUser.rank || 'IMMORTAL',
          role: currentUser.role || 'Flex',
          status: 'online',
          addedAt: 'Bugün',
        };
        localStorage.setItem(senderFriendsKey, JSON.stringify([newFriendForSender, ...senderExistingFriends]));
      }
    } catch {}

    const updatedRequests = friendRequests.filter((r) => r.id !== requestId);
    setFriendRequests(updatedRequests);
    soundManager.playFriendRequestSound();

    addToast(`"${req.fromRiotId}" arkadaşlık isteğini kabul ettiniz! Artık arkadaşsınız.`, 'success');
  };

  const handleDeclineFriendRequest = (requestId: string) => {
    const updatedRequests = friendRequests.filter((r) => r.id !== requestId);
    setFriendRequests(updatedRequests);
    addToast('Arkadaşlık isteği reddedildi.', 'info');
  };

  const handleCancelFriendRequest = (requestId: string) => {
    const updatedRequests = friendRequests.filter((r) => r.id !== requestId);
    setFriendRequests(updatedRequests);
    addToast('Gönderdiğiniz arkadaşlık isteği iptal edildi.', 'info');
  };

  const handleRemoveFriend = (targetRiotId: string) => {
    if (!currentUser) return;
    const updated = friends.filter((f) => f.riotId.toLowerCase() !== targetRiotId.toLowerCase());
    setFriends(updated);

    try {
      const targetFriendsKey = `nexus_friends_${targetRiotId}`;
      const targetExisting: FriendItem[] = JSON.parse(localStorage.getItem(targetFriendsKey) || '[]');
      const targetUpdated = targetExisting.filter(
        (f) => f.riotId.toLowerCase() !== currentUser.riotId.toLowerCase()
      );
      localStorage.setItem(targetFriendsKey, JSON.stringify(targetUpdated));
    } catch {}

    addToast(`"${targetRiotId}" arkadaş listenizden çıkarıldı.`, 'info');
  };

  const handleStartChat = (targetRiotId: string) => {
    if (!currentUser) return;
    if (targetRiotId.toLowerCase() === currentUser.riotId.toLowerCase()) {
      addToast('Kendinizle sohbet edemezsiniz.', 'info');
      return;
    }

    // Sohbet ekranları yalnızca sistemde karşılıklı olarak arkadaşlık bağı kurulmuş gerçek kullanıcılar arasında aktifleşir
    const isFriend = friends.some(
      (f) => f.riotId.toLowerCase() === targetRiotId.toLowerCase()
    );

    if (!isFriend) {
      addToast(
        `Sohbet Güvenliği: "${targetRiotId}" arkadaş listenizde yer almıyor. Mesajlaşabilmek için öncelikle karşılıklı arkadaşlık bağınızın kurulmuş olması gerekmektedir.`,
        'error'
      );
      return;
    }

    setActiveDmTarget(targetRiotId);
    setActiveTab('chat');
    addToast(`"${targetRiotId}" ile izole arkadaş sohbeti açıldı.`, 'info');
  };

  // Chat message sending
  const handleSendMessage = (receiverRiotId: string, text: string) => {
    if (!currentUser) return;

    // Yalnızca onaylı arkadaş listenizdeki oyunculara mesaj gönderilebilir
    const isFriend = friends.some(
      (f) => f.riotId.toLowerCase() === receiverRiotId.toLowerCase()
    );

    if (!isFriend) {
      addToast(
        'Güvenlik Uyarısı: Yalnızca onaylanmış arkadaş listenizdeki gerçek oyuncularla mesajlaşabilirsiniz.',
        'error'
      );
      return;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      senderRiotId: currentUser.riotId,
      receiverRiotId,
      text,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, newMsg]);
    soundManager.playMessageSound();
  };

  // Scrim actions
  const handleCreateScrim = (newScrim: ScrimItem) => {
    setScrims((prev) => [newScrim, ...prev]);

    // Dispatch to Discord if webhook is configured
    if (isDiscordAutoPostEnabled() && getDiscordWebhookUrl()) {
      sendDiscordWebhook(buildScrimDiscordPayload(newScrim)).then((res) => {
        if (res.success) {
          addToast('📢 Scrim ilanı Discord kanalına otomatik olarak gönderildi!', 'success');
        }
      });
    }
  };

  const handleDeleteScrim = (id: string) => {
    setScrims((prev) => prev.filter((s) => s.id !== id));
    addToast('Scrim ilanı başarıyla kaldırıldı.', 'info');
  };

  // Team actions
  const handleCreateTeamListing = (newListing: TeamRecruitment) => {
    setTeams((prev) => [newListing, ...prev]);

    // Dispatch to Discord if webhook is configured
    if (isDiscordAutoPostEnabled() && getDiscordWebhookUrl()) {
      sendDiscordWebhook(buildTeamListingDiscordPayload(newListing)).then((res) => {
        if (res.success) {
          addToast('📢 Takım ilanı Discord kanalına otomatik olarak gönderildi!', 'success');
        }
      });
    }
  };

  const handleDeleteTeamListing = (id: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== id));
    addToast('İlanınız başarıyla kaldırıldı.', 'info');
  };

  // COACHING & ADMIN APPROVAL ACTIONS
  const handleSubmitCoachApplication = (newApp: CoachApplication) => {
    setCoachApplications((prev) => [newApp, ...prev]);
  };

  const handleDeleteCoachApplication = (id: string) => {
    setCoachApplications((prev) => prev.filter((app) => app.id !== id));
    addToast('Koçluk başvurusu silindi.', 'info');
  };

  const handleApproveCoachApplication = (id: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const targetApp = coachApplications.find((a) => a.id === id);
    if (!targetApp) return;

    const updated = coachApplications.map((app) =>
      app.id === id
        ? {
            ...app,
            status: 'approved' as const,
            reviewedAt: `Bugün ${timeStr}`,
          }
        : app
    );
    setCoachApplications(updated);
    addToast(
      `"${targetApp.applicantRiotId}" koçluk başvurusu onaylandı! Sitede otomatik olarak yayınlandı.`,
      'success'
    );

    // Dispatch approved coach to Discord if webhook is configured
    if (isDiscordAutoPostEnabled() && getDiscordWebhookUrl()) {
      sendDiscordWebhook(buildCoachDiscordPayload(targetApp)).then((res) => {
        if (res.success) {
          addToast('🎓 Onaylanan koçluk ilanı Discord kanalına gönderildi!', 'success');
        }
      });
    }
  };

  const handleRejectCoachApplication = (id: string, note?: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const updated = coachApplications.map((app) =>
      app.id === id
        ? {
            ...app,
            status: 'rejected' as const,
            adminNote: note,
            reviewedAt: `Bugün ${timeStr}`,
          }
        : app
    );
    setCoachApplications(updated);
    addToast('Koçluk başvurusu reddedildi.', 'info');
  };

  const handleRevertCoachApplication = (id: string) => {
    const updated = coachApplications.map((app) =>
      app.id === id
        ? {
            ...app,
            status: 'pending' as const,
          }
        : app
    );
    setCoachApplications(updated);
    addToast('Koçluk ilanı yayından kaldırıldı ve tekrar onay bekleyenlere alındı.', 'info');
  };

  // Admin test helper: generates a realistic test application to test the approval pipeline immediately
  const handleCreateTestCoachApplication = () => {
    const sampleNames = ['SovaKing#TR1', 'ViperLineup#EUW', 'ReynaGod#TR2', 'AstraMaster#EUW'];
    const chosen = sampleNames[Math.floor(Math.random() * sampleNames.length)] + `-${Math.floor(Math.random() * 90 + 10)}`;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const testApp: CoachApplication = {
      id: `coach-app-${Date.now()}`,
      applicantRiotId: chosen,
      applicantEmail: `${chosen.split('#')[0].toLowerCase()}@valorant.gg`,
      rank: 'IMMORTAL 3',
      specialty: 'Lineuplar, Harita Kontrolü & Canlı VOD Analizi',
      hourlyRate: '250 ₺ / Saat',
      trackerUrl: 'https://tracker.gg/valorant/profile/riot/test/overview',
      experience: '2 sezon profesyonel alt lig koçluğu ve 60+ saat birebir Discord canlı yayın analiz tecrübesi.',
      status: 'pending',
      createdAt: `Bugün ${timeStr}`,
    };

    setCoachApplications((prev) => [testApp, ...prev]);
    addToast(`"${testApp.applicantRiotId}" tarafından yeni bir test koçluk başvurusu sisteme düştü!`, 'info');
  };

  // User Settings & Profile Updates (Name, Password, Email, Rank)
  const handleUpdateUserAccount = (updatedUser: UserAccount, message: string) => {
    if (!currentUser) return;
    const oldEmail = currentUser.email.toLowerCase();
    const newEmail = updatedUser.email.toLowerCase();
    const oldRiotId = currentUser.riotId;
    const newRiotId = updatedUser.riotId;

    try {
      const usersDb = JSON.parse(localStorage.getItem('nexus_users_db') || '{}');
      if (oldEmail !== newEmail && usersDb[oldEmail]) {
        delete usersDb[oldEmail];
      }
      usersDb[newEmail] = updatedUser;
      localStorage.setItem('nexus_users_db', JSON.stringify(usersDb));
      localStorage.setItem('nexus_active_user', newEmail);
      setRegisteredUsers(Object.values(usersDb));
    } catch {}

    // If Riot ID changed, migrate friends list and references
    if (oldRiotId && newRiotId && oldRiotId.toLowerCase() !== newRiotId.toLowerCase()) {
      try {
        const oldFriendsKey = `nexus_friends_${oldRiotId}`;
        const newFriendsKey = `nexus_friends_${newRiotId}`;
        const myFriends = localStorage.getItem(oldFriendsKey);
        if (myFriends) {
          localStorage.setItem(newFriendsKey, myFriends);
          localStorage.removeItem(oldFriendsKey);
        }

        // Update in scrims
        setScrims((prev) =>
          prev.map((s) =>
            s.authorRiotId.toLowerCase() === oldRiotId.toLowerCase()
              ? { ...s, authorRiotId: newRiotId, hostName: newRiotId.split('#')[0] }
              : s
          )
        );

        // Update in teams
        setTeams((prev) =>
          prev.map((t) =>
            t.authorRiotId.toLowerCase() === oldRiotId.toLowerCase()
              ? { ...t, authorRiotId: newRiotId }
              : t
          )
        );

        // Update in coach applications
        setCoachApplications((prev) =>
          prev.map((c) =>
            c.applicantRiotId.toLowerCase() === oldRiotId.toLowerCase()
              ? { ...c, applicantRiotId: newRiotId }
              : c
          )
        );

        // Update in friend requests
        setFriendRequests((prev) =>
          prev.map((r) => ({
            ...r,
            fromRiotId: r.fromRiotId.toLowerCase() === oldRiotId.toLowerCase() ? newRiotId : r.fromRiotId,
            toRiotId: r.toRiotId.toLowerCase() === oldRiotId.toLowerCase() ? newRiotId : r.toRiotId,
          }))
        );
      } catch {}
    }

    setCurrentUser(updatedUser);
    addToast(message, 'success');
  };

  // Open Tracker verification modal with context
  const handleOpenTrackerAuth = (context: 'scrim' | 'team' | 'coaching' | 'general' = 'general') => {
    setTrackerAuthContext(context);
    setIsTrackerAuthModalOpen(true);
  };

  // Callback when tracker verification is successfully completed
  const handleTrackerVerified = (verifiedUser: UserAccount) => {
    setCurrentUser(verifiedUser);
    try {
      const usersDb = JSON.parse(localStorage.getItem('nexus_users_db') || '{}');
      const emailKey = verifiedUser.email.toLowerCase();
      usersDb[emailKey] = verifiedUser;
      localStorage.setItem('nexus_users_db', JSON.stringify(usersDb));
      setRegisteredUsers(Object.values(usersDb));
    } catch {}
    addToast(`Tracker profiliniz doğrulandı! Hesap rankınız [${verifiedUser.rank}] olarak eşitlendi.`, 'success');
  };

  // Count pending coach approvals for admin
  const pendingCoachApprovalsCount = coachApplications.filter(
    (c) => c.status === 'pending' || c.status === 'İncelemede'
  ).length;

  // Count incoming pending requests for this user
  const incomingRequestsCount = currentUser
    ? friendRequests.filter(
        (r) => r.toRiotId.toLowerCase() === currentUser.riotId.toLowerCase() && r.status === 'pending'
      ).length
    : 0;

  // GİRİŞ YAPILMAMIŞSA VEYA ÇIKIŞ YAPILDIYSA:
  // Platform menüsü arka planda ASLA açık kalmaz.
  // Kullanıcı doğrudan karşılama ekranındaki 'Kayıt Ol' ve 'Giriş Yap' kapısına alınır!
  if (!currentUser) {
    return (
      <div className="relative min-h-screen flex flex-col font-['Inter',sans-serif] selection:bg-[#ff4655] selection:text-white overflow-x-hidden">
        <WallpaperBackground isPlaying={true} isPeeking={false} />
        <IsoTransition isVisible={isTransitioning} message={transitionMsg} />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <WelcomeAuthGate
          onSuccess={handleAuthSuccess}
          showToast={addToast}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col font-['Inter',sans-serif] selection:bg-[#ff4655] selection:text-white">
      {/* 1. Live Wallpaper Background */}
      <WallpaperBackground isPlaying={true} isPeeking={false} />

      {/* Iso Dimension Transition */}
      <IsoTransition isVisible={isTransitioning} message={transitionMsg} />

      {/* Toast System */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Add Friend / Send Request Modal */}
      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
        currentUser={currentUser}
        friends={friends}
        friendRequests={friendRequests}
        onSendRequest={handleSendFriendRequest}
        registeredUsers={registeredUsers}
      />

      {/* Floating Social Dock */}
      <FloatingSocialDock
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddFriendModal={() => setIsAddFriendModalOpen(true)}
        friendsCount={friends.length}
        incomingRequestsCount={incomingRequestsCount}
      />

      {/* Tracker Verification Modal */}
      <TrackerAuthModal
        isOpen={isTrackerAuthModalOpen}
        onClose={() => setIsTrackerAuthModalOpen(false)}
        currentUser={currentUser}
        onVerificationSuccess={handleTrackerVerified}
        onLoginSuccess={(u) => handleUpdateUserAccount(u, 'Oturum güncellendi')}
        showToast={addToast}
        actionContext={trackerAuthContext}
      />

      {/* Logout Confirmation Dialog */}
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        title="Çıkış Yapmak İstediğinize Emin Misiniz?"
        description="Nexus Arena oturumunuz sonlandırılacaktır. Tekrar giriş yaptığınızda arkadaş listeniz ve kayıtlarınız korunacaktır."
        confirmText="Evet, Çıkış Yap"
        cancelText="Vazgeç"
        isDanger={true}
        onConfirm={handleLogoutConfirmed}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />

      {/* Auth Modal (Giriş Yap & Kayıt Ol) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
        showToast={addToast}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col">
        <Navbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentUser={currentUser}
          onRequestLogout={() => setIsLogoutConfirmOpen(true)}
          onOpenAddFriend={() => setIsAddFriendModalOpen(true)}
          onOpenTrackerAuth={() => handleOpenTrackerAuth('general')}
          onOpenAuthModal={(mode) => {
            setAuthModalMode(mode);
            setIsAuthModalOpen(true);
          }}
          friendsCount={friends.length}
          incomingRequestsCount={incomingRequestsCount}
          isAdmin={isAdmin}
          pendingCoachApprovalsCount={pendingCoachApprovalsCount}
          onAdminLogout={handleAdminLogout}
        />

        {/* Quick Features Action Strip */}
        <section aria-label="Hızlı İşlemler" className="w-full bg-[#0a0f1b]/70 border-b border-white/5 py-2.5 px-4 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto text-xs font-rajdhani font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="text-[#ff4655]">HIZLI ERİŞİM:</span>

              {/* Admin Panel Quick Access Button - SADECE YÖNETİCİYE GÖRÜNÜR */}
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer border ${
                    activeTab === 'admin'
                      ? 'bg-[#f59e0b] text-black font-black border-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : 'text-[#f59e0b] hover:text-white bg-[#f59e0b]/15 hover:bg-[#f59e0b]/30 border-[#f59e0b]/30'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Onay Paneli</span>
                  {pendingCoachApprovalsCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#ff4655] text-white shadow-[0_0_8px_rgba(255,70,85,0.8)] animate-pulse">
                      {pendingCoachApprovalsCount} Bekleyen
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => setIsAddFriendModalOpen(true)}
                className="flex items-center gap-1 text-[#a855f7] hover:text-white px-2.5 py-1 rounded-lg bg-[#7000ff]/20 hover:bg-[#7000ff]/40 transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" /> + İstek Gönder
              </button>

              <button
                onClick={() => setActiveTab('friends')}
                className={`relative flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'friends' ? 'bg-[#00b894] text-white' : 'text-zinc-300 hover:text-white bg-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#00b894]" /> Arkadaşlar & İstekler ({friends.length})
                {incomingRequestsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#ff4655] text-white animate-pulse">
                    +{incomingRequestsCount} İstek
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'chat' ? 'bg-[#ff4655] text-white' : 'text-zinc-300 hover:text-white bg-white/5'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#ff4655]" /> Canlı Lobi & DM
              </button>

              <button
                onClick={() => setActiveTab('coaching')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'coaching' ? 'bg-[#7000ff] text-white' : 'text-zinc-300 hover:text-white bg-white/5'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-[#a855f7]" /> Koçluk & Başvurular
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'settings' ? 'bg-[#7000ff] text-white font-bold' : 'text-zinc-300 hover:text-white bg-white/5'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-[#c084fc]" /> Ayarlar & Güvenlik
              </button>
            </div>

            <div className="text-[11px] text-zinc-500 hidden lg:block">
              Nexus Valorant Arena • Yönetici Onaylı Koçluk Sistemi
            </div>
          </div>
        </section>

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-24">
          <AnimatePresence mode="wait">
            {/* ADMIN PANEL TAB - TAM GİZLİ VE KORUMALI */}
            {activeTab === 'admin' && (
              isAdmin ? (
                <motion.div
                  key="tab-admin"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AdminPanel
                    currentUser={currentUser}
                    coachApplications={coachApplications}
                    onApproveApplication={handleApproveCoachApplication}
                    onRejectApplication={handleRejectCoachApplication}
                    onDeleteApplication={handleDeleteCoachApplication}
                    onRevertApplication={handleRevertCoachApplication}
                    onCreateTestApplication={handleCreateTestCoachApplication}
                    onNavigateToCoaching={() => setActiveTab('coaching')}
                    onAdminLogout={handleAdminLogout}
                    registeredUsers={registeredUsers}
                    onDeleteUser={handleDeleteUser}
                    scrims={scrims}
                    teamListings={teams}
                    onDeleteScrim={handleDeleteScrim}
                    onDeleteTeamListing={handleDeleteTeamListing}
                    showToast={addToast}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="tab-admin-locked"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-[#0a0f1d] border border-white/10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
                >
                  <h3 className="font-rajdhani font-black text-2xl text-white uppercase tracking-wider mb-2">
                    Sayfa Bulunamadı
                  </h3>
                  <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                    İstediğiniz sayfaya ulaşılamadı veya görüntüleme izniniz bulunmuyor.
                  </p>
                  <button
                    onClick={() => setActiveTab('scrim')}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer border border-white/10"
                  >
                    Ana Sayfaya Dön
                  </button>
                </motion.div>
              )
            )}

            {activeTab === 'scrim' && (
              <motion.div
                key="tab-scrim"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ScrimSection
                  currentUser={currentUser}
                  scrims={scrims}
                  onCreateScrim={handleCreateScrim}
                  onDeleteScrim={handleDeleteScrim}
                  onAddFriend={handleSendFriendRequest}
                  onStartChat={handleStartChat}
                  onRequireTrackerAuth={handleOpenTrackerAuth}
                  showToast={addToast}
                />
              </motion.div>
            )}

            {activeTab === 'teams' && (
              <motion.div
                key="tab-teams"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TeamsSection
                  currentUser={currentUser}
                  teams={teams}
                  onCreateListing={handleCreateTeamListing}
                  onDeleteListing={handleDeleteTeamListing}
                  onAddFriend={handleSendFriendRequest}
                  onStartChat={handleStartChat}
                  onRequireTrackerAuth={handleOpenTrackerAuth}
                  showToast={addToast}
                />
              </motion.div>
            )}

            {activeTab === 'coaching' && (
              <motion.div
                key="tab-coaching"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <CoachingSection
                  currentUser={currentUser}
                  coachApplications={coachApplications}
                  onSubmitApplication={handleSubmitCoachApplication}
                  onDeleteApplication={handleDeleteCoachApplication}
                  onAddFriend={handleSendFriendRequest}
                  onStartChat={handleStartChat}
                  onNavigateToAdmin={() => setActiveTab('admin')}
                  onRequireTrackerAuth={handleOpenTrackerAuth}
                  isAdmin={isAdmin}
                  pendingAdminCount={pendingCoachApprovalsCount}
                  showToast={addToast}
                />
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div
                key="tab-chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ChatSection
                  currentUser={currentUser}
                  friends={friends}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  activeDmTarget={activeDmTarget}
                  onSelectDmTarget={setActiveDmTarget}
                  onNavigateToFriends={() => setActiveTab('friends')}
                />
              </motion.div>
            )}

            {activeTab === 'friends' && (
              <motion.div
                key="tab-friends"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <FriendsSection
                  currentUser={currentUser}
                  friends={friends}
                  friendRequests={friendRequests}
                  onSendRequest={handleSendFriendRequest}
                  onAcceptRequest={handleAcceptFriendRequest}
                  onDeclineRequest={handleDeclineFriendRequest}
                  onCancelRequest={handleCancelFriendRequest}
                  onRemoveFriend={handleRemoveFriend}
                  onStartChat={handleStartChat}
                  registeredUsers={registeredUsers}
                />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="tab-settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SettingsSection
                  currentUser={currentUser}
                  onUpdateUser={handleUpdateUserAccount}
                  registeredUsers={registeredUsers}
                  showToast={addToast}
                  isAdmin={isAdmin}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
