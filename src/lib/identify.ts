export function identifySender(phone: string, body: string): { name: string, type: 'brand' | 'auth' | 'unknown' } {
  const text = body.toLowerCase();
  
  // Brand Signatures (Keywords in text)
  if (text.includes('facebook') || text.includes('fb-')) return { name: 'Facebook', type: 'brand' };
  if (text.includes('whatsapp')) return { name: 'WhatsApp', type: 'brand' };
  if (text.includes('google') || text.includes('g-')) return { name: 'Google', type: 'brand' };
  if (text.includes('amazon')) return { name: 'Amazon', type: 'brand' };
  if (text.includes('microsoft')) return { name: 'Microsoft', type: 'brand' };
  if (text.includes('apple')) return { name: 'Apple', type: 'brand' };
  if (text.includes('netflix')) return { name: 'Netflix', type: 'brand' };
  if (text.includes('uber')) return { name: 'Uber', type: 'brand' };
  if (text.includes('lyft')) return { name: 'Lyft', type: 'brand' };
  if (text.includes('doordash')) return { name: 'DoorDash', type: 'brand' };
  if (text.includes('paypal')) return { name: 'PayPal', type: 'brand' };
  if (text.includes('venmo')) return { name: 'Venmo', type: 'brand' };
  if (text.includes('cash app') || text.includes('cashapp')) return { name: 'Cash App', type: 'brand' };
  if (text.includes('bank of america') || text.includes('bofa')) return { name: 'Bank of America', type: 'brand' };
  if (text.includes('chase')) return { name: 'Chase Bank', type: 'brand' };
  if (text.includes('wells fargo')) return { name: 'Wells Fargo', type: 'brand' };
  if (text.includes('twitter') || text.includes('x.com')) return { name: 'X (Twitter)', type: 'brand' };
  if (text.includes('instagram') || text.includes('ig')) return { name: 'Instagram', type: 'brand' };
  if (text.includes('tiktok')) return { name: 'TikTok', type: 'brand' };
  if (text.includes('snapchat')) return { name: 'Snapchat', type: 'brand' };
  if (text.includes('discord')) return { name: 'Discord', type: 'brand' };
  if (text.includes('airbnb')) return { name: 'Airbnb', type: 'brand' };
  if (text.includes('tinder')) return { name: 'Tinder', type: 'brand' };
  if (text.includes('stripe')) return { name: 'Stripe', type: 'brand' };
  if (text.includes('github')) return { name: 'GitHub', type: 'brand' };
  if (text.includes('slack')) return { name: 'Slack', type: 'brand' };
  if (text.includes('doctolib')) return { name: 'Doctolib', type: 'brand' };

  // Common authentication formats
  if (
    text.includes('confirmation code') || 
    text.includes('verification code') || 
    text.includes('auth code') ||
    text.includes('security code') ||
    text.includes('one-time password') ||
    text.includes('otp')
  ) {
    return { name: 'Automated Auth System', type: 'auth' };
  }

  // Shortcode checking
  const cleanedPhone = phone.replace(/[^a-zA-Z0-9]/g, '');
  if (cleanedPhone.length <= 6) {
    return { name: 'Commercial Shortcode', type: 'brand' };
  }

  return { name: 'Unknown Sender', type: 'unknown' };
}

export function getCountryFlag(phone: string): string {
  if (!phone) return "🌍";
  const p = phone.replace(/[^0-9+]/g, '');
  if (!p.startsWith("+")) return "🏢"; // Corporate / Shortcode
  
  // Specific match routing
  if (p.startsWith("+212")) return "🇲🇦";
  if (p.startsWith("+44")) return "🇬🇧";
  if (p.startsWith("+33")) return "🇫🇷";
  if (p.startsWith("+49")) return "🇩🇪";
  if (p.startsWith("+34")) return "🇪🇸";
  if (p.startsWith("+39")) return "🇮🇹";
  if (p.startsWith("+61")) return "🇦🇺";
  if (p.startsWith("+81")) return "🇯🇵";
  if (p.startsWith("+55")) return "🇧🇷";
  if (p.startsWith("+52")) return "🇲🇽";
  if (p.startsWith("+91")) return "🇮🇳";
  if (p.startsWith("+86")) return "🇨🇳";
  if (p.startsWith("+31")) return "🇳🇱";
  if (p.startsWith("+41")) return "🇨🇭";
  if (p.startsWith("+46")) return "🇸🇪";
  if (p.startsWith("+47")) return "🇳🇴";
  if (p.startsWith("+351")) return "🇵🇹";
  if (p.startsWith("+7")) return "🇷🇺";
  if (p.startsWith("+20")) return "🇪🇬";
  if (p.startsWith("+27")) return "🇿🇦";
  if (p.startsWith("+971")) return "🇦🇪";
  if (p.startsWith("+966")) return "🇸🇦";
  if (p.startsWith("+90")) return "🇹🇷";
  if (p.startsWith("+82")) return "🇰🇷"; // South Korea
  if (p.startsWith("+65")) return "🇸🇬"; // Singapore
  if (p.startsWith("+62")) return "🇮🇩"; // Indonesia
  if (p.startsWith("+60")) return "🇲🇾"; // Malaysia
  if (p.startsWith("+64")) return "🇳🇿"; // New Zealand
  if (p.startsWith("+32")) return "🇧🇪"; // Belgium
  if (p.startsWith("+43")) return "🇦🇹"; // Austria
  if (p.startsWith("+30")) return "🇬🇷"; // Greece
  if (p.startsWith("+63")) return "🇵🇭"; // Philippines
  if (p.startsWith("+48")) return "🇵🇱"; // Poland
  if (p.startsWith("+353")) return "🇮🇪"; // Ireland
  if (p.startsWith("+45")) return "🇩🇰"; // Denmark
  if (p.startsWith("+358")) return "🇫🇮"; // Finland
  if (p.startsWith("+1")) return "🇺🇸"; // NA / US Standard (Waitlist specific overrides CA later if needed)

  return "🌍";
}
