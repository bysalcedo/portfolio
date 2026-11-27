import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

type Kind = 'cases' | 'blog';
export type Entry<K extends Kind> = CollectionEntry<K> & { slug: string; lang: Lang; fallback: boolean };

// id = "<lang>/<slug>". Si una entrada no existe en ingles, se sirve la espanola marcada como fallback.
export async function entries<K extends Kind>(kind: K, lang: Lang): Promise<Entry<K>[]> {
  const all = (await getCollection(kind, (e) => import.meta.env.DEV || process.env.SHOW_DRAFTS === '1' || !e.data.draft)) as CollectionEntry<K>[];
  const split = all.map((e) => {
    const [l, ...rest] = e.id.split('/');
    return { e, lang: l as Lang, slug: rest.join('/') };
  });
  const own = new Map(split.filter((s) => s.lang === lang).map((s) => [s.slug, s]));
  const es = split.filter((s) => s.lang === 'es');
  for (const s of es) if (!own.has(s.slug)) own.set(s.slug, s);
  const out = [...own.values()].map((s) => Object.assign(s.e, { slug: s.slug, lang: s.lang, fallback: s.lang !== lang }));
  return out.sort((a, b) =>
    kind === 'cases'
      ? ((a.data as { order: number }).order - (b.data as { order: number }).order)
      : b.data.date.getTime() - a.data.date.getTime(),
  ) as Entry<K>[];
}

export async function staticPaths(kind: Kind, lang: Lang) {
  const mine = await entries(kind, lang);
  const other = await entries(kind, lang === 'es' ? 'en' : 'es');
  const otherOwn = new Set(other.filter((e) => !e.fallback).map((e) => e.slug));
  return mine.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry, hasAlt: entry.fallback || otherOwn.has(entry.slug) },
  }));
}
