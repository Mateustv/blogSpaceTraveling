import { GetStaticPaths, GetStaticProps } from 'next';
import Image from 'next/image'
import { useRouter } from 'next/router';

import Prismic from '@prismicio/client'
import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom'

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Comments from '../../components/comments';

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

export default function Post({ post }: PostProps) {

  const totalWords = post.data.content.reduce((total, content) => {
    total += content.heading.split(' ').length
    const words = content.body.map(word => word.text.split(' ').length)
    words.map(wordSun => total += wordSun)

    return total;
  }, 0)

  const readTime = Math.ceil(totalWords / 200)

  const dayFormamt = {
    ...post,
    first_publication_date: format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR, }),
  }

  const router = useRouter()

  if (router.isFallback) {
    return <h1>Carregando...</h1>
  }

  return (
    <>
      <img alt="imagem" className={styles.imgPrin} src={post.data.banner.url}></img>
      <main className={commonStyles.container}>
        <article className={styles.articlePost}>
          <h1>{post.data.title}</h1>
          <ul className={styles.listTime}>
            <li><FiCalendar />     {dayFormamt.first_publication_date}</li>
            <li><FiUser />     {post.data.author}</li>
            <li><FiClock />     {`${readTime} min`}</li>
          </ul>
          {
            post.data.content.map(post => {
              return (
                <div key={post.heading}>
                  <h2>{post.heading}</h2>
                  <div
                    dangerouslySetInnerHTML={{ __html: RichText.asHtml(post.body) }}
                  />
                </div>
              )
            })
          }
        </article>
        <Comments />
      </main>

    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {

  const prismic = getPrismicClient();
  const posts = await prismic.query([Prismic.predicates.at('document.type', 'post')], {
    pageSize: 20,
  });

  const postsParams = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      }
    }
  })
  return {
    paths: postsParams,
    fallback: true
  }

};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(post => {
        return {
          heading: post.heading,
          body: [...post.body],
        }
      }
      ),
    }
  }


  // console.log(JSON.stringify(post.data.content, null, 2))

  return {
    props: {
      post,
      // revalidate: 60 * 3 // 3 minutos
    }
  }
};
