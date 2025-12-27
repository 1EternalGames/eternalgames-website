// components/TagLinks.tsx
'use client';

import { translateTag } from '@/lib/translations';
import styles from './TagLinks.module.css';
import KineticLink from '@/components/kinetic/KineticLink';

export default function TagLinks({ tags, small = false }: { tags: string[], small?: boolean }) {

  if (!tags || tags.length === 0) return null;

  return (
    <div className={`${styles.tagLinksContainer} ${small ? styles.small : ''}`}>
      {tags.map((tag) => {
        const slug = tag.toLowerCase().replace(/ /g, '-');
        return (
            <KineticLink 
                key={tag} 
                href={`/tags/${slug}`}
                slug={slug}
                type="tags" // ENABLED
                className={`${styles.tagLink} no-underline`}
                onClick={(e) => e.stopPropagation()} 
            >
                {translateTag(tag)}
            </KineticLink>
        );
      })}
    </div>
  );
}