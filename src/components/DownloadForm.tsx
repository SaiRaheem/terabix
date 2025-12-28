import React, { useState } from 'react';

interface DownloadFormProps {
    onSubmit: (link: string, cookies: string) => void;
    isLoading: boolean;
}

const DownloadForm: React.FC<DownloadFormProps> = ({ onSubmit, isLoading }) => {
    const [link, setLink] = useState('');
    const [cookies, setCookies] = useState('');
    const [errors, setErrors] = useState({ link: '', cookies: '' });

    const validateForm = (): boolean => {
        const newErrors = { link: '', cookies: '' };
        let isValid = true;

        // Validate link
        if (!link.trim()) {
            newErrors.link = 'Terabox link is required';
            isValid = false;
        } else if (!link.includes('terabox.com/s/') && !link.includes('1024terabox.com/s/')) {
            newErrors.link = 'Invalid Terabox share link format';
            isValid = false;
        }

        // Validate cookies
        if (!cookies.trim()) {
            newErrors.cookies = 'Cookie is required';
            isValid = false;
        } else if (!cookies.includes('ndus=')) {
            newErrors.cookies = 'Cookie must contain "ndus=" value';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(link, cookies);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-2xl">
            {/* Link Input */}
            <div className="space-y-2">
                <label htmlFor="link" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Terabox Share Link
                </label>
                <input
                    id="link"
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://www.terabox.com/s/1example"
                    className="input-field"
                    disabled={isLoading}
                />
                {errors.link && (
                    <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.link}</p>
                )}
            </div>

            {/* Cookie Input */}
            <div className="space-y-2">
                <label htmlFor="cookies" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Cookie (ndus value)
                </label>
                <textarea
                    id="cookies"
                    value={cookies}
                    onChange={(e) => setCookies(e.target.value)}
                    placeholder="ndus=YOUR_COOKIE_VALUE_HERE"
                    rows={3}
                    className="input-field resize-none"
                    disabled={isLoading}
                />
                {errors.cookies && (
                    <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.cookies}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Paste your entire cookie string or just the ndus value
                </p>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <div className="spinner w-5 h-5 border-2"></div>
                        <span>Processing...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        <span>Get Download Link</span>
                    </>
                )}
            </button>
        </form>
    );
};

export default DownloadForm;
