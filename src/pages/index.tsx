import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';

import Prismic from '@prismicio/client'
import { getPrismicClient } from '../services/prismic';

import { FiCalendar, FiUser } from "react-icons/fi";

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}


export default function Home({ postsPagination, preview }: HomeProps): JSX.Element {

  const formatPost = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR, }),
    }
  })

  const [post, setPost] = useState<Post[]>(formatPost)
  const [nextPageResults, setNextPageResults] = useState(postsPagination.next_page)
  const [currentPage, setCurrentPage] = useState(1)

  async function handleNextPage() {

    if (currentPage !== 1 && nextPageResults === null) {
      return;
    }

    const postsResults = await fetch(`${nextPageResults}`).then(response => response.json())

    setNextPageResults(postsResults.next_page)
    setCurrentPage(postsResults.page)

    const newPost = postsResults.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR, }),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author
        }
      }
    })

    setPost([...post, ...newPost])
  }

  return (
    <>
      <main className={commonStyles.container}>
        <section className={styles.contentBlog}>
          {
            post.map(post => (
              <Link href={`/post/${post.uid}`} key={post.uid}>
                <a className={styles.blogsPosts}>
                  <strong>{post.data.title}</strong>
                  <p>{post.data.subtitle}</p>
                  <ul>
                    <li><FiCalendar />{post.first_publication_date}</li>
                    <li><FiUser /> {post.data.author} </li>
                  </ul>
                </a>
              </Link>
            ))
          }
        </section>
        {
          nextPageResults && (
            <button
              className={styles.loadMore}
              onClick={() => {
                handleNextPage()
              }}
            >
              Carregar mais posts
            </button>
          )
        }

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

export const getStaticProps: GetStaticProps = async ({ preview = false,
  previewData, }) => {

  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')], {
    pageSize: 1,
    ref: previewData?.ref ?? null,
  }
  );

  // console.log(JSON.stringify(postsResponse, null, 2))

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  })

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  }

  // console.log(results, next_page)
  return {
    props: {
      postsPagination,
      preview,
    },
  }
}