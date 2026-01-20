
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TermsPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Background with noise texture */}
            <div className="absolute inset-0 z-0 opacity-40">
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="group flex items-center pl-0 hover:bg-transparent text-slate-500 hover:text-slate-800 transition-colors bg-transparent border-none cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8 md:p-12"
                >
                    <div className="prose prose-slate max-w-none">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
                        <p className="text-slate-500 mb-8">Last Updated: January 20, 2026</p>

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-8">
                            <h3 className="text-amber-800 font-semibold mt-0 mb-2">Beta & Development Notice</h3>
                            <p className="text-amber-700 text-sm mb-0">
                                You acknowledge that myjoe Creative Suite is in a developmental "Beta" stage. The Service is provided "AS IS".
                                Data loss may occur. Features may change without notice. Use at your own risk.
                            </p>
                        </div>

                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using the Service, you agree to be bound by these Terms and our Privacy Policy.
                            You represent that you are at least 13 years old. If you are under 18, you must have parental permission.
                        </p>

                        <h2>2. Artificial Intelligence Disclaimer</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Probabilistic Nature:</strong> AI may generate content that is inaccurate, offensive, or "hallucinated."</li>
                            <li><strong>No Professional Advice:</strong> Output is not professional, legal, or medical advice.</li>
                            <li><strong>Similarity:</strong> Similar prompts may produce similar outputs for different users.</li>
                        </ul>

                        <h2>3. Intellectual Property (IP) Rights</h2>

                        <h3>3.1. Your Content (Inputs)</h3>
                        <p>
                            You retain all ownership rights to the prompts, reference images, and other materials you upload.
                        </p>

                        <h3>3.2. Generated Content (Outputs)</h3>
                        <p><strong>United Kingdom Users:</strong> Under the CDPA 1988, you are considered the "arranger" and owner of the generated work.</p>
                        <p><strong>International Users (including US):</strong> We assign all our rights in the Output to you. However, we make no warranty regarding copyright validity in jurisdictions requiring human authorship.</p>

                        <h3>3.3. License to Us</h3>
                        <p>
                            You grant us a license to use your Inputs and Outputs solely to operate and improve the Service (e.g., rendering your gallery).
                        </p>

                        <h2>4. Acceptable Use Policy</h2>
                        <p>You agree NOT to use the Service to generate:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Child Sexual Abuse Material (CSAM) or content sexualizing minors.</li>
                            <li>Non-Consensual Intimate Imagery (NCII) or deepfakes.</li>
                            <li>Unlawful, defamatory, or terrorist-related content.</li>
                        </ul>
                        <p>We reserve the right to ban users violating this policy without notice.</p>

                        <h2>5. Limitation of Liability</h2>
                        <p className="uppercase text-sm font-semibold">
                            To the fullest extent permitted by law, myjoe Creative Suite is not liable for indirect damages, data loss, or loss of profits. Our total liability is limited to the amount paid by you in the last 12 months or £50.
                        </p>

                        <h2>6. Governing Law</h2>
                        <p>
                            These Terms are governed by the laws of <strong>England and Wales</strong>.
                        </p>

                        <h2>7. Contact</h2>
                        <p>
                            Questions? Contact us at <a href="mailto:support@myjoe.app" className="text-indigo-600 hover:text-indigo-800">support@myjoe.app</a>.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
