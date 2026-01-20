
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Studio from './pages/Studio';
import StudioLaunchpad from './pages/StudioLaunchpad';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import LandingPage from './pages/LandingPage';
import WaitlistPage from './pages/WaitlistPage';
import ContactPage from './pages/ContactPage';
import { TermsPage } from './pages/TermsPage';
import AuthCallback from './pages/AuthCallback';
import AdminDashboard from './pages/AdminDashboard';
import Updates from './pages/Updates';
import { HeroLab } from './pages/HeroLab';
import { HeroLabLaunchpad } from './pages/HeroLabLaunchpad';
import Vault from './pages/Vault';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ApiKeyProvider, useApiKeyContext } from './context/apiKeyContext';
import { WelcomeModal } from './components/WelcomeModal';
import { FeedbackWidget } from './components/FeedbackWidget';
import { CookieConsent } from './components/CookieConsent';
import { Gallery } from './pages/Gallery';
import { SettingsProvider } from './context/settingsContext';

// Placeholder component for routes not yet implemented
const ComingSoon: React.FC<{ title: string }> = ({ title }) => (
    <div className="coming-soon-container">
        <div className="aurora-veil" />
        <div className="coming-soon-content glass-card">
            <h1 className="text-gradient-primary">{title}</h1>
            <p>This feature is coming soon!</p>
            <a href="/dashboard" className="btn-secondary" style={{ marginTop: '1.5rem', textDecoration: 'none' }}>
                ← Back to Dashboard
            </a>
        </div>
    </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-deep-onyx">
                <div className="w-8 h-8 border-2 border-aurora-blue border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/landing" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

// Inner app component that has access to all contexts
const AppContent: React.FC = () => {
    const { isFirstLogin, isLoading: apiKeyLoading } = useApiKeyContext();
    const { isAuthenticated } = useAuth();

    // Show welcome modal for authenticated first-time users
    const showWelcome = isAuthenticated && isFirstLogin && !apiKeyLoading;

    return (
        <>
            {showWelcome && <WelcomeModal />}
            {isAuthenticated && <FeedbackWidget />}
            <CookieConsent />
            <Routes>
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/waitlist" element={<WaitlistPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Public route redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />
                <Route path="/studio" element={
                    <ProtectedRoute>
                        <StudioLaunchpad />
                    </ProtectedRoute>
                } />
                <Route path="/studio/project/:projectId" element={
                    <ProtectedRoute>
                        <Studio />
                    </ProtectedRoute>
                } />
                <Route path="/hero-lab" element={
                    <ProtectedRoute>
                        <HeroLabLaunchpad />
                    </ProtectedRoute>
                } />
                <Route path="/hero-lab/:projectId" element={
                    <ProtectedRoute>
                        <HeroLab />
                    </ProtectedRoute>
                } />
                <Route path="/cover-creator" element={
                    <ProtectedRoute>
                        <ComingSoon title="Cover Creator" />
                    </ProtectedRoute>
                } />
                <Route path="/monochrome-maker" element={
                    <ProtectedRoute>
                        <ComingSoon title="Monochrome Maker" />
                    </ProtectedRoute>
                } />
                <Route path="/storybook-creator" element={
                    <ProtectedRoute>
                        <ComingSoon title="Story Book Creator" />
                    </ProtectedRoute>
                } />
                <Route path="/paint-by-numbers" element={
                    <ProtectedRoute>
                        <ComingSoon title="Color by Numbers" />
                    </ProtectedRoute>
                } />
                <Route path="/vault" element={
                    <ProtectedRoute>
                        <Vault />
                    </ProtectedRoute>
                } />
                <Route path="/gallery" element={
                    <ProtectedRoute>
                        <Gallery />
                    </ProtectedRoute>
                } />
                <Route path="/settings" element={
                    <ProtectedRoute>
                        <Settings />
                    </ProtectedRoute>
                } />
                <Route path="/admin" element={
                    <ProtectedRoute>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/updates" element={
                    <ProtectedRoute>
                        <Updates />
                    </ProtectedRoute>
                } />

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    );
};

export const Router: React.FC = () => {
    return (
        <AuthProvider>
            <SettingsProvider>
                <ApiKeyProvider>
                    <BrowserRouter>
                        <AppContent />
                    </BrowserRouter>
                </ApiKeyProvider>
            </SettingsProvider>
        </AuthProvider>
    );
};

export default Router;
