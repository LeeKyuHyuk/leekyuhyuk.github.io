const fs = require('fs');
const matter = require('gray-matter');
const dateFns = require('date-fns');
const dateFnsTz = require('date-fns-tz');

const URL = 'https://kyuhyuk.kr';
const TIMEZONE = 'Asia/Seoul';

function getTime(date) {
  return {
    text: dateFnsTz.formatInTimeZone(
      dateFns.parse(date, 'yyyy-MM-dd HH:mm:ss', new Date()),
      TIMEZONE,
      "yyyy‑MM‑dd'T'HH:mm:ssxxxxx"
    ),
    date: dateFnsTz.zonedTimeToUtc(
      dateFns.parse(date, 'yyyy-MM-dd HH:mm:ss', new Date()),
      TIMEZONE
    ),
  };
}

function addPage(page) {
  return `  <url>
    <loc>${`${URL}/${page.category}/${page.year}/${page.month}/${page.day}/${page.slug}`}</loc>
    <lastmod>${page.utc}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;
}

async function generateSitemap() {
  // excludes Nextjs files and API routes.
  const files = fs.readdirSync('_posts');
  const pages = files.map((fileName) => {
    const title = fileName.replace('.md', '');
    const readFile = fs.readFileSync(`_posts/${fileName}`, 'utf-8');
    const { data: frontmatter } = matter(readFile);
    const { category, date: dateStr } = frontmatter;
    const date = {
      year: getTime(dateStr).date.getFullYear().toString(),
      month: (getTime(dateStr).date.getMonth() + 1).toString().padStart(2, '0'),
      date: getTime(dateStr).date.getDate().toString().padStart(2, '0'),
      text: getTime(dateStr).text,
    };
    return {
      category: String(category).toLowerCase(),
      year: date?.year,
      month: date?.month,
      day: date?.date,
      utc: date?.text,
      slug: title,
    };
  });
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  ${pages.map(addPage).join('\n')}
  </urlset>`;
  fs.writeFileSync('public/sitemap.xml', sitemap);
}
generateSitemap();
