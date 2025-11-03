import { useState, useEffect, useCallback } from "react";
import { Upload, RefreshCw, FileText, Eye, Loader2, X, Trash2, Check, AlertCircle } from "lucide-react";

interface DocumentRequest {
  requestId: string;
  fileName: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  summary?: string;
}

const API_BASE_URL = import.meta.env.VITE_AWS_API_BASE_URL || 'https://vh7yj2sb18.execute-api.us-east-1.amazonaws.com/dev/api/v1';

const EnhancedDocumentAnalysis = () => {
  const [documents, setDocuments] = useState<DocumentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentRequest | null>(null);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<{[key: string]: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'}>({});
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [dragActive, setDragActive] = useState(false);

  const loadDocuments = async () => {
    const stored = localStorage.getItem('documents');
    if (stored) {
      setDocuments(JSON.parse(stored));
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    
    files.forEach(file => {
      if (file.size > maxFileSize) {
        alert(`${file.name} exceeds the maximum file size of 10MB`);
      } else {
        validFiles.push(file);
      }
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Initialize file statuses
    const newStatuses: {[key: string]: 'pending'} = {};
    validFiles.forEach(file => {
      newStatuses[file.name] = 'pending';
    });
    setFileStatuses(prev => ({ ...prev, ...newStatuses }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFiles(Array.from(event.target.files));
    }
  };

  const removeFile = (index: number) => {
    const fileToRemove = selectedFiles[index];
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    
    if (fileToRemove) {
      setFileStatuses(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[fileToRemove.name];
        return newStatuses;
      });
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileToRemove.name];
        return newProgress;
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select at least one document to upload");
      return;
    }

    try {
      setIsLoading(true);

      for (const file of selectedFiles) {
        // Update status to uploading
        setFileStatuses(prev => ({ ...prev, [file.name]: 'uploading' }));
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        // Step 1: Create request and get upload URL
        const response = await fetch(`${API_BASE_URL}/document/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name }),
        });

        if (!response.ok) throw new Error('Failed to create upload request');

        const { requestId, uploadUrl } = await response.json();

        // Step 2: Upload file to S3
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'application/pdf' },
        });

        if (!uploadResponse.ok) throw new Error('Failed to upload file');

        // Update progress and status
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        setFileStatuses(prev => ({ ...prev, [file.name]: 'processing' }));

        // Step 3: Save to local storage and update UI
        const newDoc: DocumentRequest = {
          requestId,
          fileName: file.name,
          status: 'processing',
          createdAt: new Date().toISOString(),
        };

        const updatedDocs = [...documents, newDoc];
        setDocuments(updatedDocs);
        localStorage.setItem('documents', JSON.stringify(updatedDocs));

        // Start polling for updates
        pollForUpdates(requestId, file.name);
      }

      alert(`${selectedFiles.length} document(s) uploaded successfully! Processing started.`);
      setSelectedFiles([]);
      setFileStatuses({});
      setUploadProgress({});

    } catch (error: any) {
      console.error('Error uploading documents:', error);
      alert(error.message || "Failed to upload documents");
    } finally {
      setIsLoading(false);
    }
  };

  const pollForUpdates = async (requestId: string, fileName: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/document/request/${requestId}`);
        if (response.ok) {
          const updatedDoc = await response.json();
          
          // Update documents list
          setDocuments(prev => prev.map(doc => 
            doc.requestId === requestId ? { ...doc, ...updatedDoc } : doc
          ));

          // Update file status
          if (updatedDoc.status === 'completed') {
            setFileStatuses(prev => ({ ...prev, [fileName]: 'completed' }));
            alert(`Processing complete for ${fileName}`);
            return;
          } else if (updatedDoc.status === 'failed') {
            setFileStatuses(prev => ({ ...prev, [fileName]: 'error' }));
            alert(`Processing failed for ${fileName}`);
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        }
      } catch (error) {
        console.warn('Polling error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        }
      }
    };

    setTimeout(poll, 5000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>;
      case 'processing':
        return <div className="animate-pulse rounded-full h-4 w-4 bg-yellow-500"></div>;
      case 'completed':
        return <Check size={16} className="text-green-500" />;
      case 'error':
        return <X size={16} className="text-red-500" />;
      default:
        return <FileText size={16} className="text-blue-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing...';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return 'text-blue-600';
      case 'processing': return 'text-yellow-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      pending: "bg-gray-100 text-gray-800",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Discharge Summary</h1>
                <p className="text-gray-600">Analyze Documents</p>
              </div>
            </div>
            <button
              onClick={loadDocuments}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Upload Documents (Multiple files supported)
              </label>
              
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="text-lg font-medium text-gray-700 mb-2">
                  Drop files here or click to browse
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  Supports PDF, Images (JPG, PNG, TIFF), Word documents, and text files
                </div>
                <div className="text-xs text-gray-400">
                  Maximum file size: 10MB per file
                </div>
                
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif,.txt,.doc,.docx"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or use traditional file picker (supports multiple selection):
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif,.txt,.doc,.docx"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm font-semibold text-gray-700 mb-3">
                    Selected Files ({selectedFiles.length}):
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedFiles.map((file, index) => {
                      const status = fileStatuses[file.name] || 'pending';
                      const progress = uploadProgress[file.name] || 0;
                      
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            {getStatusIcon(status)}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {file.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                              </div>
                              <div className={`text-xs ${getStatusColor(status)}`}>
                                {getStatusText(status)}
                              </div>
                              {status === 'uploading' && (
                                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                  <div 
                                    className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          </div>
                          {status === 'pending' && (
                            <button
                              onClick={() => removeFile(index)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Remove file"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isLoading || Object.values(fileStatuses).some(status => status === 'uploading')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {(() => {
                    const processingCount = Object.values(fileStatuses).filter(status => 
                      status === 'uploading' || status === 'processing'
                    ).length;
                    
                    if (processingCount > 0) {
                      return `Processing ${processingCount} Document${processingCount > 1 ? 's' : ''}...`;
                    } else {
                      return "Processing...";
                    }
                  })()}
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  {selectedFiles.length > 0 
                    ? `Analyze ${selectedFiles.length} Document${selectedFiles.length > 1 ? 's' : ''}`
                    : "Analyze Documents"
                  }
                </>
              )}
            </button>
          </div>

          {/* Documents Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Document History</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Identifier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                        No documents yet. Upload a document to get started.
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc.requestId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {doc.requestId}
                              </div>
                              <div className="text-xs text-gray-500">
                                {doc.fileName} • {new Date(doc.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {getStatusBadge(doc.status)}
                            {doc.status === 'completed' && doc.summary ? (
                              <button
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setShowSummaryDialog(true);
                                }}
                                className="inline-flex items-center px-3 py-1 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100"
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                View Summary
                              </button>
                            ) : doc.status === 'processing' ? (
                              <span className="inline-flex items-center text-sm text-gray-500">
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                Processing
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Dialog */}
      {showSummaryDialog && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Document Summary</h2>
                <button
                  onClick={() => setShowSummaryDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600">{selectedDocument.fileName}</p>
            </div>
            <div className="p-6">
              {selectedDocument.summary ? (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                    {selectedDocument.summary}
                  </pre>
                </div>
              ) : (
                <p className="text-gray-500">No summary available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDocumentAnalysis;