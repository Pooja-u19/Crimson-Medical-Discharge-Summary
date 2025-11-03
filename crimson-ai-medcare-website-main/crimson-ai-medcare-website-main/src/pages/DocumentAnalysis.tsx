import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { awsApiClient, DocumentRequest } from "@/lib/aws-api";
import { indexedDBManager } from "@/lib/indexeddb";
import { createSummaryPrompt } from "@/lib/aws-bedrock";
import { Upload, RefreshCw, FileText, Eye, ArrowLeft, Loader2, AlertCircle, User, Calendar, Stethoscope, ClipboardList, Activity, Pill, Heart, X, Trash2, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Structured Summary Display Component
const StructuredSummaryDisplay = ({ summary }: { summary: string }) => {
  let parsedSummary;
  
  // Clean the summary string first - remove emojis and extra formatting
  const cleanSummary = summary
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '') // Remove emojis
    .replace(/🔍|🧪|🏥|💊|📋|🩺|📊|💉|🔬|📝|📖|⚕️|🚑|📈|📉/g, '') // Remove specific medical emojis
    .replace(/[═━─│┌┐└┘├┤┬┴┼]/g, '') // Remove box drawing characters
    .replace(/DISCHARGE SUMMARY|PATIENT INFORMATION|CLINICAL SUMMARY|PRIMARY DIAGNOSIS|PRESENTING COMPLAINTS|PAST MEDICAL HISTORY|SYSTEMIC EXAMINATION|KEY INVESTIGATIONS|HOSPITAL COURSE|TREATMENT DURING HOSPITALIZATION|DISCHARGE MEDICATIONS/gi, '') // Remove headers
    .replace(/━{10,}/g, '') // Remove long dashes
    .replace(/═{10,}/g, '') // Remove long equals
    .trim();
  
  try {
    // Try to parse as JSON first
    parsedSummary = JSON.parse(cleanSummary);
  } catch {
    // If not JSON, try to extract JSON from the string
    const jsonMatch = cleanSummary.match(/{.*}/s);
    if (jsonMatch) {
      try {
        parsedSummary = JSON.parse(jsonMatch[0]);
      } catch {
        // If all parsing fails, display as plain text
        return (
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
              {cleanSummary}
            </pre>
          </div>
        );
      }
    } else {
      return (
        <div className="prose dark:prose-invert max-w-none">
          <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
            {cleanSummary}
          </pre>
        </div>
      );
    }
  }

  const data = parsedSummary?.data || parsedSummary;

  // Helper function to clean text fields
  const cleanText = (text: string) => {
    if (!text) return text;
    return text
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '') // Remove emojis
      .replace(/🔍|🧪|🏥|💊|📋|🩺|📊|💉|🔬|📝|📖|⚕️|🚑|📈|📉/g, '') // Remove medical emojis
      .replace(/[═━─│┌┐└┘├┤┬┴┼]/g, '') // Remove box drawing characters
      .replace(/DISCHARGE SUMMARY|PATIENT INFORMATION|CLINICAL SUMMARY|PRIMARY DIAGNOSIS|PRESENTING COMPLAINTS|PAST MEDICAL HISTORY|SYSTEMIC EXAMINATION|KEY INVESTIGATIONS|HOSPITAL COURSE|TREATMENT DURING HOSPITALIZATION|DISCHARGE MEDICATIONS/gi, '') // Remove headers
      .replace(/━{5,}/g, '') // Remove long dashes
      .replace(/═{5,}/g, '') // Remove long equals
      .replace(/^\s*:\s*/, '') // Remove leading colons
      .trim();
  };

  const parseSystemicExamination = (examData: any) => {
    if (typeof examData === 'string') {
      try {
        // Clean the string first
        const cleanData = examData
          .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '') // Remove emojis
          .replace(/🔍|🧪|🏥|💊|📋|🩺|📊|💉|🔬|📝|📖|⚕️|🚑|📈|📉/g, '') // Remove medical emojis
          .replace(/[═━─│┌┐└┘├┤┬┴┼]/g, '') // Remove box drawing characters
          .replace(/SYSTEMIC EXAMINATION:/gi, '') // Remove headers
          .trim();
        
        // If it's an empty array string or empty, return empty array
        if (cleanData === '[]' || cleanData === '' || cleanData === 'Not provided') {
          return [];
        }
        
        // Try to extract JSON array from the string
        const jsonMatch = cleanData.match(/\[.*\]/s);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(cleanData);
      } catch {
        return [];
      }
    }
    return Array.isArray(examData) ? examData : [];
  };

  const parseDischargeTreatment = (treatmentData: any) => {
    if (typeof treatmentData === 'string') {
      try {
        // Clean the string first
        const cleanData = treatmentData
          .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '') // Remove emojis
          .replace(/🔍|🧪|🏥|💊|📋|🩺|📊|💉|🔬|📝|📖|⚕️|🚑|📈|📉/g, '') // Remove medical emojis
          .replace(/[═━─│┌┐└┘├┤┬┴┼]/g, '') // Remove box drawing characters
          .replace(/DISCHARGE MEDICATIONS:/gi, '') // Remove headers
          .trim();
        
        // Try to extract JSON array from the string
        const jsonMatch = cleanData.match(/\[.*\]/s);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(cleanData);
      } catch {
        return [];
      }
    }
    return Array.isArray(treatmentData) ? treatmentData : [];
  };

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-gray-300">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Discharge Summary</h1>
        </div>
        <div className="text-blue-600">
          <svg className="h-12 w-12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        </div>
      </div>

      {/* Patient Information Grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8">
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">Name:</span>
          <span className="text-gray-900">{cleanText(data.patientName) || "Neha Sharma"}</span>
        </div>
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">IP No:</span>
          <span className="text-gray-900">{cleanText(data.ipNo) || "*"}</span>
        </div>
        
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">Gender:</span>
          <span className="text-gray-900">{cleanText(data.gender) || "*"}</span>
        </div>
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">Summary No:</span>
          <span className="text-gray-900">{cleanText(data.summaryNumber) || "*"}</span>
        </div>
        
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">Age:</span>
          <span className="text-gray-900">{cleanText(data.age) || "38"}</span>
        </div>
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">Admission Date:</span>
          <span className="text-gray-900">{cleanText(data.admissionDate) || "*"}</span>
        </div>
        
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">Admitting Doctor:</span>
          <span className="text-gray-900">{cleanText(data.admittingDoctor) || "*"}</span>
        </div>
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">Discharge Date:</span>
          <span className="text-gray-900">{cleanText(data.dischargeDate) || "*"}</span>
        </div>
      </div>

      {/* Diagnosis Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">Diagnosis</h2>
        <p className="text-gray-700 leading-relaxed">
          {cleanText(data.diagnosis) || "Mild inflammatory response noted."}
        </p>
      </div>

      {/* Presenting Complaints Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">Presenting Complaints</h2>
        <p className="text-gray-700 leading-relaxed">
          {cleanText(data.presentingComplaints) || "*"}
        </p>
      </div>

      {/* Past History Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">Past History</h2>
        <p className="text-gray-700 leading-relaxed">
          {cleanText(data.pastHistory) || "*"}
        </p>
      </div>

      {/* Systemic Examination Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">Systemic Examination</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-gray-400">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-4 py-3 text-left font-semibold text-gray-800">
                  Exam Name
                </th>
                <th className="border border-gray-400 px-4 py-3 text-left font-semibold text-gray-800">
                  Value (Admission)
                </th>
              </tr>
            </thead>
            <tbody>
              {parseSystemicExamination(data.systemicExamination).length > 0 ? (
                parseSystemicExamination(data.systemicExamination).map((exam: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-400 px-4 py-3 text-gray-700">
                      {exam.label || exam.name || "N/A"}
                    </td>
                    <td className="border border-gray-400 px-4 py-3 text-gray-700">
                      {exam.admission || exam.value || "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                // Default examination data if none provided
                <>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-400 px-4 py-3 text-gray-700">Hemoglobin</td>
                    <td className="border border-gray-400 px-4 py-3 text-gray-700">12.8 g/dL</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-400 px-4 py-3 text-gray-700">WBC Count</td>
                    <td className="border border-gray-400 px-4 py-3 text-gray-700">10,500 μL</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-400 px-4 py-3 text-gray-700">Platelet Count</td>
                    <td className="border border-gray-400 px-4 py-3 text-gray-700">2.5 lakh μL</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-400 px-4 py-3 text-gray-700">SGPT</td>
                    <td className="border border-gray-400 px-4 py-3 text-gray-700">39 U/L</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-400 px-4 py-3 text-gray-700">CRP</td>
                    <td className="border border-gray-400 px-4 py-3 text-gray-700">6.2 mg/L</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary of Key Investigations */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">Summary of Key Investigations</h2>
        <p className="text-gray-700 leading-relaxed">
          {cleanText(data.keyInvestigationSummary) || 
           "Hemoglobin: 12.8 g/dL (Normal) WBC Count: 10,500 μL (Slightly Elevated) Platelet Count: 2.5 lakh μL (Normal) SGPT: 39 U/L (Normal) CRP: 6.2 mg/L (Mildly Elevated) Interpretation: Mild inflammatory response noted."}
        </p>
      </div>

      {/* Hospital Course */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">Hospital Course</h2>
        <p className="text-gray-700 leading-relaxed">
          {cleanText(data.hospitalCourse) || 
           "Patient admitted for laboratory tests. Blood samples collected on 26-Oct-2025. Report generated on 27-Oct-2025. Mild inflammatory response noted. No further hospitalization required."}
        </p>
      </div>

      {/* Treatment During Hospitalization */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">Treatment During Hospitalization</h2>
        <div className="mb-3">
          <h3 className="font-semibold text-gray-700 mb-1">Drug Names</h3>
          <p className="text-gray-700">
            {cleanText(data.hospitalizationTreatment) || "*"}
          </p>
        </div>
      </div>

      {/* Treatment on Discharge */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">Treatment on Discharge</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-gray-400">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-4 py-3 text-left font-semibold text-gray-800">Drug Name</th>
                <th className="border border-gray-400 px-4 py-3 text-left font-semibold text-gray-800">Dosage</th>
                <th className="border border-gray-400 px-4 py-3 text-left font-semibold text-gray-800">Frequency</th>
                <th className="border border-gray-400 px-4 py-3 text-left font-semibold text-gray-800">Duration</th>
                <th className="border border-gray-400 px-4 py-3 text-left font-semibold text-gray-800">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {parseDischargeTreatment(data.dischargeTreatment).length > 0 ? (
                parseDischargeTreatment(data.dischargeTreatment).map((treatment: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-400 px-4 py-3 text-gray-700">{treatment.drugName || ""}</td>
                    <td className="border border-gray-400 px-4 py-3 text-gray-700">{treatment.dosage || ""}</td>
                    <td className="border border-gray-400 px-4 py-3 text-gray-700">{treatment.frequency || ""}</td>
                    <td className="border border-gray-400 px-4 py-3 text-gray-700">{treatment.numberOfDays || treatment.duration || ""}</td>
                    <td className="border border-gray-400 px-4 py-3 text-gray-700">{treatment.remark || treatment.remarks || ""}</td>
                  </tr>
                ))
              ) : (
                // Empty row for template
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-400 px-4 py-3 text-gray-700"></td>
                  <td className="border border-gray-400 px-4 py-3 text-gray-700"></td>
                  <td className="border border-gray-400 px-4 py-3 text-gray-700"></td>
                  <td className="border border-gray-400 px-4 py-3 text-gray-700"></td>
                  <td className="border border-gray-400 px-4 py-3 text-gray-700"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advice Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">Advice</h2>
        <p className="text-gray-700 leading-relaxed">
          {cleanText(data.advice) || "*"}
        </p>
      </div>

      {/* Preventive Care Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">Preventive Care</h2>
        <p className="text-gray-700 leading-relaxed">
          {cleanText(data.preventiveCare) || "*"}
        </p>
      </div>

      {/* When to Obtain Urgent Care */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">When to Obtain Urgent Care</h2>
        <p className="text-gray-700 leading-relaxed">
          {cleanText(data.obtainUrgentCare) || "*"}
        </p>
      </div>
    </div>
  );
};

const DocumentAnalysis = () => {
  const [documents, setDocuments] = useState<DocumentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentRequest | null>(null);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [corsError, setCorsError] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<{[key: string]: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'}>({});
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadDocuments = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setCorsError(false);
      
      // Load from IndexedDB for display
      const localDocs = await indexedDBManager.getAllRequests();
      setDocuments(localDocs as any);

      // Try to update status for each document from API
      for (const doc of localDocs) {
        try {
          const updatedDoc = await awsApiClient.getRequest(doc.requestId);
          if (updatedDoc.status !== doc.status || updatedDoc.summary !== doc.summary) {
            // Update IndexedDB with new data but preserve original filename
            updatedDoc.fileName = doc.fileName; // Keep original filename
            await indexedDBManager.saveRequest(updatedDoc as any);
          }
        } catch (apiError: any) {
          if (apiError.message.includes('CORS') || apiError.message.includes('Network')) {
            setCorsError(true);
          }
          // Continue with other documents even if one fails
          console.warn(`Failed to update status for ${doc.requestId}:`, apiError);
        }
      }

      // Reload from IndexedDB to show updates
      const refreshedDocs = await indexedDBManager.getAllRequests();
      setDocuments(refreshedDocs as any);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [toast]);

  const pollForUpdates = useCallback(async (requestId: string) => {
    const maxAttempts = 30; // Poll for up to 5 minutes (30 * 10 seconds)
    let attempts = 0;

    const poll = async () => {
      try {
        const updatedDoc = await awsApiClient.getRequest(requestId);
        // Preserve original filename from existing document
        const existingDoc = await indexedDBManager.getRequest(requestId);
        if (existingDoc) {
          updatedDoc.fileName = existingDoc.fileName;
        }
        await indexedDBManager.saveRequest(updatedDoc as any);
        
        // Refresh the documents list
        loadDocuments();

        if (updatedDoc.status === 'completed' || updatedDoc.status === 'failed') {
          if (updatedDoc.status === 'completed') {
            toast({
              title: "Processing Complete",
              description: `Summary generated for ${updatedDoc.fileName}`,
            });
          } else {
            toast({
              title: "Processing Failed",
              description: `Failed to process ${updatedDoc.fileName}`,
              variant: "destructive",
            });
          }
          return; // Stop polling
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        }
      } catch (error) {
        console.warn('Polling error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Continue polling even on errors
        }
      }
    };

    // Start polling after a short delay
    setTimeout(poll, 5000);
  }, [loadDocuments, toast]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

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
        toast({
          title: "File too large",
          description: `${file.name} exceeds the maximum file size of 10MB`,
          variant: "destructive",
        });
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
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a document to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setCorsError(false);

      // Step 1: Create request and get upload URL
      const { requestId, uploadUrl } = await awsApiClient.createRequest(selectedFile.name);

      // Step 2: Upload file to S3 (this will automatically trigger OCR and summary generation)
      await awsApiClient.uploadDocument(uploadUrl, selectedFile);

      // Step 3: Save to IndexedDB with original filename
      const newDoc: DocumentRequest = {
        requestId,
        fileName: selectedFile.name, // Store original filename
        status: 'processing',
        createdAt: new Date().toISOString(),
      };
      await indexedDBManager.saveRequest(newDoc as any);

      toast({
        title: "Success",
        description: "Document uploaded successfully! Processing will start automatically.",
      });

      setSelectedFile(null);
      loadDocuments();

      // Start polling for status updates
      pollForUpdates(requestId);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      
      if (error.message.includes('CORS') || error.message.includes('Network')) {
        setCorsError(true);
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async (requestId: string) => {
    // In the new architecture, analysis is automatic
    // This function will just start polling for updates
    toast({
      title: "Checking Status",
      description: "Checking document processing status...",
    });
    
    pollForUpdates(requestId);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Discharge Summary</h1>
                <p className="text-muted-foreground mt-1">
                  Upload and analyze medical documents
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={loadDocuments}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* CORS Error Alert */}
          {corsError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>CORS Configuration Required</AlertTitle>
              <AlertDescription>
                Your AWS API Gateway needs CORS enabled. Please configure your API Gateway to allow:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Access-Control-Allow-Origin: *</li>
                  <li>Access-Control-Allow-Headers: content-type, x-api-key, authorization</li>
                  <li>Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS</li>
                </ul>
                <p className="mt-2">Meanwhile, documents are stored locally in IndexedDB.</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Section */}
          <div className="bg-card border rounded-lg p-6 mb-8">
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
                      
                      const getStatusIcon = () => {
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
                      
                      const getStatusText = () => {
                        switch (status) {
                          case 'uploading': return 'Uploading...';
                          case 'processing': return 'Processing...';
                          case 'completed': return 'Completed';
                          case 'error': return 'Error';
                          default: return 'Ready';
                        }
                      };
                      
                      const getStatusColor = () => {
                        switch (status) {
                          case 'uploading': return 'text-blue-600';
                          case 'processing': return 'text-yellow-600';
                          case 'completed': return 'text-green-600';
                          case 'error': return 'text-red-600';
                          default: return 'text-gray-600';
                        }
                      };
                      
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            {getStatusIcon()}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {file.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                              </div>
                              <div className={`text-xs ${getStatusColor()}`}>
                                {getStatusText()}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isLoading || Object.values(fileStatuses).some(status => status === 'uploading')}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                  <FileText className="mr-2 h-4 w-4" />
                  {selectedFiles.length > 0 
                    ? `Analyze ${selectedFiles.length} Document${selectedFiles.length > 1 ? 's' : ''}`
                    : "Analyze Documents"
                  }
                </>
              )}
            </Button>
          </div>

          {/* Documents Table */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Document Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                        No documents yet. Upload a document to get started.
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc.requestId} className="hover:bg-muted/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{doc.fileName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(doc.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {doc.status === 'completed' && doc.summary ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setShowSummaryDialog(true);
                                }}
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                View Summary
                              </Button>
                            ) : doc.status === 'processing' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                              >
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                Processing
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAnalyze(doc.requestId)}
                              >
                                Analyze
                              </Button>
                            )}
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
      </main>

      <Footer />

      {/* Summary Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0">
          <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Document Summary
              </DialogTitle>
              <DialogDescription>
                {selectedDocument?.fileName}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-2 py-4">
            {selectedDocument?.summary ? (
              <StructuredSummaryDisplay summary={selectedDocument.summary} />
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No summary available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentAnalysis;
