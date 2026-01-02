import React from 'react';

interface VideoPlayerProps {
    streamingUrl: string;
    fileName: string;
    thumbnail?: string | null;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamingUrl, fileName, thumbnail }) => {
    return (
        <div className="card animate-fade-in">
            <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    🎥 Stream Video
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{fileName}</p>
            </div>

            <div className="relative w-full rounded-lg overflow-hidden bg-black shadow-2xl">
                <video
                    controls
                    className="w-full"
                    poster={thumbnail || undefined}
                    preload="metadata"
                >
                    <source src={streamingUrl} type="video/mp4" />
                    <source src={streamingUrl} type="video/webm" />
                    <source src={streamingUrl} type="video/ogg" />
                    Your browser does not support the video tag.
                </video>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                            Streaming Tips
                        </h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                            <li>• Click play to start streaming</li>
                            <li>• Right-click → "Save video as" to download</li>
                            <li>• Use fullscreen for better viewing</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex gap-3">
                <a
                    href={streamingUrl}
                    download={fileName}
                    className="btn-primary flex-1 text-center"
                >
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Video
                </a>
                <button
                    onClick={() => window.open(streamingUrl, '_blank')}
                    className="btn-secondary flex-1"
                >
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open in New Tab
                </button>
            </div>
        </div>
    );
};

export default VideoPlayer;
