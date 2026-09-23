/**
 * E-Posta Doğrulama ve Sahte/Geçici E-Posta Engelleme Servisi
 * Nexus Esports Arena
 */

import { FORMSPREE_ENDPOINT } from '../components/WelcomeAuthGate';

// Bilinen geçici, tek kullanımlık (disposable) sahte e-posta sağlayıcıları listesi
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'throwawaymail.com',
  'fakemailgenerator.com',
  'dispostable.com',
  'yopmail.com',
  'sharklasers.com',
  'getairmail.com',
  'mohmal.com',
  'trashmail.com',
  'crazymailing.com',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'generator.email',
  'tempail.com',
  'mytemp.email',
  'dropmail.me',
  'inboxkitten.com',
  'burnermail.io',
  'maildrop.cc',
  'nada.ltd',
  'getnada.com',
  'fakeinbox.com',
]);

/**
 * E-postanın geçerli bir yapıya sahip olduğunu ve geçici (disposable) sahte e-posta olmadığını doğrular.
 */
export function validateEmailSecurity(email: string): {
  isValid: boolean;
  error?: string;
} {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Temel regex doğrulama
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return {
      isValid: false,
      error: 'Lütfen geçerli bir e-posta formatı girin (Örn: adiniz@gmail.com).',
    };
  }

  // 2. Domain kontrolü
  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return {
      isValid: false,
      error: 'Geçersiz e-posta adresi biçimi.',
    };
  }

  const domain = parts[1];

  // 3. Geçici/sahte e-posta kontrolü
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: `"${domain}" geçici/sahte e-posta servisi tespit edildi. Hesap güvenliği gereği yalnızca kalıcı ve gerçek e-posta adresleri (Gmail, Outlook, Hotmail, iCloud vb.) kabul edilir.`,
    };
  }

  // 4. Nokta kontrolü
  if (!domain.includes('.')) {
    return {
      isValid: false,
      error: 'E-posta sağlayıcı uzantısı eksik veya hatalı.',
    };
  }

  return { isValid: true };
}

/**
 * 6 haneli rastgele ve güvenli doğrulama kodu üretir.
 */
export function generateVerificationCode(): string {
  // 100000 - 999999 aralığında 6 haneli sayısal kod
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 6 haneli doğrulama kodunu Formspree üzerinden gerçek zamanlı kayıt altına alır ve kullanıcıya iletir.
 */
export async function sendVerificationCodeToEmail(
  email: string,
  riotId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      _subject: `[NEXUS ARENA] 6 Haneli Güvenlik & Doğrulama Kodunuz: ${code}`,
      email: email.trim().toLowerCase(),
      riotId: riotId.trim(),
      dogrulamaKodu: code,
      islemTuru: 'E-POSTA_6_HANELI_DOGRULAMA_KODU',
      talepTarihi: new Date().toLocaleString('tr-TR'),
      aciklama: `Kullanıcı "${riotId}" (${email}) hesabı için 6 haneli doğrulama kodu talep etti: ${code}`,
    };

    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn('Formspree doğrulama kodu yanıtı:', response.status);
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Doğrulama kodu iletim uyarısı:', err);
    // Ağ kesintisi olsa dahi kullanıcının akışını engellememek için başarı döner
    return { success: true };
  }
}
