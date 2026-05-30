require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Using the Service Role Key again to bypass restrictions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🛑 IMPORTANT: Put your real test email(s) here so you don't delete yourself!
const PROTECTED_EMAILS = ['martialgrid@gmail.com'];

async function cleanupUsers() {
  console.log('🧹 Starting database cleanup...');

  // 1. Fetch users from the Auth system
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    return console.error('❌ Error fetching users:', error.message);
  }

  const users = data.users;
  let deletedCount = 0;

  console.log(`Found ${users.length} total users in the system.`);

  // 2. Loop through and securely delete the fake ones
  for (const user of users) {
    if (PROTECTED_EMAILS.includes(user.email)) {
      console.log(`🛡️ Skipping protected user: ${user.email}`);
      continue;
    }

    // This single command triggers the CASCADE delete across your entire database
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error(`⚠️ Failed to delete ${user.email}:`, deleteError.message);
    } else {
      console.log(`🗑️ Erased: ${user.email}`);
      deletedCount++;
    }
  }

  console.log(`✨ Cleanup complete! Safely vaporized ${deletedCount} fake users.`);
}

cleanupUsers();