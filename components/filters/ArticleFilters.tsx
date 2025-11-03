// components/filters/ArticleFilters.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilterRemoveIcon } from '@/components/icons/index';
import GameFilterPopover from './GameFilterPopover';
import TagFilterPopover from './TagFilterPopover';
import SelectedGameButton from './ui/SelectedGameButton';
import SelectedTagsButton from './ui/SelectedTagsButton';
import FilterToggleButton from '@/components/filters/ui/FilterToggleButton';
import { usePopoverManager } from '@/hooks/usePopoverManager';
import { translateTag } from '@/lib/translations';
import styles from './Filters.module.css';
import FilterContainer from './ui/FilterContainer';
import FilterGroup from './ui/FilterGroup';

export default function ArticleFilters({ 
    sortOrder, onSortChange, searchTerm, onSearchChange, 
    allGames, selectedGame, onGameSelect, 
    allGameTags, selectedGameTags, onGameTagToggle,
    allArticleTypeTags, selectedArticleType, onArticleTypeSelect,
    onClearAllFilters 
}: any) {
    const { popoverRef, openPopover, togglePopover, closePopover } = usePopoverManager();
    const [isMobile, setIsMobile] = useState(false);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const hasActiveFilters = !!selectedGame || selectedGameTags.length > 0 || !!selectedArticleType || searchTerm;

    const desktopFilters = (
        <div className={styles.desktopFilters}>
            <input type="search" placeholder="ابحث في المقالات بالعنوان..." className={styles.searchInput} value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
            <FilterGroup label="الفرز حسب:">
                {[{ label: 'الأحدث', value: 'latest' }, { label: 'الأكثر رواجًا', value: 'viral' }].map(option => (
                    <motion.button key={option.value} onClick={() => onSortChange(option.value)} className={`${styles.filterButton} ${sortOrder === option.value ? styles.active : ''}`}>
                        {option.label}
                        {sortOrder === option.value && <motion.div layoutId="article-sort-highlight" className={styles.filterHighlight} />}
                    </motion.button>
                ))}
            </FilterGroup>
            <FilterGroup label="نوع المقال:">
                <motion.button onClick={() => onArticleTypeSelect(null)} className={`${styles.filterButton} ${!selectedArticleType ? styles.active : ''}`}>
                    الكل
                    {!selectedArticleType && <motion.div layoutId="article-type-highlight" className={styles.filterHighlight} />}
                </motion.button>
                {allArticleTypeTags.map((tag: any) => (
                    <motion.button key={tag._id} onClick={() => onArticleTypeSelect(tag)} className={`${styles.filterButton} ${selectedArticleType?._id === tag._id ? styles.active : ''}`}>
                        {translateTag(tag.title)}
                        {selectedArticleType?._id === tag._id && <motion.div layoutId="article-type-highlight" className={styles.filterHighlight} />}
                    </motion.button>
                ))}
            </FilterGroup>
            <FilterGroup label="التصفية بـ:">
                <motion.div style={{ position: 'relative' }} layout>
                    <SelectedGameButton selectedGame={selectedGame} onClearGame={onGameSelect} onOpenPopover={() => togglePopover('game')} />
                    <AnimatePresence>{openPopover === 'game' && (<GameFilterPopover allGames={allGames} selectedGame={selectedGame} onGameSelect={(game) => { onGameSelect(game); closePopover(); }} onClose={closePopover} />)}</AnimatePresence>
                </motion.div>
                <div style={{ position: 'relative' }}>
                    <SelectedTagsButton selectedTags={selectedGameTags} onOpenPopover={() => togglePopover('tags')} />
                    <AnimatePresence>{openPopover === 'tags' && (<TagFilterPopover allTags={allGameTags} selectedTags={selectedGameTags} onTagToggle={(tag) => { onGameTagToggle(tag); }} />)}</AnimatePresence>
                </div>
                <AnimatePresence>{hasActiveFilters && (<motion.button className={`${styles.filterButton} ${styles.clear}`} onClick={onClearAllFilters} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}><span>مسح المرشحات</span><FilterRemoveIcon height={18} width={18} /></motion.button>)}</AnimatePresence>
            </FilterGroup>
        </div>
    );
    
    const mobileFilters = (
        <>
            <div className={styles.mobileTriggerBar}>
                <input type="search" placeholder="ابحث..." className={styles.searchInput} value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
                <FilterToggleButton onClick={() => setIsMobileFiltersOpen(prev => !prev)} hasActiveFilters={hasActiveFilters} />
            </div>
             <AnimatePresence>
                {isMobileFiltersOpen && (
                    <motion.div
                        className={styles.collapsibleFilterContent}
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        exit={{ scaleY: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        <FilterGroup label="الفرز حسب:">
                            {[{ label: 'الأحدث', value: 'latest' }, { label: 'الأكثر رواجًا', value: 'viral' }].map(option => (
                                <motion.button key={option.value} onClick={() => onSortChange(option.value)} className={`${styles.filterButton} ${sortOrder === option.value ? styles.active : ''}`}>
                                    {option.label}
                                    {sortOrder === option.value && <motion.div layoutId="article-sort-highlight" className={styles.filterHighlight} />}
                                </motion.button>
                            ))}
                        </FilterGroup>
                        <FilterGroup label="النوع:">
                             <motion.button onClick={() => onArticleTypeSelect(null)} className={`${styles.filterButton} ${!selectedArticleType ? styles.active : ''}`}>
                                الكل
                                {!selectedArticleType && <motion.div layoutId="article-type-highlight" className={styles.filterHighlight} />}
                            </motion.button>
                            {allArticleTypeTags.map((tag: any) => (
                                <motion.button key={tag._id} onClick={() => onArticleTypeSelect(tag)} className={`${styles.filterButton} ${selectedArticleType?._id === tag._id ? styles.active : ''}`}>
                                    {translateTag(tag.title)}
                                    {selectedArticleType?._id === tag._id && <motion.div layoutId="article-type-highlight" className={styles.filterHighlight} />}
                                </motion.button>
                            ))}
                        </FilterGroup>
                        <FilterGroup label="تصفية:">
                             <motion.div style={{ position: 'relative' }} layout>
                                <SelectedGameButton selectedGame={selectedGame} onClearGame={onGameSelect} onOpenPopover={() => togglePopover('game')} />
                                <AnimatePresence>{openPopover === 'game' && (<GameFilterPopover allGames={allGames} selectedGame={selectedGame} onGameSelect={(game) => { onGameSelect(game); closePopover(); }} onClose={closePopover} />)}</AnimatePresence>
                            </motion.div>
                            <div style={{ position: 'relative' }}>
                                <SelectedTagsButton selectedTags={selectedGameTags} onOpenPopover={() => togglePopover('tags')} />
                                <AnimatePresence>{openPopover === 'tags' && (<TagFilterPopover allTags={allGameTags} selectedTags={selectedGameTags} onTagToggle={(tag) => { onGameTagToggle(tag); }} />)}</AnimatePresence>
                            </div>
                        </FilterGroup>
                        {hasActiveFilters && (<motion.button className={`${styles.filterButton} ${styles.clear}`} onClick={onClearAllFilters}><span>مسح المرشحات</span><FilterRemoveIcon height={18} width={18} /></motion.button>)}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );

    return (
        <FilterContainer ref={popoverRef}>
            {isMobile ? mobileFilters : desktopFilters}
        </FilterContainer>
    );
}


