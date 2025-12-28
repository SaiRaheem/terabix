// API client utilities for frontend

import type { DownloadRequest, ApiResponse } from '../types';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5173';

export async function fetchDownloadLink(
    link: string,
    cookies: string
): Promise<ApiResponse> {
    try {
        const response = await fetch(`${API_BASE}/api/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ link, cookies } as DownloadRequest),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch download link');
        }

        return data;
    } catch (error) {
        throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
}

export function getProxyUrl(downloadLink: string, fileName: string): string {
    return `${API_BASE}/api/proxy?url=${encodeURIComponent(downloadLink)}&file_name=${encodeURIComponent(fileName)}`;
}
