
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Studio from './pages/Studio';
import Settings from './pages/Settings';
import LandingPage from './pages/LandingPage';
import AuthCallback from './pages/AuthCallback';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ApiKeyProvider, useApiKeyContext } from './context/apiKeyContext';
import { WelcomeModal } from './components/WelcomeModal';
import { FeedbackWidget } from './components/FeedbackWidget';
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
            <Routes>
                <Route path="/landing" element={<LandingPage />} />
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
                        <Studio />
                    </ProtectedRoute>
                } />
                <Route path="/hero-lab" element={
                    <ProtectedRoute>
                        <ComingSoon title="Hero Lab" />
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
                        <ComingSoon title="Paint by Numbers" />
                    </ProtectedRoute>
                } />
                <Route path="/vault" element={
                    <ProtectedRoute>
                        <ComingSoon title="Vault" />
                    </ProtectedRoute>
                } />
                <Route path="/settings" element={
                    <ProtectedRoute>
                        <Settings />
                    </ProtectedRoute>
                } />
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
