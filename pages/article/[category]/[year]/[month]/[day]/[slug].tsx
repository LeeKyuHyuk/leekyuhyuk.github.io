import * as fs from 'fs';
import matter from 'gray-matter';
import md from 'markdown-it';
import hljs from 'highlight.js';

import Head from 'next/head';
import { styled } from '@stitches/react';
import getTime from '../../../../../../utils/getTime';
import getExcerpt from '../../../../../../utils/getExcerpt';
import { AUTHOR, TITLE, URL } from '../../../../../../constants/configs';
import 'highlight.js/styles/github.css';

export async function getStaticPaths() {
  const files = fs.readdirSync('_posts');
  const paths = files.map((fileName) => {
    const title = fileName.replace('.md', '');
    const readFile = fs.readFileSync(`_posts/${fileName}`, 'utf-8');
    const { data: frontmatter } = matter(readFile);
    const { category, date: dateStr } = frontmatter;
    const date = {
      year: getTime(dateStr).date.getFullYear().toString(),
      month: (getTime(dateStr).date.getMonth() + 1).toString().padStart(2, '0'),
      date: getTime(dateStr).date.getDate().toString().padStart(2, '0'),
    };
    return {
      params: {
        category: String(category).toLowerCase(),
        year: date?.year,
        month: date?.month,
        day: date?.date,
        slug: title,
      },
    };
  });
  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params: { slug } }: any) {
  const fileName = fs.readFileSync(`_posts/${slug}.md`, 'utf-8');
  const { data: frontmatter, content } = matter(fileName);
  const { category, date: dateStr } = frontmatter;
  const date = {
    year: getTime(dateStr).date.getFullYear().toString(),
    month: (getTime(dateStr).date.getMonth() + 1).toString().padStart(2, '0'),
    date: getTime(dateStr).date.getDate().toString().padStart(2, '0'),
  };
  return {
    props: {
      excerpt: getExcerpt(md().render(content)),
      url: `/article/${category.toLowerCase()}/${date.year}/${date.month}/${date.date}/${slug}`,
      frontmatter,
      content,
    },
  };
}

const Title = styled('h1', {
  fontSize: '2.5rem',
  lineHeight: 1.5,
  letterSpacing: '-0.004em',
  marginTop: 0,
  marginBottom: '2rem',
  fontWeight: 700,
  color: '#212529',
  wordBreak: 'keep-all',
  transition: 'color 0.125s ease-in 0s;',
});

const Category = styled('a', {
  background: '#F8F9FA',
  padding: '0 1rem',
  height: '2rem',
  borderRadius: '1rem',
  display: 'inline-flex',
  alignItems: 'center',
  marginRight: '0.875rem',
  color: '#12B886',
  textDecoration: 'none',
  fontWeight: 400,
  fontSize: '1rem',
});

const Time = styled('time', {
  fontSize: '1rem',
  color: '#495057',
});

const Content = styled('div', {
  marginTop: '2rem',
  fontSize: '1.125rem',
  color: '#212529',
  transition: 'color 0.125s ease-in 0s;',
  lineHeight: 1.7,
  letterSpacing: '-0.004em',
  wordBreak: 'keep-all',
  overflowWrap: 'break-word',
});

export default function PostPage({ excerpt, url, frontmatter, content }: any) {
  return (
    <>
      <article>
        <Head>
          <title>{frontmatter.title}</title>
          <meta name="author" content={AUTHOR} />
          <meta name="generator" content={AUTHOR} />
          <meta name="description" content={excerpt} />
          <meta itemProp="url" content={URL + url} />
          <meta itemProp="headline" content={frontmatter.title} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={URL + url} />
          <meta property="og:title" content={frontmatter.title} />
          <meta property="og:description" content={excerpt} />
          <meta property="og:site_name" content={TITLE} />
          <meta property="og:locale" content="ko_KR" />
        </Head>
        <Title>
          <a href={URL + url}>{frontmatter.title}</a>
        </Title>
        <Category href={`${URL}/category/${frontmatter.category}`}>
          {frontmatter.category.replaceAll('-', ' ')}
        </Category>
        <Time dateTime={frontmatter.date}>{getTime(frontmatter.date).text}</Time>
        <Content
          id="post"
          dangerouslySetInnerHTML={{
            __html: md({
              html: true,
              highlight: function (str, lang) {
                if (lang && hljs.getLanguage(lang)) {
                  try {
                    return hljs.highlight(str, { language: lang }).value;
                  } catch (__) {}
                }
                return '';
              },
            }).render(content),
          }}
        />
      </article>
    </>
  );
}
