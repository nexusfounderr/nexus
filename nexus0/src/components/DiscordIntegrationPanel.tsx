/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types';
import {
  DISCORD_CONFIG,
  getDiscordWebhookUrl,
  setDiscordWebhookUrl,
  isDiscordAutoPostEnabled,
  setDiscordAutoPostEnabled,
  sendDiscordWebhook,
  buildTestDiscordPayload,
} from '../utils/discord';
import {
  ExternalLink,
  Copy,
  Check,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Sliders,
  HelpCircle,
  Radio,
  Flame
} from 'lucide-react';

interface DiscordIntegrationPanelProps {
  currentUser: UserAccount;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DiscordIntegrationPanel: React.FC<DiscordIntegrationPanelProps> = ({
  currentUser,
  showToast,
}) => {
  const [webhookUrl, setWebhookUrlState] = useState('');
  const [autoPostEnabled, setAutoPostState] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState<'server' | 'channel' | 'webhook' | null>(null);

  useEffect(() => {
    setWebhookUrlState(getDiscordWebhookUrl());
    setAutoPostState(isDiscordAutoPostEnabled());
  }, []);

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = webhookUrl.trim();
    if (clean && !clean.includes('discord.com/api/webhooks/')) {
      showToast('Lütfen geçerli bir Discord Webhook URL giriniz (https://discord.com/api/webhooks/...)', 'error');
      return;
    }
    setDiscordWebhookUrl(clean);
    showToast(clean ? 'Discord Webhook URL başarıyla kaydedildi!' : 'Webhook URL temizlendi.', 'success');
  };

  const handleToggleAutoPost = () => {
    const next = !autoPostEnabled;
    setAutoPostState(next);
    setDiscordAutoPostEnabled(next);
    showToast(
      next ? 'Otomatik Discord ilan gönderimi aktif edildi.' : 'Otomatik Discord ilan gönderimi duraklatıldı.',
      'info'
    );
  };

