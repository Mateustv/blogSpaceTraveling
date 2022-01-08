import { GetStaticPaths, GetStaticProps } from 'next';
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
import Link from 'next/link';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      };
    }[],
    nextPost: {
      uid: string;
      data: {
        title: string;
      };
    }[],
  }
  preview: boolean;
}

export default function Post({ post, navigation, preview }: PostProps) {

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
  const isPostEdited =
    post.first_publication_date !== post.last_publication_date;

  let editionDate;
  if (isPostEdited) {
    editionDate = format(
      new Date(post.last_publication_date),
      "'* editado em' dd MMM yyyy', às' H':'m",
      {
        locale: ptBR,
      }
    );
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
          {isPostEdited && (
            <span>{editionDate}</span>
          )}
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

        <section className={styles.nextPrevBtn}>
          {navigation?.prevPost.length > 0 && (
            <div className={styles.prev}>
              <h3>{navigation.prevPost[0].data.title}</h3>
              <Link href={`/post/${navigation.prevPost[0].uid}`}>
                <a>Post anterior</a>
              </Link>
            </div>
          )}
          {navigation?.nextPost.length > 0 && (
            <div className={styles.next}>
              <h3>{navigation.nextPost[0].data.title}</h3>
              <Link href={`/post/${navigation.nextPost[0].uid}`}>
                <a>Próximo post</a>
              </Link>
            </div>

          )}
        </section>

        <Comments />

        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a className={commonStyles.preveiwBtn}>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
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

export const getStaticProps: GetStaticProps = async ({ preview = false, params, previewData }) => {
  const { slug } = params

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref || null
  });

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date desc]',
    }
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
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
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results,
      },
      preview,
      // revalidate: 60 * 3 // 3 minutos
    }
  }
};
