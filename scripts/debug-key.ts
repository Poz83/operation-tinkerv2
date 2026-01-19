
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://jjlbdzwuhvupggfhhxiz.supabase.co';
// The key found in .env.local
const SUPABASE_KEY = 'sb_publishable_Y8XqlQIkIh7ZIyh3pTat_g_lMpgcnq0';

async function debugKey() {
    console.log(`Testing connection to: ${SUPABASE_URL}`);
    console.log(`Using Key: ${SUPABASE_KEY.substring(0, 15)}...`);

    const url = `${SUPABASE_URL}/rest/v1/projects?select=count`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`\nStatus: ${response.status} ${response.statusText}`);

        const text = await response.text();
        console.log('Body:', text.substring(0, 500));

        if (response.ok) {
            console.log('\n✅ Key accepted!');
        } else {
            console.log('\n❌ Key rejected or server error.');
        }
    } catch (err) {
        console.error('\n❌ Network/Fetch Error:', err);
    }
}

debugKey();
