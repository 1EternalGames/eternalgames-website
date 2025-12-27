// app/about/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { getAboutPageDataAction } from '@/app/actions/aboutActions';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
    title: 'من نحن',
    description: 'تعرف على فريق EternalGames ورؤيتنا في تقديم محتوى ألعاب عربي احترافي وموضوعي.',
};

export const dynamic = 'force-static';

export default async function AboutPage() {
    const data = await getAboutPageDataAction();

    return <AboutPageClient initialData={data} />;
}