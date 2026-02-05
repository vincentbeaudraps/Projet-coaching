#!/usr/bin/env node

/**
 * Script pour créer un compte Coach de manière sécurisée
 * Usage: node create-coach.js
 */

import bcrypt from 'bcryptjs';
import pg from 'pg';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function createCoach() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'coaching_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('\n🏃 Coach Running Platform - Création de compte Coach\n');
    console.log('⚠️  Cette opération crée un compte avec des privilèges de coach.\n');

    const name = await question('Nom complet du coach: ');
    const email = await question('Email du coach: ');
    const password = await question('Mot de passe: ');

    if (!name || !email || !password) {
      console.log('❌ Tous les champs sont obligatoires.');
      rl.close();
      return;
    }

    console.log('\n🔄 Connexion à la base de données...');
    await client.connect();

    // Vérifier si l'email existe déjà
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('❌ Un utilisateur avec cet email existe déjà.');
      rl.close();
      await client.end();
      return;
    }

    console.log('🔐 Hashage du mot de passe...');
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId();

    console.log('💾 Création du compte coach...');
    await client.query(
      'INSERT INTO users (id, email, name, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
      [userId, email, name, hashedPassword, 'coach']
    );

    console.log('\n✅ Compte coach créé avec succès!\n');
    console.log('📋 Informations du compte:');
    console.log(`   ID:    ${userId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Nom:   ${name}`);
    console.log(`   Rôle:  coach`);
    console.log('\n🔑 Le coach peut maintenant se connecter avec ces identifiants.');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
  } finally {
    rl.close();
    await client.end();
  }
}

createCoach();
