// AWS API Client for Document Analysis - Updated for final-summary stack
const API_BASE_URL = import.meta.env.VITE_AWS_API_BASE_URL || 'https://j0uu01wdqa.execute-api.us-east-1.amazonaws.com/dev/api/v1';
const API_KEY = import.meta.env.VITE_AWS_API_KEY; // No default API key needed for this deployment

export interface DocumentRequest {
  requestId: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt?: string;
  summary?: string;
  ocrText?: string;
  pages?: string[];
  documentS3Path?: string;
}

export interface CreateRequestResponse {
  requestId: string;
  uploadUrl: string;
  fileName?: string;
}

class AWSApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.apiKey = API_KEY;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Only add API key if it exists
    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        mode: 'cors',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to API. Please check CORS settings and network connection.');
      }
      throw error;
    }
  }

  async createRequest(fileName: string): Promise<CreateRequestResponse> {
    const payload = {
      patientId: `patient-${Date.now()}`,
      files: [{
        documentType: "other_documents",
        contentType: "application/pdf",
        size: 1024000 // Default size, will be updated when file is selected
      }]
    };
    
    const response = await this.request<any>('/document/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    return {
      requestId: response.data.requestId,
      uploadUrl: response.data.presignedUrls[0].presignedUrl,
      fileName: fileName // Store the original filename
    };
  }

  async uploadDocument(uploadUrl: string, file: File): Promise<void> {
    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/pdf',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to upload file. Please check your connection.');
      }
      throw error;
    }
  }

  async getRequest(requestId: string): Promise<DocumentRequest> {
    const response = await this.request<any>(`/document/request/${requestId}`);
    
    // Transform API response to match DocumentRequest interface
    const request = response.data.request;
    const documents = response.data.documents || [];
    
    // Get summary from documents array if available
    const document = documents.length > 0 ? documents[0] : null;
    let summary = document?.summary || document?.analysisSummary;
    
    // Debug log the raw summary
    console.log('Raw summary from API:', summary);
    
    // Handle different summary formats - keep as JSON for DocumentViewer
    if (summary && typeof summary === 'object') {
      // Keep the summary as JSON string for proper parsing in DocumentViewer
      summary = JSON.stringify({ data: summary });
    } else if (summary && typeof summary === 'string') {
      // Try to parse if it's already a JSON string
      try {
        const parsed = JSON.parse(summary);
        if (parsed.data) {
          summary = JSON.stringify(parsed);
        } else {
          summary = JSON.stringify({ data: parsed });
        }
      } catch {
        // If not JSON, wrap in data object
        summary = JSON.stringify({ data: { rawText: summary } });
      }
    }
    
    // Map document status to our status format
    let status = 'processing';
    if (document) {
      switch (document.documentStatus) {
        case 0: status = 'processing'; break;
        case 1: status = 'completed'; break;
        case 2: case 3: status = 'failed'; break;
        default: status = 'processing';
      }
    } else if (request.status) {
      status = request.status.toLowerCase();
    }
    
    // Extract pages from document if available
    const pages = document?.pages || [];
    
    return {
      requestId: request.requestId || requestId,
      fileName: 'document.pdf', // Will be updated from IndexedDB with actual filename
      status: status as any,
      createdAt: request.createdAt || new Date().toISOString(),
      updatedAt: request.updatedAt || document?.updatedAt,
      summary: summary,
      ocrText: document?.ocrText,
      pages: pages,
      documentS3Path: document?.documentS3Path
    };
  }

  async listRequests(): Promise<DocumentRequest[]> {
    // For now, we'll use the getRequest method since the API doesn't have a list endpoint
    // This will be handled by the component to manage multiple requests locally
    throw new Error('List requests not implemented - using local storage');
  }

  async initiateOCR(requestId: string): Promise<void> {
    // OCR is automatically initiated when file is uploaded to S3 via EventBridge
    console.log('OCR will be automatically initiated for request:', requestId);
  }

  async generateSummary(requestId: string): Promise<void> {
    // Summary generation is automatically triggered after OCR completion
    console.log('Summary generation will be automatically triggered for request:', requestId);
  }
}

export const awsApiClient = new AWSApiClient();