  const handleSendTestWebhook = async () => {
    const current = webhookUrl.trim();
    if (!current) {
      showToast('Test mesajı gönderebilmek için önce bir Webhook URL girmelisiniz.', 'error');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    // Save first if not saved
    setDiscordWebhookUrl(current);

    const payload = buildTestDiscordPayload(currentUser.riotId);
    const result = await sendDiscordWebhook(payload);

    setIsTesting(false);
    setTestResult(result);

    if (result.success) {
      showToast('Test mesajı başarıyla Discord kanalına gönderildi!', 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const copyToClipboard = (text: string, type: 'server' | 'channel' | 'webhook') => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    showToast('Bağlantı panoya kopyalandı!', 'info');
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const isConfigured = !!webhookUrl.trim();

  return (
    <div className="space-y-6">
      {/* Discord Header Card */}
      <div className="rounded-2xl bg-gradient-to-r from-[#5865F2]/20 via-[#0e1424] to-[#7000ff]/20 border border-[#5865F2]/40 p-6 backdrop-blur-xl shadow-[0_15px_35px_rgba(0,0,0,0.5),0_0_25px_rgba(88,101,242,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#5865F2]/25 text-[#7983f5] border border-[#5865F2]/40 text-xs font-rajdhani font-bold uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 text-[#5865F2] animate-pulse" />
              DISCORD WEBSOCKET & WEBHOOK
            </span>
            {isConfigured ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Webhook Bağlı & Yayında
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold animate-pulse">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                Webhook Bekleniyor
              </span>
            )}
          </div>

          <h2 className="font-rajdhani font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
            Discord Otomatik İlan Entegrasyonu
          </h2>
          <p className="text-zinc-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Nexus Arena'da açılan yeni <strong>scrim lobileri</strong>, <strong>oyuncu/takım ilanları</strong> ve yönetici tarafından <strong>onaylanan koçluklar</strong>, belirlediğiniz Discord kanalına anında zengin Valorant kartı (Embed) olarak fırlatılır.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href={DISCORD_CONFIG.serverInvite}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-rajdhani font-bold text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(88,101,242,0.4)] transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Sunucuya Katıl</span>
          </a>

          <a
            href={DISCORD_CONFIG.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141c2e] hover:bg-[#1a253c] text-zinc-200 hover:text-white border border-white/10 font-rajdhani font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-[#5865F2]" />
            <span>İlan Kanalına Git</span>
          </a>
        </div>
      </div>

      {/* Target Server & Channel Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Server Card */}
        <div className="rounded-xl bg-[#0e1424]/80 border border-white/10 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-rajdhani font-bold uppercase tracking-wider text-[#7983f5] flex items-center gap-1.5">
              <span>🖥️</span> BAĞLI DISCORD SUNUCUSU
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">ID: {DISCORD_CONFIG.guildId}</span>
          </div>
          <div className="text-sm font-mono text-zinc-200 bg-[#090d18] p-2.5 rounded-lg border border-white/5 flex items-center justify-between gap-2 overflow-hidden">
            <span className="truncate">{DISCORD_CONFIG.serverInvite}</span>
            <button
              onClick={() => copyToClipboard(DISCORD_CONFIG.serverInvite, 'server')}
              className="shrink-0 p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Davet Bağlantısını Kopyala"
            >
              {copiedLink === 'server' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">
            Topluluk oyuncularının katılacağı resmi Valorant topluluk sunucusu.
          </p>
        </div>

        {/* Channel Card */}
        <div className="rounded-xl bg-[#0e1424]/80 border border-white/10 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-rajdhani font-bold uppercase tracking-wider text-[#ff4655] flex items-center gap-1.5">
              <span>📢</span> İLANLARIN DÜŞECEĞİ METİN KANALI
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">Kanal ID: {DISCORD_CONFIG.channelId}</span>
          </div>
          <div className="text-sm font-mono text-zinc-200 bg-[#090d18] p-2.5 rounded-lg border border-white/5 flex items-center justify-between gap-2 overflow-hidden">
            <span className="truncate">{DISCORD_CONFIG.channelUrl}</span>
            <button
              onClick={() => copyToClipboard(DISCORD_CONFIG.channelUrl, 'channel')}
              className="shrink-0 p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Kanal Bağlantısını Kopyala"
            >
              {copiedLink === 'channel' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">
            Scrim ve takım ilanlarının otomatik olarak postalanacağı hedef metin kanalı.
          </p>
        </div>
      </div>

      {/* Webhook Configuration & Test Section */}
      <div className="rounded-2xl bg-[#0e1424]/90 border border-white/15 p-6 backdrop-blur-xl shadow-xl space-y-5">
        <div>
          <h3 className="font-rajdhani font-black text-xl text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#5865F2]" />
            <span>Kanal Webhook URL Yapılandırması</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Discord'un güvenlik protokolü gereği, harici web sitelerinden bir kanala otomatik mesaj atılabilmesi için o kanala ait bir Webhook URL gereklidir.
          </p>
        </div>

        <form onSubmit={handleSaveWebhook} className="space-y-4">
          <div>
            <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Discord Webhook URL (Hedef Kanaldan Alınan URL)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrlState(e.target.value)}
                placeholder="https://discord.com/api/webhooks/1552027675382648924/..."
                className="flex-1 px-3.5 py-2.5 bg-[#090d18] border border-white/15 focus:border-[#5865F2] rounded-xl text-sm font-mono text-white outline-none placeholder:text-zinc-600"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5865F2] to-[#7000ff] hover:brightness-110 text-white font-rajdhani font-bold text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(88,101,242,0.3)] transition-all cursor-pointer shrink-0"
              >
                Kaydet
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
            {/* Auto Post Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleAutoPost}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoPostEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    autoPostEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs text-zinc-300 font-medium">
                Yeni İlan Açıldığında Discord'a Otomatik İlet: <strong className={autoPostEnabled ? 'text-emerald-400' : 'text-zinc-500'}>{autoPostEnabled ? 'AÇIK' : 'KAPALI'}</strong>
              </span>
            </div>

            {/* Test Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSendTestWebhook}
                disabled={isTesting || !webhookUrl.trim()}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isTesting || !webhookUrl.trim()
                    ? 'bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed opacity-60'
                    : 'bg-[#f59e0b]/20 hover:bg-[#f59e0b] text-[#f59e0b] hover:text-black border border-[#f59e0b]/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                }`}
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Test Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Kanalda Test Et (Discord'a Mesaj At)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Test Result Alert */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border flex items-start gap-3 ${
              testResult.success
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/15 border-red-500/40 text-red-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs leading-relaxed">
              <strong className="block font-rajdhani font-bold text-sm uppercase tracking-wide">
                {testResult.success ? 'Bağlantı Başarılı!' : 'Bağlantı Hatası'}
              </strong>
              {testResult.message}
            </div>
          </div>
        )}
      </div>

      {/* 4-Step Visual Guide for Admin */}
      <div className="rounded-2xl bg-[#0e1424]/80 border border-white/10 p-6 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4 text-[#5865F2] font-rajdhani font-bold text-xs uppercase tracking-widest">
          <HelpCircle className="w-4 h-4" />
          <span>ADIM ADIM WEBHOOK ALMA REHBERİ (1 DAKİKA)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-[#090d18]/80 border border-white/5 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#7983f5] flex items-center justify-center font-rajdhani font-black text-sm">
              1
            </div>
            <h4 className="font-rajdhani font-bold text-white text-sm uppercase tracking-wide">
              Kanala Git & Düzenle
            </h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Discord'da hedef metin kanalına (<code className="text-[#5865F2]">1552027675382648924</code>) sağ tıkla veya kanal adının yanındaki <strong>⚙️ Kanalı Düzenle</strong> çarkına bas.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-[#090d18]/80 border border-white/5 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#7000ff]/20 border border-[#a855f7]/40 text-[#a855f7] flex items-center justify-center font-rajdhani font-black text-sm">
              2
            </div>
            <h4 className="font-rajdhani font-bold text-white text-sm uppercase tracking-wide">
              Entegrasyonlar Sekmesi
            </h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Açılan menüde sol taraftaki <strong>Entegrasyonlar (Integrations)</strong> sekmesine tıkla ve <strong>Webhook'lar</strong> seçeneğine gir.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-[#090d18]/80 border border-white/5 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-rajdhani font-black text-sm">
              3
            </div>
            <h4 className="font-rajdhani font-bold text-white text-sm uppercase tracking-wide">
              Yeni Webhook Oluştur
            </h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              <strong>Yeni Webhook (New Webhook)</strong> butonuna tıkla. Botun adını <em>"Nexus Valorant Arena"</em> olarak belirleyebilirsin.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-[#090d18]/80 border border-white/5 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#ff4655]/20 border border-[#ff4655]/40 text-[#ff4655] flex items-center justify-center font-rajdhani font-black text-sm">
              4
            </div>
            <h4 className="font-rajdhani font-bold text-white text-sm uppercase tracking-wide">
              URL'yi Kopyala & Yapıştır
            </h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              <strong>"Webhook URL'sini Kopyala"</strong> butonuna tıkla. Yukarıdaki kutucuğa yapıştırıp <strong>Kaydet</strong> ve ardından <strong>Test Et</strong> butonuna bas!
            </p>
          </div>
        </div>
      </div>

      {/* Live Preview: How it looks inside Discord */}
      <div className="rounded-2xl bg-[#0e1424]/90 border border-white/10 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-rajdhani font-bold uppercase tracking-widest">
            <Flame className="w-4 h-4 text-[#ff4655]" />
            <span>DİSCORD İLAN KART GÖRÜNÜMÜ (CANLI ÖNİZLEME)</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Kanal: #1552027675382648924</span>
        </div>

        {/* Discord Mock Interface */}
        <div className="bg-[#313338] rounded-xl p-4 text-white font-sans shadow-inner border border-white/5 max-w-2xl">
          {/* Bot Message Header */}
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#7000ff] border border-white/15 flex items-center justify-center text-xs font-black overflow-hidden shrink-0">
              <span className="text-white font-rajdhani font-black text-sm">NX</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white">Nexus Valorant Arena</span>
              <span className="px-1 py-0.2 rounded text-[10px] bg-[#5865F2] text-white font-bold uppercase">BOT</span>
              <span className="text-[11px] text-[#949ba4]">Bugün 21:40</span>
            </div>
          </div>

          <p className="text-xs text-[#dbdee1] mb-2 font-medium">
            📢 <strong>YENİ SCRIM LOBİSİ AÇILDI!</strong>
          </p>

          {/* Discord Embed Box */}
          <div className="border-l-4 border-[#ff4655] bg-[#2b2d31] p-3.5 rounded-r-lg space-y-2.5 max-w-xl">
            <div>
              <span className="text-[10px] text-[#949ba4] font-medium uppercase tracking-wider block">
                NEXUS VALORANT ARENA
              </span>
              <h5 className="font-bold text-sm text-white hover:underline cursor-pointer">
                ⚔️ IMMORTAL 3 Scrim Arayışı • 5v5 Standart
              </h5>
              <p className="text-xs text-[#dbdee1] mt-0.5">
                <strong>{currentUser.riotId}</strong> tarafından yeni bir antrenman maçı ilanı açıldı.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#1e1f22] p-2 rounded">
                <span className="text-[10px] text-[#949ba4] block uppercase font-bold">👤 Lobi Kurucusu</span>
                <span className="font-mono text-zinc-200">{currentUser.riotId}</span>
              </div>
              <div className="bg-[#1e1f22] p-2 rounded">
                <span className="text-[10px] text-[#949ba4] block uppercase font-bold">🏆 Seviye / Rank</span>
                <span className="font-bold text-[#ff4655]">{currentUser.rank || 'IMMORTAL'}</span>
              </div>
              <div className="bg-[#1e1f22] p-2 rounded">
                <span className="text-[10px] text-[#949ba4] block uppercase font-bold">⏰ Maç Saati</span>
                <span className="font-mono text-zinc-200">22:30 (Bu Akşam)</span>
              </div>
              <div className="bg-[#1e1f22] p-2 rounded">
                <span className="text-[10px] text-[#949ba4] block uppercase font-bold">📊 Tracker Durumu</span>
                <span className="text-emerald-400 font-bold">✅ Doğrulanmış Profil</span>
              </div>
            </div>

            <div className="text-[10px] text-[#949ba4] pt-1 flex items-center justify-between border-t border-white/5">
              <span>Nexus Arena • Otomatik İlan Servisi</span>
              <span>Bugün saat 21:40</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
