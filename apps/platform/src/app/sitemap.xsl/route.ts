const xsl = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html>
      <head>
        <meta charset="utf-8" />
        <title>XML Sitemap</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
          h1 { font-size: 28px; margin: 0 0 8px; }
          p { margin: 0 0 10px; color: #374151; }
          table { border-collapse: collapse; width: 100%; margin-top: 14px; }
          th, td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; vertical-align: top; }
          th { background: #f9fafb; font-weight: 700; }
          tr:hover { background: #f9fafb; }
          a { color: #1d4ed8; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .muted { color: #6b7280; font-size: 13px; }
          .small { font-size: 13px; white-space: nowrap; }
        </style>
      </head>
      <body>
        <h1>XML Sitemap</h1>
        <p>Generated for search engines and people.</p>
        <p class="muted">
          <xsl:text>Total URLs: </xsl:text>
          <xsl:value-of select="count(s:urlset/s:url)" />
        </p>
        <table>
          <thead>
            <tr>
              <th>URL</th>
              <th>Last Modified</th>
            </tr>
          </thead>
          <tbody>
            <xsl:for-each select="s:urlset/s:url">
              <tr>
                <td>
                  <a>
                    <xsl:attribute name="href"><xsl:value-of select="s:loc"/></xsl:attribute>
                    <xsl:value-of select="s:loc"/>
                  </a>
                </td>
                <td class="small"><xsl:value-of select="s:lastmod"/></td>
              </tr>
            </xsl:for-each>
          </tbody>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
`;

export async function GET() {
  return new Response(xsl, {
    headers: {
      'Content-Type': 'application/xslt+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
