// components/homepage/HomepageFeeds.tsx
'use client';

import React, { useRef, useState, memo } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Feed from "./feed/Feed";
import CreatorCredit from "@/components/CreatorCredit";
import KineticGlyphs from "@/components/effects/KineticGlyphs";
import { useLivingCard } from "@/hooks/useLivingCard";
import { CardProps } from "@/types";
import { ContentBlock } from "../ContentBlock";
import gridStyles from './HomepageFeeds.module.css';
import feedStyles from './feed/Feed.module.css';

// --- Specific Card Renderers ---

const TopArticleCard = memo(({ article }: { article: CardProps }) => {
    const { livingCardRef, livingCardAnimation } = useLivingCard();
    const [isHovered, setIsHovered] = useState(false);
    const router = useRouter();
    const handleClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('a')) return;
        router.push(`/articles/${article.slug}`);
    };
    return (
        <motion.div ref={livingCardRef} style={livingCardAnimation.style} onMouseMove={livingCardAnimation.onMouseMove} onMouseEnter={() => { livingCardAnimation.onHoverStart(); setIsHovered(true); }} onMouseLeave={() => { livingCardAnimation.onHoverEnd(); setIsHovered(false); }} onClick={handleClick} className={feedStyles.topArticleCard}>
            <AnimatePresence>{isHovered && <KineticGlyphs />}</AnimatePresence>
            <div className={feedStyles.topArticleImage}><Image src={article.imageUrl} alt={article.title} fill sizes="(max-width: 768px) 90vw, 30vw" placeholder="blur" blurDataURL={article.blurDataURL} style={{ objectFit: 'cover' }} /></div>
            <div className={feedStyles.topArticleContent}>
                <h3 className={feedStyles.topArticleTitle}>{article.title}</h3>
                <div className={feedStyles.topArticleMeta}><CreatorCredit label="بقلم" creators={article.authors} /></div>
            </div>
        </motion.div>
    );
});
TopArticleCard.displayName = "TopArticleCard";

const LatestArticleListItem = memo(({ article }: { article: CardProps }) => {
    const router = useRouter();
    const handleClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('a')) return;
        router.push(`/articles/${article.slug}`);
    };
    return (
        <div className={feedStyles.latestArticleItem} onClick={(e) => handleClick(e)}>
            <div className={feedStyles.latestArticleThumbnail}><Image src={article.imageUrl} alt={article.title} fill sizes="120px" placeholder="blur" blurDataURL={article.blurDataURL} style={{ objectFit: 'cover' }} /></div>
            <div className={feedStyles.latestArticleInfo}>
                <h4 className={feedStyles.latestArticleTitle}>{article.title}</h4>
                <div className={feedStyles.latestArticleMeta}><CreatorCredit label="بقلم" creators={article.authors} /></div>
            </div>
        </div>
    );
});
LatestArticleListItem.displayName = "LatestArticleListItem";

const PinnedNewsCard = memo(({ item }: { item: CardProps }) => (
    <Link href={`/news/${item.slug}`} className={`${feedStyles.pinnedNewsItem} no-underline`}>
        <div className={feedStyles.pinnedNewsThumbnail}><Image src={item.imageUrl} alt={item.title} fill sizes="80px" placeholder="blur" blurDataURL={item.blurDataURL} style={{ objectFit: 'cover' }} /></div>
        <div className={feedStyles.pinnedNewsInfo}>
            <h4 className={feedStyles.pinnedNewsTitle}>{item.title}</h4>
            {item.date && <p className={feedStyles.pinnedNewsDate}>{item.date.split(' - ')[0]}</p>}
            <p className={feedStyles.pinnedNewsCategory}>{item.category}</p>
        </div>
    </Link>
));
PinnedNewsCard.displayName = "PinnedNewsCard";

const LatestNewsListItem = memo(({ item }: { item: CardProps }) => (
    <Link href={`/news/${item.slug}`} className={`${feedStyles.newsListItem} no-underline`}>
        <div className={feedStyles.newsListThumbnail}><Image src={item.imageUrl} alt={item.title} fill sizes="60px" placeholder="blur" blurDataURL={item.blurDataURL} style={{ objectFit: 'cover' }} /></div>
        <div className={feedStyles.newsListInfo}>
            <p className={feedStyles.newsListCategory}>{item.category}</p>
            <h5 className={feedStyles.newsListTitle}>{item.title}</h5>
            {item.date && <p style={{ margin: '0.25rem 0 0', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>{item.date.split(' - ')[0]}</p>}
        </div>
    </Link>
));
LatestNewsListItem.displayName = "LatestNewsListItem";

// --- Main Component ---

interface HomepageFeedsProps {
    topArticles: CardProps[]; latestArticles: CardProps[];
    pinnedNews: CardProps[]; newsList: CardProps[];
}

export default function HomepageFeeds({ topArticles, latestArticles, pinnedNews, newsList }: HomepageFeedsProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] });
    const articlesY = useTransform(scrollYProgress, [0, 1], [0, -80]);
    const newsY = useTransform(scrollYProgress, [0, 1], [0, -50]);

    return (
        <div className={gridStyles.feedsGrid} ref={containerRef}>
            <motion.div style={{ y: articlesY }}>
                <ContentBlock title="ديوان الفن">
                    <Feed
                        topSectionLabel="الأكثر رواجًا"
                        latestSectionLabel="الأحدث"
                        topItems={topArticles}
                        latestItems={latestArticles}
                        viewAllLink="/articles"
                        viewAllText="عرض كل المقالات"
                        topItemsContainerClassName={feedStyles.topArticlesGrid}
                        renderTopItem={(item) => <TopArticleCard key={item.id} article={item} />}
                        renderListItem={(item) => <LatestArticleListItem key={item.id} article={item} />}
                        enableTopSectionHoverEffect={false}
                    />
                </ContentBlock>
            </motion.div>
            <motion.div style={{ y: newsY }}>
                <ContentBlock title="موجز الأنباء">
                    <Feed
                        topSectionLabel="الأكثر رواجًا"
                        latestSectionLabel="الأحدث"
                        topItems={pinnedNews}
                        latestItems={newsList}
                        viewAllLink="/news"
                        viewAllText="عرض كل الأخبار"
                        topItemsContainerClassName={feedStyles.pinnedNewsList}
                        renderTopItem={(item, index) => (
                            <React.Fragment key={item.id}>
                                <PinnedNewsCard item={item} />
                                {index < pinnedNews.length - 1 && <div className={feedStyles.pinnedNewsDivider} />}
                            </React.Fragment>
                        )}
                        renderListItem={(item) => <LatestNewsListItem key={item.id} item={item} />}
                        listDividerClassName={feedStyles.newsListDivider}
                        enableTopSectionHoverEffect={true}
                    />
                </ContentBlock>
            </motion.div>
        </div>
    );
}