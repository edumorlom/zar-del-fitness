import Image from "next/image";
import { formatDate, type Post } from "@/lib/blog";
import styles from "./PostCard.module.css";

/** Una nota en la lista del blog y en "Más notas". */
export function PostCard({ post, heading: Heading = "h2" }: { post: Post; heading?: "h2" | "h3" }) {
  return (
    <article className={styles.card} data-reveal>
      <a href={post.path} className={styles.link}>
        <div className={styles.img}>
          <Image src={post.image} alt={post.title} fill sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 30vw" />
        </div>
        <div className={styles.body}>
          <p className={styles.meta}>
            <span className="tag">{post.category}</span>
            <time dateTime={post.date}>{formatDate(post.date, post.lang)}</time>
          </p>
          <Heading className={styles.title}>{post.title}</Heading>
          <p className={styles.desc}>{post.description}</p>
        </div>
      </a>
    </article>
  );
}

/** La grilla de notas. */
export function PostGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}
