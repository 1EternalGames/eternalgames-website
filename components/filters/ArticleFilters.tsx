// components/filters/ArticleFilters.tsx
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import GameFilterPopover from './GameFilterPopover';
import TagFilterPopover from './TagFilterPopover';
import SelectedGameButton from './ui/SelectedGameButton';
import SelectedTagsButton from './ui/SelectedTagsButton';
import { usePopoverManager } from '@/hooks/usePopoverManager';
import { translateTag } from '@/lib/translations';
import styles from './Filters.module.css';

export default function ArticleFilters({ 
    sortOrder, onSortChange, searchTerm, onSearchChange, 
    allGames, selectedGame, onGameSelect, 
    allGameTags, selectedGameTags, onGameTagToggle,
    allArticleTypeTags, selectedArticleType, onArticleTypeSelect,
    onClearAllFilters 
}: any) {
    const { popoverRef, openPopover, togglePopover, closePopover } = usePopoverManager();
    
    const hasActiveFilters = !!selectedGame || selectedGameTags.length > 0 || !!selectedArticleType || searchTerm;

    return (
        <div className={styles.filtersContainer} ref={popoverRef}>
            <input type="search" placeholder="ابحث في المقالات بالعنوان..." className={styles.searchInput} value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
            
            <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>الفرز حسب:</span>
                <div className={styles.filterButtonsGroup}>
                    {[{ label: 'الأحدث', value: 'latest' }, { label: 'الأكثر رواجًا', value: 'viral' }].map(option => (
                        <motion.button key={option.value} onClick={() => onSortChange(option.value)} className={`${styles.filterButton} ${sortOrder === option.value ? styles.active : ''}`}>
                            {option.label}
                            {sortOrder === option.value && <motion.div layoutId="article-sort-highlight" className={styles.filterHighlight} />}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* THE FIX: New, dedicated filter group for Article Types */}
            <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>نوع المقال:</span>
                <div className={styles.filterButtonsGroup}>
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
                </div>
            </div>

            <div className={styles.filterGroup}>
                 <span className={styles.filterLabel}>التصفية بـ:</span>
                 <div className={styles.filterButtonsGroup}>
                    <motion.div style={{ position: 'relative' }} layout>
                        <SelectedGameButton selectedGame={selectedGame} onClearGame={onGameSelect} onOpenPopover={() => togglePopover('game')} />
                        <AnimatePresence>
                            {openPopover === 'game' && (<GameFilterPopover allGames={allGames} selectedGame={selectedGame} onGameSelect={(game) => { onGameSelect(game); closePopover(); }} onClose={closePopover} />)}
                        </AnimatePresence>
                    </motion.div>
                    <div style={{ position: 'relative' }}>
                        <SelectedTagsButton selectedTags={selectedGameTags} onOpenPopover={() => togglePopover('tags')} />
                        <AnimatePresence>
                            {openPopover === 'tags' && (<TagFilterPopover allTags={allGameTags} selectedTags={selectedGameTags} onTagToggle={(tag) => { onGameTagToggle(tag); }} />)}
                        </AnimatePresence>
                    </div>
                    <AnimatePresence>
                        {hasActiveFilters && (<motion.button className={`${styles.filterButton} ${styles.clear}`} onClick={onClearAllFilters} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}> مسح المرشحات </motion.button>)}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}


