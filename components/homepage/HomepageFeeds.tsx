// components/homepage/HomepageFeeds.tsx
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
    return (
        <div className={styles.feedsGrid}>
            <div>
                <ContentBlock title="ديوان الفن">
                    <ArticlesFeed topArticles={topArticles} latestArticles={latestArticles} />
                </ContentBlock>
            </div>
            <div>
                <ContentBlock title="موجز الأنباء">
                    <NewsFeed pinnedNews={pinnedNews} newsList={newsList} />
                </ContentBlock>
            </div>
        </div>
    );
}