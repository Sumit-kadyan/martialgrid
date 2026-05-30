// seed.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { faker } = require('@faker-js/faker');

// Use the Service Role Key to bypass RLS and Auth restrictions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SPORTS = ['cricket', 'football', 'badminton', 'wrestling', 'kabaddi'];
const BADGES = ['wooden', 'bronze', 'silver', 'gold', 'elite'];
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Jaipur', 'Pune'];

async function seedUsers(count = 20) {
  console.log(`🌱 Seeding ${count} users into the database...`);

  for (let i = 0; i < count; i++) {
    const role = faker.helpers.arrayElement(['player', 'player', 'coach', 'organizer']); // Weighted towards players
    const sport = faker.helpers.arrayElement(SPORTS);
    const city = faker.helpers.arrayElement(CITIES);
    const email = faker.internet.email();
    const password = 'Password123!';

    // 1. Create the Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Error creating auth user:', authError.message);
      continue;
    }

    const userId = authData.user.id;

    // 2. Create the Profile (This triggers the auto-creation of the role tables!)
    await supabase.from('profiles').insert({
      id: userId,
      name: faker.person.fullName(),
      age: faker.number.int({ min: 16, max: 45 }),
      gender: faker.person.sex(),
      role: role,
      city: city,
      onboarding_completed: true,
    });

    // 3. Update the specific role table with rich data
    if (role === 'player') {
      await supabase.from('players').update({
        sport: sport,
        experience: `${faker.number.int({ min: 1, max: 10 })} years`,
        expertise_badge: faker.helpers.arrayElement(BADGES),
      }).eq('id', userId);
    } 
    else if (role === 'coach') {
      await supabase.from('coaches').update({
        sport: sport,
        experience_years: `${faker.number.int({ min: 5, max: 20 })} years`,
        certifications: 'BCCI Level 2, NIS Diploma',
      }).eq('id', userId);
    }
    else if (role === 'organizer') {
      await supabase.from('organizers').update({
        organization_name: `${faker.company.name()} Sports`,
        contact_email: email,
      }).eq('id', userId);
    }

    console.log(`✅ Created ${role} in ${city} for ${sport || 'All Sports'}`);
  }

  console.log('🎉 Seeding complete! Your community is now populated.');
}

seedUsers(300); // Generates 30 users