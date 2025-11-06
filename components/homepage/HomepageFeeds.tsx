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
import { ArticleIcon, NewsIcon } from "@/components/icons/index";
import PaginatedLatestArticles from "./PaginatedLatestArticles";
import KineticSpotlightNews from "./kinetic-news/KineticSpotlightNews";
import NewsfeedStream from "./kinetic-news/NewsfeedStream";
import gridStyles from './HomepageFeeds.module.css';
import feedStyles from './feed/Feed.module.css';
import { useLayoutIdStore } from "@/lib/layoutIdStore";

// --- Specific Card Renderers ---

const TopArticleCard = memo(({ article }: { article: CardProps }) => {
    const { livingCardRef, livingCardAnimation } = useLivingCard();
    const [isHovered, setIsHovered] = useState(false);
    const router = useRouter();
    const setPrefix = useLayoutIdStore((state) => state.setPrefix);
    const layoutIdPrefix = "homepage-top-articles";
    const linkPath = `/articles/${article.slug}`;

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (e.ctrlKey || e.metaKey) return; // Allow new tab
        if ((e.target as HTMLElement).closest('a')) return;
        e.preventDefault();
        setPrefix(layoutIdPrefix);
        router.push(linkPath, { scroll: false });
    };

    return (
        <motion.div ref={livingCardRef} style={livingCardAnimation.style} onMouseMove={livingCardAnimation.onMouseMove} onMouseEnter={() => { livingCardAnimation.onHoverStart(); setIsHovered(true); }} onMouseLeave={() => { livingCardAnimation.onHoverEnd(); setIsHovered(false); }} >
            <motion.a
                href={linkPath}
                onClick={handleClick}
                layoutId={`${layoutIdPrefix}-card-container-${article.legacyId}`} 
                className={`${feedStyles.topArticleCard} no-underline`}
            >
                <AnimatePresence>{isHovered && <KineticGlyphs />}</AnimatePresence>
                <motion.div layoutId={`${layoutIdPrefix}-card-image-${article.legacyId}`} className={feedStyles.topArticleImage}>
                    <Image src={article.imageUrl} alt={article.title} fill sizes="(max-width: 768px) 45vw, 30vw" placeholder="blur" blurDataURL={article.blurDataURL} style={{ objectFit: 'cover' }} />
                </motion.div>
                <div className={feedStyles.topArticleContent}>
                    <motion.h3 layoutId={`${layoutIdPrefix}-card-title-${article.legacyId}`} className={feedStyles.topArticleTitle}>{article.title}</motion.h3>
                    <div className={feedStyles.topArticleMeta}><CreatorCredit label="بقلم" creators={article.authors} small /></div>
                </div>
            </motion.a>
        </motion.div>
    );
});
TopArticleCard.displayName = "TopArticleCard";

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
                <ContentBlock title="ديوان الفن" Icon={ArticleIcon}>
                    <Feed
                        topSectionLabel="الأكثر رواجًا"
                        latestSectionLabel="الأحدث"
                        topItems={topArticles}
                        viewAllLink="/articles"
                        viewAllText="عرض كل المقالات"
                        topItemsContainerClassName={feedStyles.topArticlesGrid}
                        renderTopItem={(item) => <TopArticleCard key={item.id} article={item} />}
                        enableTopSectionHoverEffect={false}
                        latestSectionContent={<PaginatedLatestArticles items={latestArticles} />}
                    />
                </ContentBlock>
            </motion.div>
            <motion.div style={{ y: newsY }}>
                <ContentBlock title="موجز الأنباء" Icon={NewsIcon}>
                    <Feed
                        topSectionLabel="الأكثر رواجًا"
                        latestSectionLabel="الأحدث"
                        topItems={pinnedNews}
                        viewAllLink="/news"
                        viewAllText="عرض كل الأخبار"
                        topItemsContainerClassName={feedStyles.pinnedNewsList}
                        renderTopItem={() => null}
                        topSectionContent={<KineticSpotlightNews items={pinnedNews} />}
                        latestSectionContent={<NewsfeedStream items={newsList} />}
                        enableTopSectionHoverEffect={true}
                    />
                </ContentBlock>
            </motion.div>
        </div>
    );
}