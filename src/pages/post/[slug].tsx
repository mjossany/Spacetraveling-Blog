import { PrismicRichText } from '@prismicio/react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

type Params = {
  params: {
    slug: string;
  };
};

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const numberOfWords = post.data.content.reduce((prv, crr) => {
    const headingArray = crr.heading.split(' ');
    const textArray = crr.body.reduce((prev, curr) => {
      const paragraphArray = curr.text.split(' ');
      return [...prev, ...paragraphArray];
    }, []);
    return [...prv, ...headingArray, ...textArray];
  }, []).length;

  const estimatedReadingTime = Math.ceil(numberOfWords / 200);

  return (
    <>
      <Header />
      <main className={commonStyles.pageContent}>
        <img src={post.data.banner.url} alt="post-banner" />
        <div className={styles.pageContainer}>
          <h1>{post.data.title}</h1>
          <div className={styles.postInfo}>
            <p>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </p>
            <p>{post.data.author}</p>
            <p>{`${estimatedReadingTime} min`}</p>
          </div>
          <div className={styles.postsContainer}>
            {post.data.content.map(content => (
              <div className={styles.postContent} key={content.heading}>
                <h1>{content.heading}</h1>
                {content.body.map(body => (
                  <p key={body.text}>{body.text}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');

  const paths = posts.results.reduce((prev, curr) => {
    return [...prev, { params: { slug: curr.uid } }];
  }, []);

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }: Params) => {
  const { slug } = params;

  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', slug);

  return {
    props: {
      post: response,
    },
    redirect: 60 * 30, // 30 minutes
  };
};
