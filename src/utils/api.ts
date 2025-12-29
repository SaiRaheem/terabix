// API client utilities for frontend

import type { DownloadRequest, ApiResponse } from '../types';

const API_BASE = (import.meta as any).env?.PROD ? '' : 'http://localhost:3000';

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

        // Check if the response is JSON
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        if (!isJson) {
            // If not JSON, it's likely an HTML error page from Vercel
            const text = await response.text();
            console.error('Non-JSON response received:', text.substring(0, 200));

            // Try to extract meaningful error from HTML if possible
            if (response.status === 404) {
                throw new Error('API endpoint not found. Please check your Vercel deployment configuration.');
            } else if (response.status === 500) {
                throw new Error('Server error occurred. Please check your API logs on Vercel.');
            } else {
                throw new Error(`Server returned an error (${response.status}). Expected JSON but received HTML.`);
            }
        }

        // Parse JSON response
        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            console.error('JSON parsing error:', parseError);
            throw new Error('Failed to parse server response. The API may be returning invalid data.');
        }

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
