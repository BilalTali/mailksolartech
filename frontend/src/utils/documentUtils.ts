import api from '@/services/axios';

/**
 * Fetches a protected file using the existing axios instance (with auth headers)
 * and opens it in a new tab or triggers a download.
 */
export const openAuthenticatedFile = async (url: string, filename?: string) => {
    try {
        const response = await api.get(url, {
            responseType: 'blob',
        });
        const blob = new Blob([response.data], { type: (response.headers['content-type'] as string) || 'application/octet-stream' });
        const blobUrl = window.URL.createObjectURL(blob);

        // Open in new tab
        const win = window.open(blobUrl, '_blank');
        if (win) {
            win.focus();
        } else {
            // Fallback: download if popup blocked
            const link = document.createElement('a');
            link.href = blobUrl;
            if (filename) link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Clean up memory after a short delay to allow the browser to open/process the blob
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('Failed to download document:', error);
        }
        throw error;
    }
};
