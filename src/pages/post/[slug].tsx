import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticProps } from 'next';
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
  estimatedReadingTime: number;
}

type Params = {
  params: {
    slug: string;
  };
};

export default function Post({
  post,
  estimatedReadingTime,
}: PostProps): JSX.Element {
  return (
    <>
      <Header />
      <main className={commonStyles.pageContent}>
        <img src={post.data.banner.url} alt="post-banner" />
        <div className={styles.postContainer}>
          <h1>{post.data.title}</h1>
          <div className={styles.postInfo}>
            <p>{post.first_publication_date}</p>
            <p>{post.data.author}</p>
            <p>{`${estimatedReadingTime} min`}</p>
          </div>
          <div className={styles.postContent}>
            {post.data.content.map(content => (
              <div key={content.heading}>
                <h1>{content.heading}</h1>
                {content.body.map(paragraph => (
                  <p key={paragraph.text}>{paragraph.text}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');

  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }: Params) => {
  const { slug } = params;

  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', slug);

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      { locale: ptBR }
    ),
    data: {
      title: response.data.title,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: content.body.map(body => {
            return {
              text: body.text,
            };
          }),
        };
      }),
    },
  };

  const numberOfWords = post.data.content.reduce((prv, crr) => {
    const headingArray = crr.heading.split(' ');
    const textArray = crr.body.reduce((prev, curr) => {
      const paragraphArray = curr.text.split(' ');
      return [...prev, ...paragraphArray];
    }, []);
    return [...prv, ...headingArray, ...textArray];
  }, []).length;

  const estimatedReadingTime = Math.ceil(numberOfWords / 200);

  return {
    props: {
      post,
      estimatedReadingTime,
    },
  };
};
