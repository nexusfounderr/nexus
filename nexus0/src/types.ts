export interface TrackerStats {
  kd: string;
  winRate: string;
  headshot: string;
  peakRank: string;
  matchesPlayed?: number;
}

export interface UserAccount {
  email: string;
  riotId: string;
  password?: string;
  rank?: string;
  role?: string;
  avatar?: string;
  bio?: string;
  isAdmin?: boolean;
  // Tracker.gg Verification
  trackerUrl?: string;
  isTrackerVerified?: boolean;
  trackerStats?: TrackerStats;
  verifiedAt?: string;
  // Email Verification
  isEmailVerified?: boolean;
  emailVerifiedAt?: string;
  // Cooldown timestamps
  lastUsernameChange?: string; // 7 gün cooldown
  lastPasswordChange?: string; // 3 gün cooldown
  lastEmailChange?: string;    // 7 gün cooldown
}

export interface ScrimItem {
  id: string;
  teamName: string;
  tag: string;
  rank: 'Ascendant' | 'Immortal' | 'Radiant' | 'Diamond' | 'Platinum';
  time: string;
  format: 'Bo1' | 'Bo3' | 'Bo5';
  maps: string[];
  slotsAvailable: number;
  hostName: string;
  authorRiotId: string;
  contact?: string;
  createdAt: string;
  authorTrackerUrl?: string;
  isTrackerVerified?: boolean;
  isNewlyCreated?: boolean;
}

export interface TeamRecruitment {
  id: string;
  type: 'LFP' | 'LFM'; // LFP = Oyuncu Takım Arıyor, LFM = Takım Oyuncu Arıyor
  title: string;
  authorRiotId: string;
  role: string;
  rank: string;
  schedule: string;
  description: string;
  contact: string;
  createdAt: string;
  authorTrackerUrl?: string;
  isTrackerVerified?: boolean;
  trackerStats?: TrackerStats;
  isNewlyCreated?: boolean;
}

export interface FriendItem {
  riotId: string;
  rank: string;
  role: string;
  status: 'online' | 'in-game' | 'offline';
  addedAt: string;
}

export interface FriendRequest {
  id: string;
  fromRiotId: string;
  fromRank: string;
  fromRole?: string;
  toRiotId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderRiotId: string;
  receiverRiotId: string; // 'global' or friend's riotId
  text: string;
  timestamp: string;
}

export interface CoachApplication {
  id: string;
  applicantRiotId: string;
  applicantEmail?: string;
  rank: string;
  specialty: string;
  hourlyRate: string;
  trackerUrl?: string;
  experience: string;
  status: 'pending' | 'approved' | 'rejected' | 'Aktif Koç' | 'İncelemede';
  adminNote?: string;
  reviewedAt?: string;
  createdAt: string;
}

export type ActiveTab = 'scrim' | 'teams' | 'coaching' | 'chat' | 'friends' | 'admin' | 'settings';
