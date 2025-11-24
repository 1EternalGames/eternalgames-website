// app/loading.tsx
import IndexPageSkeleton from "@/components/skeletons/IndexPageSkeleton";

// This global loading file prevents CLS during page transitions by showing
// a skeleton that matches the main layout structure.
export default function Loading() {
    return (
        <div className="page-container">
            <IndexPageSkeleton heroVariant="center" />
        </div>
    );
}