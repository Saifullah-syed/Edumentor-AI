import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory, or workspace root if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'edumentor_super_secret_jwt_key_academic_2026_secure',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  databaseUrl: process.env.DATABASE_URL || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  uploadLimitMb: 5,
};
