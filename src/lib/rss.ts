import rss from '@astrojs/rss';
import { routes, t, type Lang } from '../i18n/ui';
import { entries } from './content';

export async function feed(lang: Lang, site: URL) {
  const posts = await entries('blog', lang);
  return rss({
    title: t(lang, 'site.title'),
    description: t(lang, 'site.description'),
    site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: `${routes[lang].blog}${p.slug}/`,
    })),
    customData: `<language>${lang}</language>`,
  });
}
