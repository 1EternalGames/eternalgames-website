// app/reset-password/page.tsx
import { Suspense } from 'react';
import ResetPasswordClientPage from './ResetPasswordClientPage';

const ResetPasswordFallback = () => {
    return (
        <div className="container page-container" style={{display: 'flex', alignItems:'center', justifyContent: 'center'}}>
            <div className="spinner" />
        </div>
    );
};

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<ResetPasswordFallback />}>
            <ResetPasswordClientPage />
        </Suspense>
    );
}





