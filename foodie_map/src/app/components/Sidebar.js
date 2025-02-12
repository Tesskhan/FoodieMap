// components/Sidebar.js
import Link from "next/link";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  return (
    <div className={styles.sidebar}>
      <h2>Navigation</h2>
      <ul>
        <li>
          <Link href="/edit_reviewers">
            <a>Edit Reviewers</a>
          </Link>
        </li>
        <li>
          <Link href="/edit_videos">
            <a>Edit Videos</a>
          </Link>
        </li>
        <li>
          <Link href="/edit_restaurants">
            <a>Edit Restaurants</a>
          </Link>
        </li>
      </ul>
    </div>
  );
}
