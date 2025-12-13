// components/homepage/HomepageFeeds.tsx
'use client';

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Feed from "./feed/Feed";
import { CardProps } from "@/types";
import { ContentBlock } from "../ContentBlock";
import { ArticleIcon, NewsIcon } from "@/components/icons/index";
import PaginatedCarousel from "../PaginatedCarousel";
import KineticSpotlightNews from "./kinetic-news/KineticSpotlightNews";
import NewsfeedStream from "./kinetic-news/NewsfeedStream";
import ArticleCard from "@/components/ArticleCard";
import gridStyles from './HomepageFeeds.module.css';
import feedStyles from './feed/Feed.module.css';

interface HomepageFeedsProps {
    topArticles: CardProps[];
    latestArticles: CardProps[];
    pinnedNews: CardProps[];
    newsList: CardProps[];
}

export default function HomepageFeeds({ topArticles, latestArticles, pinnedNews, newsList }: HomepageFeedsProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] });
    const articlesY = useTransform(scrollYProgress, [0, 1], [0, -80]);
    const newsY = useTransform(scrollYProgress, [0, 1], [0, -50]);

    return (
        <div className={gridStyles.feedsGrid} ref={containerRef}>
            <motion.div style={{ y: articlesY }}>
                <ContentBlock title="أحدث المقالات" Icon={ArticleIcon}>
                    <Feed
                        topSectionLabel="الأكثر رواجًا"
                        latestSectionLabel="الأحدث"
                        topItems={topArticles}
                        viewAllLink="/articles"
                        viewAllText="عرض كل المقالات"
                        topItemsContainerClassName={feedStyles.topArticlesGrid}
                        renderTopItem={(item) => (
                            <ArticleCard 
                                key={item.id} 
                                article={item} 
                                layoutIdPrefix="homepage-top-articles"
                                isPriority={true}
                                smallTags={false} // REVERTED: Normal tags for popular articles
                            />
                        )}
                        enableTopSectionHoverEffect={false}
                        latestSectionContent={<PaginatedCarousel items={latestArticles} />}
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