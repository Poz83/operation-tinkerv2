/**
 * Quick Supabase connection test
 * Run with: npx tsx scripts/test-supabase.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load env from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('🔌 Testing Supabase connection...\n');
    console.log(`URL: ${supabaseUrl}\n`);

    // Test 1: Check if we can reach the database
    console.log('📋 Checking tables...\n');

    const tables = [
        'users',
        'projects',
        'images',
        'generations',
        'user_settings',
        'feature_flags',
        'feedback',
        'announcements'
    ];

    for (const table of tables) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

        if (error) {
            console.log(`❌ ${table}: ${error.message}`);
        } else {
            console.log(`✅ ${table}: OK (${data?.length || 0} rows)`);
        }
    }

    // Test 2: Check feature flags
    console.log('\n🚩 Feature flags:');
    const { data: flags, error: flagError } = await supabase
        .from('feature_flags')
        .select('flag_name, is_enabled');

    if (flagError) {
        console.log(`❌ Could not read feature flags: ${flagError.message}`);
    } else if (flags) {
        flags.forEach(f => {
            console.log(`   ${f.is_enabled ? '🟢' : '⚪'} ${f.flag_name}`);
        });
    }

    console.log('\n✨ Connection test complete!');
}

testConnection().catch(console.error);
