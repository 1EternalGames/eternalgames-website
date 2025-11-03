// components/filters/ui/FilterContainer.tsx
import React from 'react';
import styles from '../Filters.module.css';

interface FilterContainerProps {
    children: React.ReactNode;
}

const FilterContainer = React.forwardRef<HTMLDivElement, FilterContainerProps>(({ children }, ref) => {
    return (
        <div className={styles.filtersContainer} ref={ref}>
            {children}
        </div>
    );
});

FilterContainer.displayName = 'FilterContainer';
export default FilterContainer;


