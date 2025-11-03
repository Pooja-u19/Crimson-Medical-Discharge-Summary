import React, { useState, useEffect } from 'react';
import { indexedDBManager } from '@/lib/indexeddb';
import { Upload, FileText, Check, X, Trash2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

interface FileWithStatus {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  file: File;
}

interface MultiFileUploadProps {
  onUploadComplete?: (requestId: string, patientId: string) => void;
}

const MultiFileUpload: React.FC<MultiFileUploadProps> = ({ onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithStatus[]>([]);
  const [patientId, setPatientId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_AWS_API_BASE_URL || 'https://j0uu01wdqa.execute-api.us-east-1.amazonaws.com/dev/api/v1';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles: FileWithStatus[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending' as const,
      progress: 0,
      file: file
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const newFiles: FileWithStatus[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending' as const,
      progress: 0,
      file: file
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const updateFileStatus = (id: string, status: FileWithStatus['status'], progress = 0) => {
    setSelectedFiles(prev => prev.map(file => 
      file.id === id ? { ...file, status, progress } : file
    ));
  };

  const uploadFileToS3 = async (file: FileWithStatus, presignedUrl: string) => {
    try {
      updateFileStatus(file.id, 'uploading', 0);
      
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file.file,
      });

      if (response.ok) {
        updateFileStatus(file.id, 'processing', 100);
      } else {
        updateFileStatus(file.id, 'error');
        throw new Error(`Upload failed: ${response.status}`);
      }
    } catch (error) {
      updateFileStatus(file.id, 'error');
      throw error;
    }
  };

  const pollRequestStatus = async (requestId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/document/request/${requestId}`);
      const data = await response.json();
      
      if (data.data?.documents) {
        const documents = data.data.documents;
        let allCompleted = true;
        let hasAnyCompleted = false;
        
        documents.forEach((doc: any, index: number) => {
          const file = selectedFiles[index];
          if (file) {
            switch (doc.documentStatus) {
              case 0: // PENDING
                updateFileStatus(file.id, 'processing');
                allCompleted = false;
                break;
              case 1: // COMPLETED
                updateFileStatus(file.id, 'completed');
                hasAnyCompleted = true;
                break;
              case 3: // ERROR
                updateFileStatus(file.id, 'error');
                break;
              default:
                allCompleted = false;
            }
          }
        });
        
        return { allCompleted, hasAnyCompleted };
      }
      return { allCompleted: false, hasAnyCompleted: false };
    } catch (error) {
      console.error('Status polling error:', error);
      return { allCompleted: false, hasAnyCompleted: false };
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      // Auto-generate patient ID if not provided
      const finalPatientId = patientId.trim() || `patient-${Date.now()}`;
      
      // Prepare files for upload request
      const filesToUpload = selectedFiles.map(file => ({
        contentType: file.type,
        size: file.size,
        documentType: 'other_documents'
      }));

      // Create upload request
      const response = await fetch(`${API_BASE_URL}/document/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: finalPatientId,
          files: filesToUpload
        })
      });

      const data = await response.json();
      
      if (data.data?.presignedUrls) {
        const { requestId: newRequestId, presignedUrls } = data.data;
        setRequestId(newRequestId);

        // Upload each file (if presigned URL is provided)
        for (let i = 0; i < presignedUrls.length; i++) {
          const file = selectedFiles[i];
          const { presignedUrl } = presignedUrls[i];
          
          if (file) {
            if (presignedUrl) {
              await uploadFileToS3(file, presignedUrl);
            } else {
              // Skip upload but mark as processing
              updateFileStatus(file.id, 'processing', 100);
            }
            
            // Save to IndexedDB (non-blocking)
            try {
              await indexedDBManager.saveRequest({
                requestId: newRequestId,
                fileName: file.name,
                status: 'processing',
                createdAt: new Date().toISOString(),
              } as any);
            } catch (error) {
              console.warn('Failed to save to IndexedDB:', error);
              // Continue with upload process even if IndexedDB fails
            }
          }
        }

        // Immediately call onUploadComplete after successful upload
        onUploadComplete?.(newRequestId, finalPatientId);
        
        // Start polling for completion status updates
        const pollInterval = setInterval(async () => {
          const { allCompleted, hasAnyCompleted } = await pollRequestStatus(newRequestId);
          if (allCompleted || hasAnyCompleted) {
            clearInterval(pollInterval);
            setIsUploading(false);
            // Clear files after successful completion
            if (allCompleted) {
              setSelectedFiles([]);
              setPatientId('');
              setRequestId(null);
            }
            // Trigger callback when processing is complete
            if (allCompleted) {
              onUploadComplete?.(newRequestId, finalPatientId);
            }
          }
        }, 5000);

        // Stop polling after 10 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsUploading(false);
        }, 600000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: FileWithStatus['status']) => {
    switch (status) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />;
      case 'processing':
        return <div className="animate-pulse rounded-full h-4 w-4 bg-yellow-500" />;
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusText = (status: FileWithStatus['status']) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing...';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  };

  const getStatusColor = (status: FileWithStatus['status']) => {
    switch (status) {
      case 'uploading': return 'text-blue-600';
      case 'processing': return 'text-yellow-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Medical Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Patient ID Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Patient ID (Optional)</label>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="Enter patient ID (auto-generated if empty)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to auto-generate a unique patient ID
          </p>
        </div>

        {/* File Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="text-lg font-medium text-gray-700 mb-2">
            Drop files here or click to browse
          </div>
          <div className="text-sm text-gray-500 mb-2">
            Supports PDF, Images (JPG, PNG, TIFF), Word documents, and Text files
          </div>
          <div className="text-xs text-gray-400 mb-4">
            Maximum file size: 10MB per file
          </div>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif,.txt,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={isUploading}
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:opacity-50"
          >
            Select Files
          </label>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-3">
              Selected Files ({selectedFiles.length}):
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {getStatusIcon(file.status)}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                      </div>
                      <div className={`text-xs ${getStatusColor(file.status)}`}>
                        {getStatusText(file.status)}
                      </div>
                      {file.status === 'uploading' && (
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                          <div 
                            className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {file.status === 'pending' && !isUploading && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      title="Remove file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading}
          className="w-full"
        >
          {isUploading 
            ? `Processing ${selectedFiles.filter(f => f.status === 'processing' || f.status === 'uploading').length} files...`
            : `Analyze ${selectedFiles.length} Document${selectedFiles.length !== 1 ? 's' : ''}`
          }
        </Button>

        {/* Status Messages */}
        {requestId && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Request ID: {requestId} - Documents are being processed. This may take a few minutes.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiFileUpload;