import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client'
import { FiCalendar, FiUser } from "react-icons/fi";
import { format } from 'date-fns'

import { getPrismicClient } from '../services/prismic';

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
}

export default function Home({ postsPagination }: HomeProps) {
  return (
    <>
      <main className={commonStyles.container}>
        <section className={styles.contentBlog}>
          <h1>Como ultilizar Hooks</h1>
          <p>pensando em sincronização em vez  de ciclos de vidas</p>
          <span><FiCalendar />  {format(new Date(), 'dd MMM yyyy')}</span>
          <span><FiUser /> Mateus Tavares </span>
        </section>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {

  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')], {
    fetch: ["post.title", 'post.subtitle', 'post.author'],
    pageSize: 1,
  }
  );

  // console.log(JSON.stringify(postsResponse, null, 2))

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(new Date(post.last_publication_date), 'dd MMM yyyy'),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  })

  const next_page = postsResponse.next_page

  return {
    props: {
      postsPagination: {
        next_page,
        results,
      },
    }
  }

};
