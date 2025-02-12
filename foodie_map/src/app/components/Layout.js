import Sidebar from "./Sidebar";
import styles from "./Layout.module.css";

export default function Layout({ children }) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}