import argon2 from 'argon2';
import readline from 'readline';
import { UserModel } from './models/User.js';
import { env } from '../config/env.js';

export interface ProvisionResult {
  created: boolean;
  email: string;
  reason?: 'owner_already_exists' | 'account_conflict';
}

async function promptPassword(promptText: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(promptText, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Secure, create-only initial owner provisioning.
 *
 * Invariants:
 * - Provisioning is a one-time operation.
 * - Fails safely if ANY owner account already exists.
 * - Fails safely if the target email conflicts with an existing non-owner account.
 * - Never mutates, resets, or promotes an existing user.
 * - Enforces minimum 12-character password policy.
 * - Never prints passwords, hashes, or credentials to logs or stdout.
 */
export async function provisionOwner(
  explicitEmail?: string,
  explicitPwd?: string
): Promise<ProvisionResult> {
  const email = (explicitEmail || process.env.ADMIN_EMAIL || env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!email) {
    throw new Error('Admin email is required for initial provisioning (ADMIN_EMAIL).');
  }

  // 1. Check if ANY owner account already exists in the database (active or inactive)
  const existingOwner = await UserModel.findOne({ role: 'owner' });
  if (existingOwner) {
    console.log(`ℹ️ An owner account already exists (${existingOwner.email}).`);
    console.log('🔒 Provisioning is a one-time operation. Credentials and roles were not modified.');
    console.log('   To change an existing password, use the authenticated dashboard or password reset flow.\n');
    return { created: false, email: existingOwner.email, reason: 'owner_already_exists' };
  }

  // 2. Check if an account with this email already exists (e.g. editor)
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    console.error(`❌ Provisioning halted: An account with email '${email}' already exists with role '${existingUser.role}'.`);
    console.error('🔒 Provisioning will not overwrite, reset, or promote an existing account.\n');
    throw new Error(`Account conflict: User with email '${email}' already exists`);
  }

  // 3. Determine initial password securely (explicitly exclude process.argv for security)
  let password = (explicitPwd !== undefined ? explicitPwd : (process.env.ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD || '')).trim();

  if (!password && process.stdin.isTTY) {
    password = await promptPassword('Enter a secure initial password (min 12 characters): ');
  }

  if (!password) {
    throw new Error(
      'Missing required initial password. In non-interactive environments, set the ADMIN_PASSWORD environment variable.'
    );
  }

  if (password.length < 12) {
    throw new Error('Initial password must be at least 12 characters long');
  }

  // 4. Hash password with Argon2id and create owner
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await UserModel.create({
    email,
    passwordHash,
    role: 'owner',
    isActive: true,
    sessionVersion: 1,
  });

  console.log(`✅ Owner account successfully provisioned for: ${email}`);
  console.log('Role: owner');
  console.log('Status: active');
  console.log('🔒 Password stored with Argon2id hash. Secret values are never printed.\n');

  return { created: true, email };
}

// Alias for backwards compatibility
export const seedAdmin = provisionOwner;
