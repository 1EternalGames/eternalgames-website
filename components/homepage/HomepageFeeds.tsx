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
import { useContentStore } from "@/lib/contentStore"; 

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

    const [isNewsExpanded, setIsNewsExpanded] = useState(false);
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
                        onViewAll={() => openIndexOverlay('articles')}
                        
                        topItemsContainerClassName={`${feedStyles.topArticlesGrid} gpu-cull`}
                        renderTopItem={(item) => (
                            <ArticleCard 
                                key={item.id} 
                                article={item} 
                                // PREFIX 1: Top Articles (Most Popular)
                                layoutIdPrefix="homepage-top-articles"
                                isPriority={true}
                                smallTags={false} 
                            />
                        )}
                        enableTopSectionHoverEffect={false}
                        latestSectionContent={
                            <div style={{ marginTop: '1.5rem' }}>
                                {/* PREFIX 2: Latest Articles (Paginated Carousel) */}
                                <PaginatedCarousel 
                                    items={latestArticles} 
                                    layoutIdPrefix="homepage-latest-articles"
                                />
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
                        topSectionContent={
                            // PREFIX 3: Pinned News (Spotlight)
                            <KineticSpotlightNews 
                                items={pinnedNews} 
                                layoutIdPrefix="homepage-pinned-news" 
                            />
                        }
                        latestSectionContent={
                            <div style={{ marginTop: '1.5rem' }}>
                                {/* PREFIX 4: Latest News (Stream) */}
                                <NewsfeedStream 
                                    items={newsList} 
                                    isExpanded={isNewsExpanded} 
                                    layoutIdPrefix="homepage-news-stream" 
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