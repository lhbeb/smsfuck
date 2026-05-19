const url = 'https://zlymdbwjolbeltritggg.supabase.co/rest/v1/twilio_accounts?select=*';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseW1kYndqb2xiZWx0cml0Z2dnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI3MjQ0NiwiZXhwIjoyMDg5ODQ4NDQ2fQ.NNLYSRoExo6hc6K9JZ1bUoadfsCNmNKm_2OgV-cWf-w';

async function test() {
  const res = await fetch(url, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  const data = await res.json();
  console.log('Accounts:', data);
  
  const msgRes = await fetch('https://zlymdbwjolbeltritggg.supabase.co/rest/v1/messages?select=*&limit=5', {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  const msgs = await msgRes.json();
  console.log('Messages:', msgs);
}
test();
