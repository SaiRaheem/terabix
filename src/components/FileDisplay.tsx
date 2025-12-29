
import type { FileMetadata, FolderContent } from '../types';

interface FileDisplayProps {
    data: FileMetadata | FolderContent;
    isFolder: boolean;
}

const FileDisplay: React.FC<FileDisplayProps> = ({ data, isFolder }) => {
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

    const fileData = data as FileMetadata;
    return (
        <div className="card w-full max-w-2xl animate-slide-up">
            {/* Thumbnail */}
            {fileData.thumbnail && (
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
                <a
                    href={fileData.download_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full flex items-center justify-center gap-2 no-underline"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Direct Download</span>
                </a>

                {fileData.proxy_url && (
                    <a
                        href={fileData.proxy_url}
                        className="btn-secondary w-full flex items-center justify-center gap-2 no-underline"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Download via Proxy</span>
                    </a>
                )}
            </div>

            {/* Info Note */}
            <div className="mt-6 p-4 glass rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                    💡 <strong>Tip:</strong> Use "Direct Download" for faster speeds. Use "Download via Proxy" if direct download doesn't work.
                </p>
            </div>
        </div>
    );
};

export default FileDisplay;
