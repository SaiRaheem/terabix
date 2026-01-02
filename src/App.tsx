import { useState } from 'react';
import DownloadForm from './components/DownloadForm';
import FileDisplay from './components/FileDisplay';
import ThemeToggle from './components/ThemeToggle';
import CookieInstructions from './components/CookieInstructions';
import CaptchaModal from './components/CaptchaModal';
import { fetchDownloadLink, getDownloadLinkFromBrowser } from './utils/api';
import type { FileMetadata, FolderContent } from './types';
import './index.css';

function App() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileData, setFileData] = useState<FileMetadata | FolderContent | null>(null);
    const [isFolder, setIsFolder] = useState(false);
    const [requiresVerification, setRequiresVerification] = useState(false);
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
    const [showCaptchaModal, setShowCaptchaModal] = useState(false);
    const [currentLink, setCurrentLink] = useState<string>('');

    const handleSubmit = async (link: string, cookies: string) => {
        setIsLoading(true);
        setError(null);
        setFileData(null);
        setRequiresVerification(false);
        setShareLink(null);
        setVerificationMessage(null);
        setShowCaptchaModal(false);
        setCurrentLink(link);

        try {
            const response = await fetchDownloadLink(link, cookies);

            if (response.success && response.data) {
                // Check if server wants browser to get download link
                if ('needsBrowserDownload' in response && response.needsBrowserDownload) {
                    console.log('Server requested browser-based download');

                    // Type guard: needsBrowserDownload only comes with FileMetadata
                    const fileData = response.data as FileMetadata;

                    if (!fileData.surl || !fileData.fs_id) {
                        setError('Missing required data for browser download');
                        return;
                    }

                    try {
                        // Browser makes download request directly to Terabox
                        const downloadLink = await getDownloadLinkFromBrowser(
                            fileData.surl,
                            fileData.fs_id,
                            cookies,
                            response.apiDomain || 'www.terabox.app'
                        );

                        // Success! Got download link from browser
                        setFileData({
                            ...fileData,
                            download_link: downloadLink
                        });
                        setIsFolder(false);
                        setRequiresVerification(false);

                        console.log('✅ Browser successfully got download link!');
                    } catch (browserError) {
                        console.error('Browser download failed:', browserError);

                        // Browser request also failed - show file info with manual download
                        setFileData(fileData);
                        setIsFolder(false);
                        setRequiresVerification(true);
                        setShareLink(`https://${response.apiDomain || 'www.terabox.app'}/sharing/link?surl=${fileData.surl}`);
                        setVerificationMessage('Could not get download link automatically. Please download manually from Terabox.');
                        setShowCaptchaModal(true);
                    }
                } else {
                    // Normal flow (server got download link or it's a folder)
                    setFileData(response.data);
                    // Check if it's a folder by checking for 'files' property
                    setIsFolder('files' in response.data);

                    // Handle verification requirement
                    if ('requiresVerification' in response && response.requiresVerification) {
                        setRequiresVerification(true);
                        setShareLink(response.shareLink || null);
                        setVerificationMessage(response.message || null);
                        setShowCaptchaModal(true);
                    }
                }
            } else {
                setError(response.error || 'Failed to fetch download link');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCaptchaRetry = async (freshCookies: string) => {
        if (!currentLink) return;

        setShowCaptchaModal(false);
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetchDownloadLink(currentLink, freshCookies);

            if (response.success && response.data) {
                setFileData(response.data);
                setIsFolder('files' in response.data);

                if ('requiresVerification' in response && response.requiresVerification) {
                    setRequiresVerification(true);
                    setShareLink(response.shareLink || null);
                    setVerificationMessage(response.message || null);
                    setShowCaptchaModal(true);
                    setError('Verification still required. Please make sure you solved the CAPTCHA and copied fresh cookies.');
                } else {
                    setRequiresVerification(false);
                }
            } else {
                setError(response.error || 'Failed to fetch download link');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setFileData(null);
        setError(null);
        setIsFolder(false);
        setRequiresVerification(false);
        setShareLink(null);
        setVerificationMessage(null);
        setShowCaptchaModal(false);
        setCurrentLink('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 transition-colors duration-500">
            <ThemeToggle />

            {/* Background decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-pulse-slow"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
            </div>

            {/* Main content */}
            <div className="relative z-10 container mx-auto px-4 py-12">
                {/* Header */}
                <header className="text-center mb-12 animate-fade-in">
                    <h1 className="text-5xl md:text-6xl font-bold mb-4 gradient-text">
                        Terabox Downloader
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Download files from Terabox with ease. Just paste your share link and cookie to get started.
                    </p>
                </header>

                {/* Main content area */}
                <div className="flex flex-col items-center gap-8">
                    {!fileData ? (
                        <>
                            <CookieInstructions />
                            <DownloadForm onSubmit={handleSubmit} isLoading={isLoading} />
                        </>
                    ) : (
                        <>
                            <FileDisplay
                                data={fileData}
                                isFolder={isFolder}
                                requiresVerification={requiresVerification}
                                shareLink={shareLink}
                                verificationMessage={verificationMessage}
                            />
                            <button
                                onClick={handleReset}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span>Download Another File</span>
                            </button>
                        </>
                    )}

                    {/* Error display */}
                    {error && (
                        <div className="card w-full max-w-2xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 animate-slide-up">
                            <div className="flex items-start gap-3">
                                <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h3 className="font-bold text-red-800 dark:text-red-200 mb-1">Error</h3>
                                    <p className="text-red-700 dark:text-red-300">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* CAPTCHA Modal */}
                {showCaptchaModal && shareLink && (
                    <CaptchaModal
                        shareLink={shareLink}
                        onRetry={handleCaptchaRetry}
                        onCancel={() => setShowCaptchaModal(false)}
                    />
                )}

                {/* Footer */}
                <footer className="mt-20 text-center text-gray-600 dark:text-gray-400">
                    <div className="glass inline-block px-6 py-4 rounded-lg">
                        <p className="text-sm">
                            Made with ❤️ for easy Terabox downloads
                        </p>
                        <p className="text-xs mt-2">
                            This tool uses your own cookies and doesn't store any data
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default App;
