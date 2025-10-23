// components/filters/NewsFilterBar.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import GameFilterPopover from './GameFilterPopover';
import TagFilterPopover from './TagFilterPopover';
import PopoverTriggerButton from './ui/PopoverTriggerButton';
import SelectedGameButton from './ui/SelectedGameButton';
import SelectedTagsButton from './ui/SelectedTagsButton';
import { usePopoverManager } from '@/hooks/usePopoverManager'; // <-- NEW HOOK IMPORT
import styles from './Filters.module.css';
import newsStyles from '../../app/news/NewsPage.module.css';

const SortPopover = ({ activeSort, onSortChange, onClose }: any) => {
    const sortOptions = [{ label: 'الأحدث', value: 'latest' }, { label: 'الأكثر انتشاراً', value: 'viral' }];
    return (
      <motion.div className={styles.filterPopover} variants={{ hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0 } }} initial="hidden" animate="visible" exit="hidden" onClick={e => e.stopPropagation()}>
        {sortOptions.map(opt => (
          <button key={opt.value} className={`${styles.popoverItemButton} ${activeSort === opt.value ? styles.selected : ''}`} onClick={() => { onSortChange(opt.value); onClose(); }}>{opt.label}</button>
        ))}
      </motion.div>
    );
};
  
const TypePopover = ({ activeType, onTypeChange, onClose }: any) => {
    const typeOptions = [{ label: 'كل المصادر', value: 'الكل' }, { label: 'داخلي (يخص لعبة)', value: 'Internal' }, { label: 'خارجي (صناعة/عام)', value: 'External' }];
    return (
      <motion.div className={styles.filterPopover} variants={{ hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0 } }} initial="hidden" animate="visible" exit="hidden" onClick={e => e.stopPropagation()}>
        {typeOptions.map(opt => (
          <button key={opt.value} className={`${styles.popoverItemButton} ${activeType === opt.value ? styles.selected : ''}`} onClick={() => { onTypeChange(opt.value); onClose(); }}>{opt.label}</button>
        ))}
      </motion.div>
    );
};

export default function NewsFilterBar({
  allCategories, activeCategory, onCategoryChange,
  allGames, selectedGame, onGameSelect,
  allTags, selectedTags, onTagToggle, onClearAll,
  activeSort, onSortChange, newsTypeFilter, onNewsTypeChange
}: any) {
    const { popoverRef, openPopover, togglePopover, closePopover } = usePopoverManager();

    const hasActiveFilters = !!selectedGame || selectedTags.length > 0 || newsTypeFilter !== 'الكل';
    const sortLabel = `Sort: ${activeSort === 'latest' ? 'Recent' : 'الأكثر رواجًا'}`;
    const typeLabel = `Type: ${newsTypeFilter === 'الكل' ? 'الكل' : newsTypeFilter}`;

    return (
        <div className={newsStyles.newsFilterBar} ref={popoverRef}>
            <div className={newsStyles.categoryTabs}>
                {allCategories.map((category: string, index: number) => (
                    <button
                        key={`${category}-${index}`}
                        onClick={() => onCategoryChange(category)}
                        className={`${newsStyles.categoryTab} ${activeCategory === category ? newsStyles.active : ''}`}
                    >
                        {category}
                        {activeCategory === category && (
                        <motion.div layoutId="news-category-underline" className={newsStyles.categoryUnderline} />
                        )}
                    </button>
                ))}
            </div>
            <div className={newsStyles.filterControls}>
                <div style={{ position: 'relative' }}>
                    <PopoverTriggerButton label={sortLabel} isActive={activeSort !== 'latest'} onClick={() => togglePopover('sort')} layoutId="news-sort-highlight" />
                    <AnimatePresence>{openPopover === 'sort' && <SortPopover activeSort={activeSort} onSortChange={onSortChange} onClose={closePopover} />}</AnimatePresence>
                </div>
                
                <div style={{ position: 'relative' }}>
                    <PopoverTriggerButton label={typeLabel} isActive={newsTypeFilter !== 'الكل'} onClick={() => togglePopover('type')} layoutId="news-type-highlight" />
                    <AnimatePresence>{openPopover === 'type' && <TypePopover activeType={newsTypeFilter} onTypeChange={onNewsTypeChange} onClose={closePopover} />}</AnimatePresence>
                </div>

                <div style={{ position: 'relative' }}>
                    <SelectedGameButton selectedGame={selectedGame} onClearGame={onGameSelect} onOpenPopover={() => togglePopover('game')} />
                    <AnimatePresence>
                        {openPopover === 'game' && <GameFilterPopover allGames={allGames} selectedGame={selectedGame} onGameSelect={(game) => { onGameSelect(game); closePopover(); }} onClose={closePopover} />}
                    </AnimatePresence>
                </div>

                <div style={{ position: 'relative' }}>
                    <SelectedTagsButton selectedTags={selectedTags} onOpenPopover={() => togglePopover('tags')} />
                    <AnimatePresence>
                        {openPopover === 'tags' && <TagFilterPopover allTags={allTags} selectedTags={selectedTags} onTagToggle={(tag) => { onTagToggle(tag); closePopover(); }} />}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {hasActiveFilters && (
                        <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}>
                        <PopoverTriggerButton label="مسح" isActive={false} onClick={onClearAll} className={styles.clear} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}





