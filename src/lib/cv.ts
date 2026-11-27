import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { Lang } from '../i18n/ui';

export interface Cv {
  name: string;
  headline: string;
  location: string;
  now: string;
  home: string;
  before: string;
  skills: { group: string; items: string[] }[];
  education: string[];
  languages: string;
}

export function loadCv(lang: Lang): Cv {
  return parse(readFileSync(join(process.cwd(), 'src/data', `cv.${lang}.yaml`), 'utf8')) as Cv;
}
