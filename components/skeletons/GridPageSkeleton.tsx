// components/skeletons/GridPageSkeleton.tsx
import CardSkeleton from "./CardSkeleton";

export default function GridPageSkeleton({ count = 12 }: { count?: number }) {
    return (
        <div className="content-grid" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
            {Array.from({ length: count }).map((_, index) => (
                <CardSkeleton key={index} />
            ))}
        </div>
    );
}


