import { getSitemapEntries } from '@/lib/seo/sitemap';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function toIsoDate(value: Date): string {
  return value.toISOString();
}

export async function GET() {
  const entries = await getSitemapEntries();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries
  .map((entry) => {
    const alternates = Object.entries(entry.alternates)
      .map(
        ([locale, href]) =>
          `<xhtml:link rel="alternate" hreflang="${escapeXml(locale)}" href="${escapeXml(href)}" />`,
      )
      .join('');
    return `<url><loc>${escapeXml(entry.url)}</loc><lastmod>${toIsoDate(entry.lastModified)}</lastmod>${alternates}</url>`;
  })
  .join('')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
