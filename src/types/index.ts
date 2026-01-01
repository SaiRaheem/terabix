// TypeScript type definitions for the Terabox Downloader application

export interface DownloadRequest {
    link: string;
    cookies: string;
}

export interface FileMetadata {
    file_name: string;
    file_size: string; // Human-readable size (e.g., "1.5 GB")
    size_bytes: number;
    thumbnail?: string;
    download_link: string;
    proxy_url?: string;
    fs_id?: string;
    isdir?: number;
}

export interface FolderContent {
    files: FileMetadata[];
    folder_name: string;
}

export interface ApiResponse {
    success: boolean;
    data?: FileMetadata | FolderContent;
    error?: string;
    message?: string;
    requiresVerification?: boolean;
    shareLink?: string;
}

export interface TeraboxInitResponse {
    bdstoken?: string;
    logid?: string;
    uk?: string;
    shareid?: string;
    share_uk?: string;
    primaryid?: string;
    rootid?: string;
    errno?: number;
}

export interface TeraboxFileListResponse {
    errno: number;
    list?: Array<{
        fs_id: number;
        server_filename: string;
        size: number;
        thumbs?: {
            url3?: string;
            url2?: string;
            url1?: string;
        };
        isdir: number;
        path: string;
    }>;
}

export interface TeraboxDownloadResponse {
    errno: number;
    dlink?: string;
    list?: Array<{
        dlink: string;
        fs_id: number;
    }>;
}

export interface ThemeContextType {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}
