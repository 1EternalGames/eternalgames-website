// components/homepage/HomepageFeeds.tsx
'use client';

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import ArticlesFeed from "./ArticlesFeed";
import NewsFeed from "./NewsFeed";
import styles from './HomepageFeeds.module.css';
import { CardProps } from "@/types";
import { ContentBlock } from "../ContentBlock";

interface HomepageFeedsProps {
    topArticles: CardProps[];
    latestArticles: CardProps[];
    pinnedNews: CardProps[];
    newsList: CardProps[];
}

export default function HomepageFeeds({ topArticles, latestArticles, pinnedNews, newsList }: HomepageFeedsProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start end', 'end start']
    });

    const articlesY = useTransform(scrollYProgress, [0, 1], [0, -80]);
    const newsY = useTransform(scrollYProgress, [0, 1], [0, -50]);

    return (
        <div className={styles.feedsGrid} ref={containerRef}>
            <motion.div style={{ y: articlesY }}>
                <ContentBlock title="ديوان الفن">
                    <ArticlesFeed topArticles={topArticles} latestArticles={latestArticles} />
                </ContentBlock>
            </motion.div>
            <motion.div style={{ y: newsY }}>
                <ContentBlock title="موجز الأنباء">
                    <NewsFeed pinnedNews={pinnedNews} newsList={newsList} />
                </ContentBlock>
            </motion.div>
        </div>
    );
}