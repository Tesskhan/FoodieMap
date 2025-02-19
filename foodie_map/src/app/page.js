"use client"; // Required when using useRouter in a client component

import { useRouter } from "next/navigation";
import Link from "next/link"; // Import Link
import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();

  return (
    <main className={styles.main}>
      <Image
        className={styles.logo}
        src="/next.svg"
        alt="Next.js logo"
        width={180}
        height={38}
        priority
      />
      <div className={styles.ctas}>
        <Link href="/edit_reviewers" className={styles.primary}>
          Edit Reviewers
        </Link>
        <Link href="/edit_videos" className={styles.primary}>
          Edit Videos
        </Link>
        <Link href="/edit_restaurants" className={styles.primary}>
          Edit Restaurants
        </Link>
      </div>
    </main>
  );
}
