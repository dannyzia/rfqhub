#!/usr/bin/env node

/**
 * Backend script to seed test users
 * This ensures passwords are properly hashed using the same bcrypt config as the app
 * Usage: node backend/scripts/seed-test-users.js
 */

require('dotenv').config({ path: '.env' });

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const testUsers = [
    {
        id: '10000000-0000-0000-0000-000000000001',
        org_id: '00000000-0000-0000-0000-000000000001',
        name: 'Admin User',
        email: 'admin@rfqbuddy.com',
        password: 'admin123',
        roles: ['admin', 'buyer']
    },
    {
        id: '10000000-0000-0000-0000-000000000002',
        org_id: '00000000-0000-0000-0000-000000000002',
        name: 'Buyer User',
        email: 'buyer@rfqbuddy.com',
        password: 'buyer123',
        roles: ['buyer']
    },
    {
        id: '10000000-0000-0000-0000-000000000003',
        org_id: '00000000-0000-0000-0000-000000000003',
        name: 'Vendor User',
        email: 'vendor@rfqbuddy.com',
        password: 'vendor123',
        roles: ['vendor']
    },
    {
        id: '10000000-0000-0000-0000-000000000004',
        org_id: '00000000-0000-0000-0000-000000000002',
        name: 'Callzr User',
        email: 'callzr@gmail.com',
        password: 'password123',
        roles: ['buyer']
    },
    {
        id: '10000000-0000-0000-0000-000000000005',
        org_id: '00000000-0000-0000-0000-000000000003',
        name: 'Vendor ABD',
        email: 'vendorabd@gmail.com',
        password: 'password123',
        roles: ['vendor']
    }
];

async function seedUsers() {
    const client = await pool.connect();
    
    try {
        console.log('🌱 Seeding test users...\n');
        
        // First check if users already exist
        const result = await client.query(
            'SELECT COUNT(*) as count FROM users WHERE email = ANY($1)',
            [testUsers.map(u => u.email)]
        );
        
        if (result.rows[0].count > 0) {
            console.log('⚠️  Some test users already exist. Checking which ones...\n');
        }
        
        for (const user of testUsers) {
            // Check if user exists
            const existing = await client.query(
                'SELECT id FROM users WHERE email = $1',
                [user.email]
            );
            
            if (existing.rows.length > 0) {
                console.log(`⏭️  ${user.email} already exists, skipping...`);
                continue;
            }
            
            // Hash password
            const hash = await bcrypt.hash(user.password, 12);
            
            // Insert user
            await client.query(
                `INSERT INTO users (
                    id, organization_id, name, email, password_hash, roles, is_active, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())`,
                [user.id, user.org_id, user.name, user.email, hash, user.roles]
            );
            
            console.log(`✅ Created ${user.email} (password: ${user.password})`);
        }
        
        console.log('\n🎉 Test users seeded successfully!\n');
        console.log('Test Credentials:');
        testUsers.forEach(u => {
            console.log(`  ${u.email} / ${u.password}`);
        });
        
    } catch (error) {
        console.error('❌ Error seeding users:', error.message);
        if (error.detail) console.error('Details:', error.detail);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seedUsers();
