import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import * as fs from 'fs';
import matter from 'gray-matter';
import md from 'markdown-it';
import Head from 'next/head';
import path from 'path';
import React from 'react';
import Button from '../../Core/Button';
import Categories from '../../Core/Categories';
import Category from '../../Core/Category';
import Excerpt from '../../Core/Excerpt';
import Post from '../../Core/Post';
import Separator from '../../Core/Separator';
import Time from '../../Core/Time';
import Title from '../../Core/Title';
import getExcerpt from '../../utils/getExcerpt';
import getTime from '../../utils/getTime';
import { TITLE, URL } from '../../constants/configs';

export async function getStaticPaths() {
  const files = fs.readdirSync('_posts');
  const paths = files.map((fileName) => {
    const readFile = fs.readFileSync(`_posts/${fileName}`, 'utf-8');
    const { data: frontmatter } = matter(readFile);
    const { category } = frontmatter;
    return {
      params: {
        slug: category,
      },
    };
  });
  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params: { slug } }: any) {
  const files = fs.readdirSync('_posts').filter((file) => {
    return path.extname(file).toLowerCase() === '.md';
  });

  const categories = new Set();

  const posts = files.map((fileName) => {
    const post = fileName.replace('.md', '');
    const readFile = fs.readFileSync(`_posts/${fileName}`, 'utf-8');
    const { data: frontmatter, content } = matter(readFile);
    categories.add(frontmatter.category);
    return {
      slug: post,
      frontmatter,
      excerpt: getExcerpt(md().render(content)),
    };
  });

  return {
    props: {
      category: slug,
      categories: Array.from(categories).sort(),
      posts,
    },
  };
}

export default function CategoryPage({ category, categories, posts }: any) {
  const [isShowCategories, setIsShowCategories] = React.useState<boolean>(false);

  function categoriesHandler() {
    setIsShowCategories(!isShowCategories);
  }

  return (
    <>
      <Head>
        <title>
          {TITLE} - {category.replaceAll('-', ' ')}
        </title>
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
        .filter(({ frontmatter }: any) => category === frontmatter.category)
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
