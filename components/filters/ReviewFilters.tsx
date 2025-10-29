// components/filters/ReviewFilters.tsx
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import GameFilterPopover from './GameFilterPopover';
import TagFilterPopover from './TagFilterPopover';
import ScoreFilterPopover from './ScoreFilterPopover';
import PopoverTriggerButton from './ui/PopoverTriggerButton';
import SelectedGameButton from './ui/SelectedGameButton';
import SelectedTagsButton from './ui/SelectedTagsButton';
import { usePopoverManager } from '@/hooks/usePopoverManager';
import styles from './Filters.module.css'; // <-- THE FIX: Import the centralized stylesheet
import FilterContainer from './ui/FilterContainer';
import FilterGroup from './ui/FilterGroup';

export type SortOption = 'latest' | 'score';
export type ScoreFilter = 'All' | '9-10' | '8-8.9' | '7-7.9' | '<7';

const sortOptions: { label: string; value: SortOption }[] = [ { label: 'الأحدث', value: 'latest' }, { label: 'الأعلى تقييمًا', value: 'score' }, ];
const scoreRangeMap: Record<ScoreFilter, string> = { 'All': 'الكل', '9-10': '9-10', '8-8.9': '8-8.9', '7-7.9': '7-7.9', '<7': '<7' };

export default function ReviewFilters({ activeSort, onSortChange, selectedScoreRange, onScoreSelect, allGames, selectedGame, onGameSelect, allTags, selectedTags, onTagToggle, onClearAll, searchTerm, onSearchChange }: any) {
    const { popoverRef, openPopover, togglePopover, closePopover } = usePopoverManager();

    const scoreButtonLabel = selectedScoreRange === 'All' ? 'التقييم' : `التقييم: ${scoreRangeMap[selectedScoreRange as ScoreFilter]}`;
    const hasActiveFilters = selectedScoreRange !== 'All' || !!selectedGame || selectedTags.length > 0 || searchTerm;

    return (
        <FilterContainer ref={popoverRef}>
            <input type="search" placeholder="ابحث في المراجعات بالعنوان..." className={styles.searchInput} value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} style={{ width: '100%', marginBottom: '1.5rem', marginTop: '0.5rem' }} />
            
            <FilterGroup label="الفرز حسب:">
                {sortOptions.map(option => (
                    <motion.button key={option.value} onClick={() => onSortChange(option.value)} className={`${styles.filterButton} ${activeSort === option.value ? styles.active : ''}`}>
                        {option.label}
                        {activeSort === option.value && <motion.div layoutId="sort-highlight" className={styles.filterHighlight} />}
                    </motion.button>
                ))}
            </FilterGroup>

            <FilterGroup label="التصفية حسب:">
                <div style={{ position: 'relative' }}>
                    <PopoverTriggerButton label={scoreButtonLabel} isActive={selectedScoreRange !== 'All'} onClick={() => togglePopover('score')} layoutId="review-score-highlight" />
                    <AnimatePresence>{openPopover === 'score' && (<ScoreFilterPopover selectedScoreRange={selectedScoreRange} onScoreSelect={(score) => { onScoreSelect(score); closePopover(); }} onClose={closePopover} />)}</AnimatePresence>
                </div>
                <motion.div style={{ position: 'relative' }} layout>
                    <SelectedGameButton selectedGame={selectedGame} onClearGame={onGameSelect} onOpenPopover={() => togglePopover('game')} />
                    <AnimatePresence>{openPopover === 'game' && (<GameFilterPopover allGames={allGames} selectedGame={selectedGame} onGameSelect={(game) => { onGameSelect(game); closePopover(); }} onClose={closePopover} />)}</AnimatePresence>
                </motion.div>
                <div style={{ position: 'relative' }}>
                    <SelectedTagsButton selectedTags={selectedTags} onOpenPopover={() => togglePopover('tags')} />
                    <AnimatePresence>{openPopover === 'tags' && (<TagFilterPopover allTags={allTags} selectedTags={selectedTags} onTagToggle={(tag) => { onTagToggle(tag); closePopover(); }} />)}</AnimatePresence>
                </div>
                <AnimatePresence>{hasActiveFilters && (<motion.button className={`${styles.filterButton} ${styles.clear}`} onClick={onClearAll} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>مسح الكل</motion.button>)}</AnimatePresence>
            </FilterGroup>
        </FilterContainer>
    );
}