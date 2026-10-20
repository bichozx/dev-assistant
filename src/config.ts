import { AppConfig } from './types.js';
import { config as loadDotenv } from 'dotenv';

loadDotenv();

function getRequiredEnvVar(name: string, defaultValue?: string) {
  const value = process.env[name] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function validateProvider(provider: string): 'anthropic' | 'openai' {
  if (provider === 'anthropic' || provider === 'openai') {
    return provider;
  } else {
    throw new Error(
      `Invalid provider: ${provider}. Debe ser 'anthropic' o 'openai'.`,
    );
  }
}

const rawProvider = process.env['MODEL_PROVIDER'] ?? 'anthropic';

export const config: AppConfig = {
  provider: validateProvider(rawProvider),
  anthropicApiKey: getRequiredEnvVar('ANTHROPIC_API_KEY', ''),
  openaiApiKey: getRequiredEnvVar('OPENAI_API_KEY', ''),
  anthropicModel: getRequiredEnvVar('ANTHROPIC_MODEL', 'claude-sonnet-4-6'),
  openaiModel: getRequiredEnvVar('OPENAI_MODEL', 'gpt-4o-mini'),
  openaiEmbeddingModel: getRequiredEnvVar(
    'OPENAI_EMBEDDING_MODEL',
    'text-embedding-3-small',
  ),
  docsPath: getRequiredEnvVar('DOCS_PATH', './docs/sample-project'),
  dbPath: getRequiredEnvVar('DB_PATH', './data/vectors.db'),
  ragTopK: parseInt(getRequiredEnvVar('RAG_TOP_K', '5'), 10),
};

export function validateConfig(): void {
  if (config.provider === 'anthropic' && !config.anthropicApiKey) {
    throw new Error(
      'Missing required enviroment variable: anthropicApiKey for anthropic provider',
    );
  }
  if (config.provider === 'openai' && !config.openaiApiKey) {
    throw new Error(
      'Missing required enviroment variable: openaiApiKey for openai provider',
    );
  }
}

export default config;
