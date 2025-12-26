// components/homepage/HomepageFeeds.tsx
'use client';

import React, { useRef, useState } from "react";
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
import { useContentStore } from "@/lib/contentStore"; // <--- IMPORT

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

    // State to handle news feed expansion
    const [isNewsExpanded, setIsNewsExpanded] = useState(false);
    
    // Kinetic Action
    const { openIndexOverlay } = useContentStore();

    return (
        <div className={gridStyles.feedsGrid} ref={containerRef}>
            <motion.div style={{ y: articlesY }}>
                <ContentBlock title="موجز المقالات" Icon={ArticleIcon}>
                    <Feed
                        topSectionLabel="الأكثر رواجًا"
                        latestSectionLabel="الأحدث"
                        topItems={topArticles}
                        viewAllText="عرض كل المقالات"
                        // INTERCEPTED: Use kinetic action
                        onViewAll={() => openIndexOverlay('articles')}
                        
                        topItemsContainerClassName={`${feedStyles.topArticlesGrid} gpu-cull`}
                        renderTopItem={(item) => (
                            <ArticleCard 
                                key={item.id} 
                                article={item} 
                                layoutIdPrefix="homepage-top-articles"
                                isPriority={true}
                                smallTags={false} 
                            />
                        )}
                        enableTopSectionHoverEffect={false}
                        latestSectionContent={
                            <div style={{ marginTop: '1.5rem' }}>
                                <PaginatedCarousel items={latestArticles} />
                            </div>
                        }
                    />
                </ContentBlock>
            </motion.div>
            <motion.div style={{ y: newsY }}>
                <ContentBlock title="موجز الأخبار" Icon={NewsIcon}>
                    <Feed
                        topSectionLabel="الأكثر رواجًا"
                        latestSectionLabel="الأحدث"
                        topItems={pinnedNews}
                        
                        // Conditional Logic: Expand inline first, THEN go to overlay if clicked again
                        viewAllText={isNewsExpanded ? "عرض كل الأخبار" : "المزيد من الأخبار"}
                        onViewAll={() => {
                            if (!isNewsExpanded) {
                                setIsNewsExpanded(true);
                            } else {
                                openIndexOverlay('news');
                            }
                        }}
                        
                        topItemsContainerClassName={feedStyles.pinnedNewsList}
                        renderTopItem={() => null}
                        topSectionContent={<KineticSpotlightNews items={pinnedNews} />}
                        latestSectionContent={
                            <div style={{ marginTop: '1.5rem' }}>
                                <NewsfeedStream 
                                    items={newsList} 
                                    isExpanded={isNewsExpanded} 
                                />
                            </div>
                        }
                        enableTopSectionHoverEffect={true}
                    />
                </ContentBlock>
            </motion.div>
        </div>
    );
}