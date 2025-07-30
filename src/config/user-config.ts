import { promises as fs } from 'fs';
import path from 'path';

const CONFIG_PATH = path.resolve(process.cwd(), '.data/user-config.json');

export interface UserConfig {
  default_provider: string;
  default_model: string;
  interview_preprompt: string;
  enabled_tools: string[];
  allowed_domains: string[];
}

const DEFAULT_CONFIG: UserConfig = {
  default_provider: 'gemini',
  default_model: 'gemini-2.5-flash',
  interview_preprompt: 'You are a helpful research assistant.',
  enabled_tools: ['pubmed','arxiv','wolfram','openalex','mediawiki','leaks'],
  allowed_domains: ['clinical','policy','economics','technology','other']
};

export async function loadConfig(): Promise<UserConfig> {
  try {
    const txt = await fs.readFile(CONFIG_PATH, 'utf8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(txt) };
  } catch {
    await saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(cfg: UserConfig): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}
