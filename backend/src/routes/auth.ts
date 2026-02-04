import express, { Router } from 'express';
import client from '../database/connection.js';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { generateId } from '../utils/id.js';

const router: Router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, name, password, age, experience, goals, injuries } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId();

    await client.query(
      'INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [userId, email, name, hashedPassword, 'athlete']
    );

    const jwtOptions: SignOptions & any = {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    };
    
    const token = jwt.sign(
      { id: userId, role: 'athlete' },
      (process.env.JWT_SECRET || 'secret') as string,
      jwtOptions
    );

    res.status(201).json({
      user: { id: userId, email, name, role: 'athlete' },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: String(error) });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await client.query('SELECT * FROM users WHERE email = ?', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const jwtOptions: SignOptions & any = {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    };
    
    const token = jwt.sign(
      { id: user.id, role: user.role },
      (process.env.JWT_SECRET || 'secret') as string,
      jwtOptions
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

export default router;
