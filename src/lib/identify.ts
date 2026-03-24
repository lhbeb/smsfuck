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
