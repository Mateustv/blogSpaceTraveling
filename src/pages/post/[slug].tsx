import { GetStaticPaths, GetStaticProps } from 'next';
import Image from 'next/image'
import { useRouter } from 'next/router';

import Prismic from '@prismicio/client'
import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom'

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

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

  const router = useRouter()

  if (router.isFallback) {
    return <div>Loading...</div>
  }

  return (
    <>
      <img className={styles.imgPrin} src="https://images.ecycle.com.br/wp-content/uploads/2021/05/20195924/o-que-e-paisagem.jpg"></img>
      <main className={commonStyles.container}>
        <article className={styles.articlePost}>
          <h1>Criando um app CRA do zero</h1>
          <ul>
            <li><FiCalendar />     15 Mar 2021</li>
            <li><FiUser />     Mateus Tavares</li>
            <li><FiClock />     4 min</li>
          </ul>
          <h2>Proin et varius</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.

            Nullam dolor sapien,<a> vulputate eu diam at </a>, condimentum hendrerit tellus. Nam facilisis sodales felis, pharetra pharetra lectus auctor sed.

            Ut venenatis mauris vel libero pretium, et pretium ligula faucibus. Morbi nibh felis, elementum a posuere et, vulputate et erat. Nam venenatis.
          </p>
          <h2>Cras laoreet mi</h2>
          <p>
            Nulla auctor sit amet quam vitae commodo. Sed risus justo, vulputate quis neque eget, dictum sodales sem. In eget felis finibus, mattis magna a, efficitur ex. Curabitur vitae justo consequat sapien gravida auctor a non risus. Sed malesuada mauris nec orci congue, interdum efficitur urna dignissim. Vivamus cursus elit sem, vel facilisis nulla pretium consectetur. Nunc congue.

            Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Aliquam consectetur massa nec metus condimentum, sed tincidunt enim tincidunt. Vestibulum fringilla risus sit amet massa suscipit eleifend. Duis eget metus cursus, suscipit ante ac, iaculis est. Donec accumsan enim sit amet lorem placerat, eu dapibus ex porta. Etiam a est in leo pulvinar auctor. Praesent sed vestibulum elit, consectetur egestas libero.

            Ut varius quis velit sed cursus. Nunc libero ante, hendrerit eget consectetur vel, viverra quis lectus. Sed vulputate id quam nec tristique. Etiam lorem purus, imperdiet et porta in, placerat non turpis. Cras pharetra nibh eu libero ullamcorper, at convallis orci egestas. Fusce ut est tellus. Donec ac consectetur magna, nec facilisis enim. Sed vel tortor consectetur, facilisis felis non, accumsan risus. Integer vel nibh et turpis.
          </p>

        </article>
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


  console.log(JSON.stringify(post, null, 2))

  return {
    props: {
      post,
      revalidate: 60 * 3 // 3 minutos
    }
  }
};
