// components/TagLinks.tsx
'use client';

import { useRouter } from 'next/navigation';
import { translateTag } from '@/lib/translations';
import styles from './TagLinks.module.css';

export default function TagLinks({ tags, small = false }: { tags: string[], small?: boolean }) {
  const router = useRouter();

  if (!tags || tags.length === 0) return null;

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    e.stopPropagation(); // Stop the click from bubbling up to the card's main link
    const slug = tag.toLowerCase().replace(/ /g, '-');
    router.push(`/tags/${slug}`);
  };

  return (
    <div className={`${styles.tagLinksContainer} ${small ? styles.small : ''}`}>
      {tags.map((tag) => (
        <span 
          key={tag} 
          className={styles.tagLink}
          onClick={(e) => handleTagClick(e, tag)}
        >
          {translateTag(tag)}
        </span>
      ))}
    </div>
  );
}





