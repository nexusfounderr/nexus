/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScrimItem, TeamRecruitment, CoachApplication } from '../types';

export const DISCORD_CONFIG = {
  serverInvite: 'https://discord.gg/khD8hQrZa',
  channelUrl: 'https://discord.com/channels/1551188402513379409/1552027675382648924',
  guildId: '1551188402513379409',
  channelId: '1552027675382648924',
  storageKey: 'nexus_discord_webhook_url',
  autoPostKey: 'nexus_discord_auto_post_enabled',
};

export function getDiscordWebhookUrl(): string {
  try {
    return localStorage.getItem(DISCORD_CONFIG.storageKey) || '';
  } catch {
    return '';
  }
}

export function setDiscordWebhookUrl(url: string): void {
  try {
    localStorage.setItem(DISCORD_CONFIG.storageKey, url.trim());
  } catch {}
}

export function isDiscordAutoPostEnabled(): boolean {
  try {
    const val = localStorage.getItem(DISCORD_CONFIG.autoPostKey);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setDiscordAutoPostEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(DISCORD_CONFIG.autoPostKey, enabled ? 'true' : 'false');
  } catch {}
}

/**
 * Sends a JSON payload to the configured Discord webhook.
 */
export async function sendDiscordWebhook(payload: any): Promise<{ success: boolean; message: string }> {
  const webhookUrl = getDiscordWebhookUrl();
  if (!webhookUrl) {
    return {
      success: false,
      message: 'Discord Webhook URL henüz tanımlanmamış. Yönetici panelinden Webhook URL ekleyebilirsiniz.',
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.status === 204) {
      return { success: true, message: 'İlan Discord kanalına başarıyla gönderildi!' };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        message: `Discord yanıtı: ${response.status} ${response.statusText} (${errorText})`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Discord bağlantı hatası: ${err.message || 'Ağ hatası'}`,
    };
  }
}

/**
 * Creates Discord Embed for a new Scrim listing
 */
export function buildScrimDiscordPayload(scrim: ScrimItem) {
  const mapStr = scrim.maps && scrim.maps.length > 0 ? scrim.maps.join(', ') : 'Veto / Belirtilmedi';
  return {
    username: 'Nexus Valorant Arena',
    avatar_url: 'https://images.contentstack.io/v3/assets/blt0eb2a2986b796d29/blt4ba0b51fdf792476/651f8ce1a6e9749174151e44/Valorant_Iso_Thumb.jpg',
    content: `📢 **YENİ SCRIM LOBİSİ AÇILDI!** <#${DISCORD_CONFIG.channelId}>`,
    embeds: [
      {
        title: `⚔️ [${scrim.tag}] ${scrim.teamName} • ${scrim.rank} Scrim Arayışı`,
        description: `**${scrim.authorRiotId}** tarafından yeni bir antrenman maçı ilanı açıldı.`,
        url: window.location.href,
        color: 16729685, // #FF4655 (Valorant Red)
        fields: [
          { name: '👤 Lobi Kurucusu', value: `\`${scrim.authorRiotId}\``, inline: true },
          { name: '🛡️ Takım', value: `**${scrim.teamName} [${scrim.tag}]**`, inline: true },
          { name: '🏆 Seviye / Rank', value: `**${scrim.rank}**`, inline: true },
          { name: '⏰ Maç Saati', value: `\`${scrim.time}\``, inline: true },
          { name: '🎮 Format', value: `\`${scrim.format}\``, inline: true },
          { name: '🗺️ Harita Tercihi', value: mapStr, inline: true },
          {
            name: '📊 Tracker.gg Durumu',
            value: scrim.isTrackerVerified
              ? `[✅ Doğrulanmış Profil](${scrim.authorTrackerUrl || 'https://tracker.gg/valorant'})`
              : 'Doğrulama Bekliyor',
            inline: true,
          },
          ...(scrim.contact
            ? [{ name: '📞 İletişim', value: `\`${scrim.contact}\``, inline: true }]
            : []),
        ],
        footer: {
          text: 'Nexus Valorant Arena • Otomatik İlan Servisi',
          icon_url: 'https://images.contentstack.io/v3/assets/blt0eb2a2986b796d29/blt4ba0b51fdf792476/651f8ce1a6e9749174151e44/Valorant_Iso_Thumb.jpg',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Creates Discord Embed for a new Team / Player listing
 */
export function buildTeamListingDiscordPayload(team: TeamRecruitment) {
  const isLfp = team.type === 'LFP';
  return {
    username: 'Nexus Valorant Arena',
    avatar_url: 'https://images.contentstack.io/v3/assets/blt0eb2a2986b796d29/blt4ba0b51fdf792476/651f8ce1a6e9749174151e44/Valorant_Iso_Thumb.jpg',
    content: `📢 **YENİ ${isLfp ? 'TAKIM ARAYIŞI (LFP)' : 'OYUNCU ARAYIŞI (LFM)'} İLANI!**`,
    embeds: [
      {
        title: `${isLfp ? '🛡️ [LFP] Oyuncu Takım Arıyor' : '🎯 [LFM] Takım Oyuncu Arıyor'} • ${team.role}`,
        description: `**${team.title}**\n${team.description}`,
        url: window.location.href,
        color: 7340287, // #7000FF (Iso Purple)
        fields: [
          { name: '👤 İlan Sahibi', value: `\`${team.authorRiotId}\``, inline: true },
          { name: '🎯 Aranan / Oynanan Rol', value: `**${team.role}**`, inline: true },
          { name: '🏆 Hedef Rank', value: `**${team.rank}**`, inline: true },
          { name: '📅 Çalışma / Antrenman Saatleri', value: team.schedule || 'Görüşülür', inline: true },
          { name: '📞 İletişim', value: `\`${team.contact}\``, inline: true },
          {
            name: '📊 Tracker.gg Profili',
            value: team.authorTrackerUrl
              ? `[Tracker.gg İstatistikleri](${team.authorTrackerUrl})`
              : 'Belirtilmedi',
            inline: true,
          },
        ],
        footer: {
          text: 'Nexus Valorant Arena • Takım & Yetenek Keşfi',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Creates Discord Embed for an Approved Coach listing
 */
export function buildCoachDiscordPayload(coach: CoachApplication) {
  return {
    username: 'Nexus Valorant Arena',
    avatar_url: 'https://images.contentstack.io/v3/assets/blt0eb2a2986b796d29/blt4ba0b51fdf792476/651f8ce1a6e9749174151e44/Valorant_Iso_Thumb.jpg',
    content: `🎓 **YENİ ONAYLI KOÇ SİTEDE YAYINDA!**`,
    embeds: [
      {
        title: `⭐ ${coach.rank} Onaylı Valorant Koçu`,
        description: `**${coach.applicantRiotId}** Nexus Admin tarafından onaylandı ve koçluk listesinde yerini aldı!`,
        url: window.location.href,
        color: 47252, // #00B894 (Emerald)
        fields: [
          { name: '🎓 Koç', value: `\`${coach.applicantRiotId}\``, inline: true },
          { name: '🏆 Rank', value: `**${coach.rank}**`, inline: true },
          { name: '💰 Tarife', value: `\`${coach.hourlyRate}\``, inline: true },
          { name: '🎯 Uzmanlık', value: coach.specialty, inline: false },
          { name: '📖 Koçluk Deneyimi', value: coach.experience, inline: false },
          ...(coach.trackerUrl
            ? [{ name: '📊 Tracker.gg', value: `[Profil İncele](${coach.trackerUrl})`, inline: true }]
            : []),
        ],
        footer: {
          text: 'Nexus Valorant Akademi • Yönetici Onaylı',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Creates a test payload to verify Webhook connectivity
 */
export function buildTestDiscordPayload(adminRiotId: string) {
  return {
    username: 'Nexus Valorant Arena (Test Botu)',
    avatar_url: 'https://images.contentstack.io/v3/assets/blt0eb2a2986b796d29/blt4ba0b51fdf792476/651f8ce1a6e9749174151e44/Valorant_Iso_Thumb.jpg',
    content: `⚡ **DİSCORD WEBHOOK BAĞLANTISI BAŞARILI!**`,
    embeds: [
      {
        title: '🎯 Nexus Arena x Discord Entegrasyonu Aktif',
        description: `Yönetici **${adminRiotId}** tarafından test bildirimi tetiklendi. Artık sitede açılan **scrimler**, **takım ilanları** ve **onaylanan koçlar** anında bu kanala otomatik düşecektir.`,
        url: window.location.href,
        color: 16096779, // #F59E0B (Amber)
        fields: [
          { name: '🖥️ Sunucu', value: `[Sunucuya Git](${DISCORD_CONFIG.serverInvite})`, inline: true },
          { name: '📢 Hedef Kanal', value: `<#${DISCORD_CONFIG.channelId}>`, inline: true },
          { name: '🟢 Durum', value: 'Canlı & Senkronize', inline: true },
        ],
        footer: {
          text: 'Nexus Arena Bot Testi',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
