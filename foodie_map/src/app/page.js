// pages/index.js (or page.js)
import React from 'react';
import Link from 'next/link';
import Layout from '../components/Layout.js';
import styles from './page.module.css';

export default function Home() {
  return (
    <Layout>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        {/* Add buttons/links to navigate to the editing pages */}
        <div className={styles.ctas}>
          <Link href="/edit_reviewers" passHref>
            <button className={styles.primary}>Edit Reviewers</button>
          </Link>
          <Link href="/edit_videos" passHref>
            <button className={styles.primary}>Edit Videos</button>
          </Link>
          <Link href="/edit_restaurants" passHref>
            <button className={styles.primary}>Edit Restaurants</button>
          </Link>
        </div>
      </main>
    </Layout>
  );
}
