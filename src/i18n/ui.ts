export const languages = { es: 'Español', en: 'English' } as const;
export type Lang = keyof typeof languages;

export const routes = {
  es: { home: '/', cases: '/casos/', blog: '/blog/', cv: '/cv/', rss: '/rss.xml' },
  en: { home: '/en/', cases: '/en/cases/', blog: '/en/blog/', cv: '/en/cv/', rss: '/en/rss.xml' },
} as const;

export const contact = {
  email: 'hola@alias.bysalcedo.com',
  linkedin: 'https://www.linkedin.com/in/salcedodani/',
  github: 'https://github.com/bysalcedo',
};

export const ui = {
  es: {
    'site.title': 'Daniel Salcedo, ingeniero cloud',
    'site.description':
      'Ingeniero cloud y de plataforma en Cantabria. Diseño y opero Ebro, un cluster Kubernetes de seis nodos: GitOps, backups probados, observabilidad y casos reales.',
    'nav.cases': 'Casos',
    'nav.blog': 'Blog',
    'nav.cv': 'CV',
    'nav.contact': 'Contacto',
    'skip': 'Saltar al contenido',

    'hero.eyebrow': 'Ingeniero cloud y de plataforma · Cantabria',
    'hero.h1': 'Daniel Salcedo',
    'hero.sentence': 'Diseño landing zones en Azure, AWS, Google Cloud y OCI. En casa opero Ebro, un cluster Kubernetes que sigue en pie cuando falla una máquina.',
    'hero.action': 'Ver los casos',
    'hero.cv': 'CV',

    'hero.hello': 'Hola, soy',
    'term.title': 'ebro · en vivo',
    'term.comment': '# respuesta del cluster en {ms} ms, desde Cantabria',
    'term.label': 'Datos en vivo de esta visita: qué pod y qué nodo del cluster la han servido.',

    'now.title': 'Ahora',
    'now.updated': 'Actualizado el 27 de noviembre de 2026',
    'now.items': [
      { k: 'En el homelab', v: 'Cerrando lo que salió de la auditoría de noviembre. Lo más interesante: una latencia de escritura síncrona en el NAS siete veces peor que en septiembre, que ninguna alerta había visto.' },
      { k: 'En esta web', v: 'Escribiendo un postmortem por cada cosa que se rompe, en español y en inglés.' },
      { k: 'Busco', v: 'Un equipo cloud o de plataforma, en remoto o híbrido, donde la fiabilidad se mida y no se suponga.' },
      { k: 'Fuera del teclado', v: 'Las motos. Cantabria tiene carreteras de montaña que lo ponen muy fácil.' },
    ],

    'names.title': 'Por qué Ebro',
    'names.intro': 'Las máquinas de casa llevan nombre de río de Cantabria. Los tres hipervisores son Saja, Pas y Miera, tres ríos que bajan de la cordillera al Cantábrico. El cluster que corre encima es Ebro: también nace en Cantabria, en Fontibre, pero es el único que se va al otro lado, hasta el Mediterráneo.',
    'names.items': [
      { n: 'Saja', r: 'Host Proxmox', d: 'El río del valle de Cabuérniga.' },
      { n: 'Pas', r: 'Host Proxmox', d: 'El río de los valles pasiegos.' },
      { n: 'Miera', r: 'Host Proxmox', d: 'El río de Liérganes y su Hombre Pez.' },
      { n: 'Ebro', r: 'El cluster', d: 'Seis nodos repartidos entre los tres. Nace en Fontibre y llega al Mediterráneo.' },
    ],
    'names.quote': 'Un sistema que se opera bien se parece a un río: nadie lo mira mientras corre.',

    'stats.heading': 'Ebro en cifras',
    'stats.items': [
      { n: '6', l: 'nodos Kubernetes sobre 3 hipervisores' },
      { n: '30', l: 'aplicaciones desplegadas por GitOps' },
      { n: '0', l: 'puertos abiertos a internet' },
      { n: '24 min', l: 'para restaurar 14 namespaces' },
    ],

    'cases.title': 'Casos de estudio',
    'cases.intro': 'Problemas reales, la decisión que tomé y lo que se puede medir del resultado.',
    'cases.all': 'Todos los casos',
    'blog.title': 'Blog',
    'blog.intro': 'Artículos sobre lo que voy construyendo y postmortems de lo que se rompe: qué pasó, por qué y qué cambió después.',
    'blog.postmortem': 'Postmortem',
    'blog.articulo': 'Artículo',
    'blog.all': 'Todo el blog',

    'about.title': 'Sobre mí',
    'about.text': [
      'Vivo en Cantabria y trabajo como Technical Lead en el departamento Multicloud de Minsait. En casa opero Ebro como si fuera producción, porque para quien lo usa lo es: fotos, documentos, domótica y automatización de toda la familia.',
      'Todo está en git y lo despliega ArgoCD; cada aplicación entra con SSO en el mismo cambio que la publica; los backups se restauran solos cada semana y cada incidente acaba en un postmortem escrito.',
      'Me gusta medir antes de opinar, dejar las cosas mejor documentadas de como las encontré y trabajar con IA como herramienta, con límites claros. Busco un equipo cloud o de plataforma, en remoto o híbrido.',
    ],

    'contact.heading': 'Contacto',
    'contact.mode': 'Remoto o híbrido',
    'contact.cv': 'CV',
    'contact.greeting': 'Hablamos',
    'contact.intro': 'Si buscas a alguien así para tu equipo, escríbeme.',
    'contact.mailSubject': 'Hola Daniel',

    'close.served.fallback': 'Esta página la sirve el cluster Ebro, desde Cantabria.',
    'close.served': 'Esta visita la ha servido el pod {pod} en el nodo {node}.',
    'close.source': 'Código',

    'cv.title': 'Curriculum',
    'cv.now': 'Ahora',
    'cv.home': 'En casa',
    'cv.cases': 'Ver los casos de estudio',
    'cv.skills': 'Competencias',
    'cv.before': 'Antes',
    'cv.education': 'Formación e idiomas',
    'cv.full': 'Pedir el CV completo',
    'cv.fullSubject': 'CV completo',

    'post.result': 'Resultado',
    'post.back': 'Volver',
    'post.onlyIn': 'Disponible solo en español.',
    'draft': 'borrador',


    '404.title': 'Esta página no existe',
    '404.back': 'Volver al inicio',
  },
  en: {
    'site.title': 'Daniel Salcedo, cloud engineer',
    'site.description':
      'Cloud and platform engineer in Cantabria, Spain. I design and run Ebro, a six-node Kubernetes cluster: GitOps, tested backups, observability and real case studies.',
    'nav.cases': 'Case studies',
    'nav.blog': 'Blog',
    'nav.cv': 'Resume',
    'nav.contact': 'Contact',
    'skip': 'Skip to content',

    'hero.eyebrow': 'Cloud and platform engineer · Cantabria, Spain',
    'hero.h1': 'Daniel Salcedo',
    'hero.sentence': 'I design landing zones on Azure, AWS, Google Cloud and OCI. At home I run Ebro, a Kubernetes cluster that stays up when a machine fails.',
    'hero.action': 'See the case studies',
    'hero.cv': 'Resume',

    'hero.hello': 'Hi, I am',
    'term.title': 'ebro · live',
    'term.comment': '# cluster answered in {ms} ms, from Cantabria',
    'term.label': 'Live data for this visit: which pod and which cluster node served it.',

    'now.title': 'Now',
    'now.updated': 'Updated on 27 November 2026',
    'now.items': [
      { k: 'In the homelab', v: 'Closing what came out of the November audit. The most interesting one: synchronous write latency on the NAS seven times worse than in September, which no alert had caught.' },
      { k: 'On this site', v: 'Writing a postmortem for everything that breaks, in Spanish and in English.' },
      { k: 'Looking for', v: 'A cloud or platform team, remote or hybrid, where reliability is measured, not assumed.' },
      { k: 'Away from the keyboard', v: 'Motorcycles. Cantabria has mountain roads that make it very easy.' },
    ],

    'names.title': 'Why Ebro',
    'names.intro': 'The machines at home are named after rivers in Cantabria. The three hypervisors are Saja, Pas and Miera, three rivers that run down from the mountains to the Bay of Biscay. The cluster running on top is Ebro: it also rises in Cantabria, at Fontibre, but it is the only one that goes the other way, all the way to the Mediterranean.',
    'names.items': [
      { n: 'Saja', r: 'Proxmox host', d: 'The river of the Cabuérniga valley.' },
      { n: 'Pas', r: 'Proxmox host', d: 'The river of the Pas valleys.' },
      { n: 'Miera', r: 'Proxmox host', d: 'The river of Liérganes and its Fish Man.' },
      { n: 'Ebro', r: 'The cluster', d: 'Six nodes spread across the three. It rises at Fontibre and reaches the Mediterranean.' },
    ],
    'names.quote': 'A well-run system is like a river: nobody looks at it while it flows.',

    'stats.heading': 'Ebro in figures',
    'stats.items': [
      { n: '6', l: 'Kubernetes nodes on 3 hypervisors' },
      { n: '30', l: 'applications deployed through GitOps' },
      { n: '0', l: 'ports open to the internet' },
      { n: '24 min', l: 'to restore 14 namespaces' },
    ],

    'cases.title': 'Case studies',
    'cases.intro': 'Real problems, the decision I made and what can be measured from the outcome.',
    'cases.all': 'All case studies',
    'blog.title': 'Blog',
    'blog.intro': 'Articles about what I build and postmortems of what breaks: what happened, why, and what changed afterwards.',
    'blog.postmortem': 'Postmortem',
    'blog.articulo': 'Article',
    'blog.all': 'All posts',

    'about.title': 'About',
    'about.text': [
      'I live in Cantabria, Spain, and work as Technical Lead in the Multicloud department at Minsait. At home I run Ebro as if it were production, because for the people who use it, it is: the whole family’s photos, documents, home automation and workflows.',
      'Everything lives in git and ArgoCD deploys it; every app ships with SSO in the same change that publishes it; backups restore themselves every week and every incident ends in a written postmortem.',
      'I like to measure before I argue, to leave things better documented than I found them and to use AI as a tool with clear limits. I am looking for a cloud or platform team, remote or hybrid.',
    ],

    'contact.heading': 'Contact',
    'contact.mode': 'Remote or hybrid',
    'contact.cv': 'Resume',
    'contact.greeting': 'Let’s talk',
    'contact.intro': 'If you are looking for someone like this for your team, write to me.',
    'contact.mailSubject': 'Hello Daniel',

    'close.served.fallback': 'This page is served by the Ebro cluster, from Cantabria.',
    'close.served': 'This visit was served by pod {pod} on node {node}.',
    'close.source': 'Source',

    'cv.title': 'Resume',
    'cv.now': 'Now',
    'cv.home': 'At home',
    'cv.cases': 'See the case studies',
    'cv.skills': 'Skills',
    'cv.before': 'Before',
    'cv.education': 'Education and languages',
    'cv.full': 'Ask for the full resume',
    'cv.fullSubject': 'Full resume',

    'post.result': 'Outcome',
    'post.back': 'Back',
    'post.onlyIn': 'Only available in Spanish for now.',
    'draft': 'draft',


    '404.title': 'This page does not exist',
    '404.back': 'Back to home',
  },
} as const;

type Strings = (typeof ui)['es'];
export type UiKey = { [K in keyof Strings]: Strings[K] extends string ? K : never }[keyof Strings];

export function t(lang: Lang, key: UiKey): string {
  return ui[lang][key] as string;
}

export function otherLang(lang: Lang): Lang {
  return lang === 'es' ? 'en' : 'es';
}

export function year(d: Date): string {
  return String(d.getFullYear());
}

export function formatDate(lang: Lang, d: Date): string {
  return d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Fecha corta para listas, igual en los dos idiomas: 2026-10-04.
export function formatShort(d: Date): string {
  return d.toISOString().slice(0, 10);
}
