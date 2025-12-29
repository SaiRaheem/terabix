import { useState } from 'react';

const CookieInstructions: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="w-full max-w-2xl mb-6">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full glass p-4 rounded-lg flex items-center justify-between hover:shadow-lg transition-all duration-200"
            >
                <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-gray-800 dark:text-white">
                        How to get your Terabox cookie?
                    </span>
                </div>
                <svg
                    className={`w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                        }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isExpanded && (
                <div className="glass p-6 rounded-lg mt-2 animate-slide-up space-y-4">
                    <h3 className="font-bold text-lg gradient-text mb-4">Step-by-Step Guide:</h3>

                    <ol className="space-y-3 text-gray-700 dark:text-gray-200">
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                                1
                            </span>
                            <div>
                                <strong>Login to Terabox:</strong> Open{' '}
                                <a
                                    href="https://www.terabox.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-500 hover:underline"
                                >
                                    www.terabox.com
                                </a>{' '}
                                and log in to your account.
                            </div>
                        </li>

                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                                2
                            </span>
                            <div>
                                <strong>Open Developer Tools:</strong> Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">F12</kbd> or right-click and select "Inspect".
                            </div>
                        </li>

                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                                3
                            </span>
                            <div>
                                <strong>Go to Application Tab:</strong> Click on the "Application" or "Storage" tab in DevTools.
                            </div>
                        </li>

                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                                4
                            </span>
                            <div>
                                <strong>Visit Your Share Link:</strong> Open your Terabox share link in the same browser tab. This generates required session cookies.
                            </div>
                        </li>

                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                                5
                            </span>
                            <div>
                                <strong>Find Cookies:</strong> In DevTools, go to Application → Cookies → "https://www.terabox.com".
                            </div>
                        </li>

                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                                6
                            </span>
                            <div>
                                <strong>Copy ALL Cookies:</strong> You need to copy the entire cookie string. Use a cookie editor extension (like "EditThisCookie" or "Cookie-Editor") and export all cookies as a string, OR manually copy all cookies in the format: <code className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">ndus=xxx; BOXCLND=xxx; csrfToken=xxx</code>
                            </div>
                        </li>

                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                                7
                            </span>
                            <div>
                                <strong>Paste Here:</strong> Paste the complete cookie string in the cookie field above.
                            </div>
                        </li>
                    </ol>

                    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            ⚠️ <strong>Security Note:</strong> Your cookie is only used for this request and is never stored. However, be cautious about sharing your cookies with untrusted services.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CookieInstructions;
