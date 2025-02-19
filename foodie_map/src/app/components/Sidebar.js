// components/Sidebar.js
import Link from "next/link";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  return (
    <div className={styles.sidebar}>
      <h2>Navigation</h2>
      <ul>
        <li>
          <Link href="/edit_reviewers" className={styles.primary}>
            Edit Reviewers
          </Link>
        </li>
        <li>
          <Link href="/edit_videos" className={styles.primary}>
            Edit Videos
          </Link>
        </li>
        <li>
          <Link href="/edit_restaurants" className={styles.primary}>
            Edit Restaurants
          </Link>
        </li>
      </ul>
    </div>
  );
}
