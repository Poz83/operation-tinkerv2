
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PrivacyPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-[hsl(var(--background))]">
            {/* Image Background - fixed to viewport */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 dark:opacity-80 transition-opacity duration-700"
                    style={{ backgroundImage: `url('/landing-bg.png')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--background))]/50 to-[hsl(var(--background))] mix-blend-overlay" />
            </div>

            <div className="relative z-10 w-full max-w-4xl px-6 py-12">
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="group flex items-center pl-0 hover:bg-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors bg-transparent border-none cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="glass-panel p-8 md:p-12 rounded-2xl border border-[hsl(var(--glass-border))] shadow-2xl backdrop-blur-xl bg-[hsl(var(--glass-bg))]"
                >
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2">Privacy Policy</h1>
                        <p className="text-[hsl(var(--muted-foreground))] mb-8">Last Updated: January 20, 2026</p>

                        <h2>1. Introduction</h2>
                        <p>
                            Welcome to <strong>myjoe Creative Suite</strong> ("we," "our," or "us"). We provide an AI-powered coloring book generation platform (the "Service"). This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you access our application.
                        </p>
                        <p>
                            By using the Service, you acknowledge that you are interacting with Generative Artificial Intelligence (AI) systems.
                        </p>

                        <h2>2. Information We Collect</h2>

                        <h3>2.1. Personal Information</h3>
                        <p>We collect information that you strictly provide to us:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Account Data:</strong> Email address and name (via Supabase Authentication).</li>
                            <li><strong>Usage Data:</strong> Logs of when you log in and how you use the features.</li>
                        </ul>

                        <h3>2.2. Content Data (The "Inputs" and "Outputs")</h3>
                        <p>To provide our Service, we process:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Text Prompts:</strong> The descriptions you type to generate images.</li>
                            <li><strong>Reference Images:</strong> Any images you upload to guide the style or structure of the generation.</li>
                            <li><strong>Generated Images:</strong> The coloring pages produced by the AI.</li>
                        </ul>

                        <h2>3. How We Use AI & Your Data</h2>

                        <h3>3.1. Nature of the Service</h3>
                        <p>
                            Our Service utilizes generative artificial intelligence technologies (including Google Gemini and Imagen models). These systems are probabilistic and may produce content that is inaccurate, offensive, or not unique.
                        </p>

                        <h3>3.2. Model Training (Privacy-First Approach)</h3>
                        <p><strong>We do not use your Content (Prompts or Uploaded Images) to train our foundation AI models.</strong></p>
                        <p>
                            Your data is processed solely to generate your requested output and is then stored in your private history. We act as a "Service Provider" or "Processor" regarding your creative inputs.
                        </p>

                        <h3>3.3. Service Provision</h3>
                        <p>We use your information to:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Generate the coloring pages you request.</li>
                            <li>Maintain your history and "Vault" of saved projects.</li>
                            <li>Prevent fraud and abuse of the AI systems.</li>
                        </ul>

                        <h2>4. Ownership and Rights</h2>

                        <h3>4.1. Your Content</h3>
                        <p>
                            As between you and us, <strong>you own your Inputs and Outputs.</strong> You have the right to use, sell, and distribute the coloring pages you generate, subject to the terms of the underlying AI models.
                        </p>

                        <h3>4.2. License to Us</h3>
                        <p>
                            You grant us a perpetual, worldwide license to use your Inputs and Outputs <strong>solely to provide and maintain the Service</strong> (e.g., to render the image in your gallery).
                        </p>

                        <h3>4.3. Similarity Disclaimer</h3>
                        <p>
                            Due to the nature of AI, Outputs may not be unique. Other users providing similar prompts may receive similar generated images.
                        </p>

                        <h2>5. Third-Party Sub-Processors</h2>
                        <p>
                            To provide the Service, we share data with specific third-party providers. By using the Service, you authorize these sub-processors:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Supabase:</strong> Authentication & Database Hosting (USA)</li>
                            <li><strong>Google Cloud (Vertex AI):</strong> AI Image & Text Generation (USA)</li>
                            <li><strong>Resend:</strong> Transactional Emails (USA)</li>
                        </ul>
                        <p>
                            Your data is transferred to the United States. We rely on the EU-US Data Privacy Framework (DPF) and Standard Contractual Clauses (SCCs) for these transfers.
                        </p>

                        <h2>6. Cookies and Tracking</h2>
                        <p>We use <strong>Strictly Necessary Cookies</strong> only.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Auth Token:</strong> Keep you logged in.</li>
                            <li><strong>Preferences:</strong> Save your theme (Light/Dark) and UI settings.</li>
                        </ul>
                        <p>We do <strong>not</strong> use third-party advertising cookies or cross-site trackers.</p>

                        <h2>7. Data Retention and Deletion</h2>
                        <p>
                            We retain your Content for as long as your account is active. You may delete specific projects or your entire account at any time within the application settings, which will permanently remove your data from our servers.
                        </p>

                        <h2>8. Children's Privacy</h2>
                        <p>
                            Our Service is not intended for individuals under the age of 13. We do not knowingly collect personal information from children. If we become aware that we have collected likely data from a child under 13, we will delete it.
                        </p>

                        <h2>9. Contact Us</h2>
                        <p>
                            If you have questions about this Privacy Policy, please <a href="/contact" className="text-indigo-400 hover:text-indigo-300">Contact Us</a> or email us at: <strong>privacy@myjoe.app</strong>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
