import React from 'react';
import type { FileMetadata, FolderContent } from '../types';
import VideoPlayer from './VideoPlayer';


interface FileDisplayProps {
    data: FileMetadata | FolderContent;
    isFolder: boolean;
    requiresVerification?: boolean;
    shareLink?: string | null;
    verificationMessage?: string | null;
}

const FileDisplay: React.FC<FileDisplayProps> = ({
    data,
    isFolder,
    requiresVerification,
    shareLink,
    verificationMessage
}) => {
    // Check if it's a video file with streaming URL
    const singleFileData = data as FileMetadata;
    const isVideo = singleFileData.category === 1; // category 1 = video
    const hasStreamingUrl = singleFileData.streaming_url && singleFileData.streaming_url.length > 0;

    // If it's a video with streaming URL, show video player
    if (!isFolder && isVideo && hasStreamingUrl) {
        return (
            <div className="space-y-6 animate-fade-in">
                <VideoPlayer
                    streamingUrl={singleFileData.streaming_url!}
                    fileName={singleFileData.file_name}
                    thumbnail={singleFileData.thumbnail}
                />

                {/* Show file info below player */}
                <div className="card">
                    <div className="flex items-center gap-4 mb-4">
                        {singleFileData.thumbnail && (
                            <img
                                src={singleFileData.thumbnail}
                                alt={singleFileData.file_name}
                                className="w-20 h-20 object-cover rounded-lg"
                            />
                        )}
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                                {singleFileData.file_name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Size: {singleFileData.file_size}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Original file display for non-streaming files
    if (isFolder) {
        const folderData = data as FolderContent;
        return (
            <div className="card w-full max-w-4xl animate-slide-up">
                <h2 className="text-2xl font-bold mb-4 gradient-text">
                    📁 {folderData.folder_name}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    This share contains {folderData.files.length} file(s)
                </p>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {folderData.files.map((file, index) => (
                        <div
                            key={index}
                            className="glass p-4 rounded-lg flex items-center justify-between hover:shadow-lg transition-all duration-200"
                        >
                            <div className="flex items-center gap-4 flex-1">
                                {file.thumbnail && (
                                    <img
                                        src={file.thumbnail}
                                        alt={file.file_name}
                                        className="w-16 h-16 object-cover rounded-lg"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 dark:text-white truncate">
                                        {file.file_name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {file.file_size}
                                    </p>
                                </div>
                            </div>
                            {file.isdir !== 1 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                                    Individual file downloads coming soon
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Single file display
    const fileInfo = data as FileMetadata;
    return (
        <div className="card w-full max-w-2xl animate-slide-up">
            {/* Thumbnail */}
            {fileInfo.thumbnail && (
                <div className="mb-6 rounded-xl overflow-hidden">
                    <img
                        src={fileData.thumbnail}
                        alt={fileData.file_name}
                        className="w-full h-64 object-cover"
                    />
                </div>
            )}

            {/* File Info */}
            <div className="space-y-4 mb-6">
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        File Name
                    </h3>
                    <p className="text-lg font-bold text-gray-800 dark:text-white break-all">
                        {fileData.file_name}
                    </p>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        File Size
                    </h3>
                    <p className="text-lg font-semibold gradient-text">
                        {fileData.file_size}
                    </p>
                </div>
            </div>

            {/* Download Buttons */}
            <div className="space-y-3">
                {requiresVerification ? (
                    <>
                        {/* Verification Required Message */}
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <div className="flex items-start gap-3">
                                <svg className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-1">Manual Download Required</h4>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                        {verificationMessage || 'Terabox requires manual verification for this file.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Manual Download Button */}
                        {shareLink && (
                            <a
                                href={shareLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary w-full flex items-center justify-center gap-2 no-underline"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                <span>Open in Terabox to Download</span>
                            </a>
                        )}
                    </>
                ) : (
                    <>
                        {fileInfo.download_link ? (
                            <a
                                href={fileInfo.download_link || shareLink || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download File
                            </a>
                        ) : (
                            <a
                                href={shareLink || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary w-full flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Open in Terabox to Download
                            </a>
                        )}
                    </>
                )}
            </div>

            {/* Info Note */}
            <div className="mt-6 p-4 glass rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                    💡 <strong>Tip:</strong> {requiresVerification ? 'Click the button above to download from Terabox directly.' : 'Use "Direct Download" for faster speeds. Use "Download via Proxy" if direct download doesn\'t work.'}
                </p>
            </div>
        </div>
    );
};

export default FileDisplay;
