import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import * as fs from 'fs';
import matter from 'gray-matter';
import md from 'markdown-it';
import Head from 'next/head';
import path from 'path';
import React from 'react';
import Button from '../core/Button';
import Categories from '../core/Categories';
import Category from '../core/Category';
import Excerpt from '../core/Excerpt';
import Post from '../core/Post';
import Separator from '../core/Separator';
import Time from '../core/Time';
import Title from '../core/Title';
import getExcerpt from '../utils/getExcerpt';
import getTime from '../utils/getTime';
import { TITLE, URL } from '../constants/configs';

export async function getStaticProps() {
  const files = fs.readdirSync('_posts').filter((file) => {
    return path.extname(file).toLowerCase() === '.md';
  });

  const categories = new Set();

  const posts = files.map((fileName) => {
    const slug = fileName.replace('.md', '');
    const readFile = fs.readFileSync(`_posts/${fileName}`, 'utf-8');
    const { data: frontmatter, content } = matter(readFile);
    categories.add(frontmatter.category);
    return {
      slug,
      frontmatter,
      excerpt: getExcerpt(md().render(content)),
    };
  });

  return {
    props: {
      posts,
      categories: Array.from(categories).sort(),
    },
  };
}

export default function Home({ posts, categories }: any) {
  const [isShowCategories, setIsShowCategories] = React.useState<boolean>(false);

  function categoriesHandler() {
    setIsShowCategories(!isShowCategories);
  }

  return (
    <>
      <Head>
        <title>{TITLE}</title>
      </Head>
      <>
        <Button onClick={categoriesHandler}>
          Categories
          {isShowCategories ? (
            <CaretDownOutlined style={{ marginLeft: '0.3rem' }} />
          ) : (
            <CaretRightOutlined style={{ marginLeft: '0.3rem' }} />
          )}
        </Button>
        {isShowCategories && (
          <Categories>
            {categories.map((item: string) => (
              <Category key={item} href={`${URL}/category/${item}`}>
                {item.replaceAll('-', ' ')}
              </Category>
            ))}
          </Categories>
        )}
      </>
      {posts
        .sort((a: any, b: any) => {
          const aDate = getTime(a.frontmatter.date).date;
          const bDate = getTime(b.frontmatter.date).date;
          return aDate > bDate ? -1 : aDate < bDate ? 1 : 0;
        })
        .map(({ slug, frontmatter, excerpt }: any) => {
          const { category, date: dateStr } = frontmatter;
          const date = {
            year: getTime(dateStr).date.getFullYear().toString(),
            month: (getTime(dateStr).date.getMonth() + 1).toString().padStart(2, '0'),
            date: getTime(dateStr).date.getDate().toString().padStart(2, '0'),
          };
          return (
            <Post key={slug}>
              <Title>
                <a
                  href={`${URL}/article/${category.toLowerCase()}/${date?.year}/${date?.month}/${
                    date?.date
                  }/${slug}`}
                >
                  {frontmatter.title}
                </a>
              </Title>
              <Excerpt>{excerpt}...</Excerpt>
              <Category href={`${URL}/category/${frontmatter.category}`}>
                {frontmatter.category.replaceAll('-', ' ')}
              </Category>
              <Time dateTime={frontmatter.date}>{getTime(frontmatter.date).text}</Time>
              <Separator />
            </Post>
          );
        })}
    </>
  );
}
