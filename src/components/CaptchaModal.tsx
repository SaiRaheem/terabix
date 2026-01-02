import { useState } from 'react';

interface CaptchaModalProps {
    shareLink: string;
    onRetry: (freshCookies: string) => void;
    onCancel: () => void;
}

const CaptchaModal: React.FC<CaptchaModalProps> = ({ shareLink, onRetry, onCancel }) => {
    const [freshCookies, setFreshCookies] = useState('');
    const [step, setStep] = useState<'instructions' | 'cookies'>('instructions');

    const handleOpenTerabox = () => {
        window.open(shareLink, '_blank', 'width=1000,height=700');
        setStep('cookies');
    };

    const handleRetry = () => {
        if (!freshCookies.trim()) {
            alert('Please paste your fresh cookies');
            return;
        }
        onRetry(freshCookies);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="card max-w-2xl w-full animate-slide-up">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold gradient-text mb-2">
                            🔒 CAPTCHA Verification Required
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Terabox requires you to solve a CAPTCHA to get the download link.
                        </p>
                    </div>
                </div>

                {step === 'instructions' && (
                    <div className="space-y-6">
                        <div className="glass p-6 rounded-lg">
                            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">
                                📋 Follow these steps:
                            </h3>
                            <ol className="space-y-3 text-gray-700 dark:text-gray-300">
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">1</span>
                                    <span>Click the button below to open Terabox in a new tab</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">2</span>
                                    <span>On the Terabox page, click the <strong>Download</strong> button</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">3</span>
                                    <span>If a CAPTCHA appears, <strong>solve it</strong> (drag slider, select images, etc.)</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">4</span>
                                    <span>After solving, come back to this tab</span>
                                </li>
                            </ol>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleOpenTerabox}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                <span>Open Terabox</span>
                            </button>
                            <button
                                onClick={onCancel}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {step === 'cookies' && (
                    <div className="space-y-6">
                        <div className="glass p-6 rounded-lg">
                            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">
                                🍪 Copy Your Fresh Cookies
                            </h3>
                            <ol className="space-y-3 text-gray-700 dark:text-gray-300 mb-4">
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center font-bold">1</span>
                                    <span>In the Terabox tab, press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm font-mono">F12</kbd> to open DevTools</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center font-bold">2</span>
                                    <span>Go to <strong>Application</strong> → <strong>Cookies</strong> → <strong>www.terabox.app</strong></span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center font-bold">3</span>
                                    <span>Select all cookies and copy them (or use a cookie editor extension)</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center font-bold">4</span>
                                    <span>Paste the cookies below</span>
                                </li>
                            </ol>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Fresh Cookies (after solving CAPTCHA)
                                </label>
                                <textarea
                                    value={freshCookies}
                                    onChange={(e) => setFreshCookies(e.target.value)}
                                    placeholder="Paste all cookies from terabox.app here..."
                                    rows={6}
                                    className="input-field resize-none font-mono text-sm"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    💡 Tip: These should include updated verification tokens after solving the CAPTCHA
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleRetry}
                                disabled={!freshCookies.trim()}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Retry with Fresh Cookies</span>
                            </button>
                            <button
                                onClick={() => setStep('instructions')}
                                className="btn-secondary"
                            >
                                Back
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CaptchaModal;
