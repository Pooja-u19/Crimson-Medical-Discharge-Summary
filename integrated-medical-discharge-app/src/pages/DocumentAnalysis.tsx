import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { awsApiClient, DocumentRequest } from "@/lib/aws-api";
import { indexedDBManager } from "@/lib/indexeddb";
import { createSummaryPrompt } from "@/lib/aws-bedrock";
import { Upload, RefreshCw, FileText, Eye, ArrowLeft, Loader2, AlertCircle, User, Calendar, Stethoscope, ClipboardList, Activity, Pill, Heart, Check, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MultiFileUpload from "@/components/MultiFileUpload";
import DocumentViewer from "@/components/DocumentViewer";
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
          <span className="text-gray-900">{cleanText(data.patientName) || "--"}</span>
        </div>
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">IP No:</span>
          <span className="text-gray-900">{cleanText(data.ipNo) || "--"}</span>
        </div>
        
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">Gender:</span>
          <span className="text-gray-900">{cleanText(data.gender) || "--"}</span>
        </div>
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">Summary No:</span>
          <span className="text-gray-900">{cleanText(data.summaryNumber) || "--"}</span>
        </div>
        
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">Age:</span>
          <span className="text-gray-900">{cleanText(data.age) || "--"}</span>
        </div>
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">Admission Date:</span>
          <span className="text-gray-900">{cleanText(data.admissionDate) || "--"}</span>
        </div>
        
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">Admitting Doctor:</span>
          <span className="text-gray-900">{cleanText(data.admittingDoctor) || "--"}</span>
        </div>
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">Discharge Date:</span>
          <span className="text-gray-900">{cleanText(data.dischargeDate) || "--"}</span>
        </div>
      </div>

      {/* Diagnosis Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">Diagnosis</h2>
        <p className="text-gray-700 leading-relaxed">
          {cleanText(data.diagnosis) || "No diagnosis information available from uploaded documents"}
        </p>
      </div>

      {/* Presenting Complaints Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">Presenting Complaints</h2>
        <p className="text-gray-700 leading-relaxed">
          {cleanText(data.presentingComplaints) || "No presenting complaints recorded in uploaded documents"}
        </p>
      </div>

      {/* Past History Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">Past History</h2>
        <p className="text-gray-700 leading-relaxed">
          {cleanText(data.pastHistory) || "No past history available in uploaded documents"}
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
                // No examination data available
                <tr className="hover:bg-gray-50">
                  <td colSpan={2} className="border border-gray-400 px-4 py-3 text-gray-700 text-center">
                    No examination data available in uploaded documents
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary of Key Investigations */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">Summary of Key Investigations</h2>
        <p className="text-gray-700 leading-relaxed">
          {cleanText(data.keyInvestigationSummary) || "No investigation summary available in uploaded documents"}
        </p>
      </div>

      {/* Hospital Course */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">Hospital Course</h2>
        <p className="text-gray-700 leading-relaxed">
          {cleanText(data.hospitalCourse) || "No hospital course information available in uploaded documents"}
        </p>
      </div>

      {/* Treatment During Hospitalization */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">Treatment During Hospitalization</h2>
        <div className="mb-3">
          <h3 className="font-semibold text-gray-700 mb-1">Drug Names</h3>
          <p className="text-gray-700">
            {cleanText(data.hospitalizationTreatment) || "No hospitalization treatment information available in uploaded documents"}
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
                // No discharge medications available
                <tr className="hover:bg-gray-50">
                  <td colSpan={5} className="border border-gray-400 px-4 py-3 text-gray-700 text-center">
                    No discharge medications recorded in uploaded documents
                  </td>
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
          {cleanText(data.advice) || "No specific advice provided in uploaded documents"}
        </p>
      </div>

      {/* Preventive Care Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">Preventive Care</h2>
        <p className="text-gray-700 leading-relaxed">
          {cleanText(data.preventiveCare) || "No preventive care instructions provided in uploaded documents"}
        </p>
      </div>

      {/* When to Obtain Urgent Care */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">When to Obtain Urgent Care</h2>
        <p className="text-gray-700 leading-relaxed">
          {cleanText(data.obtainUrgentCare) || "No urgent care warnings specified in uploaded documents"}
        </p>
      </div>

      {/* Billing Information */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">Billing Information</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-gray-400">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-4 py-3 text-left font-semibold text-gray-800">
                  Billing Item
                </th>
                <th className="border border-gray-400 px-4 py-3 text-left font-semibold text-gray-800">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-400 px-4 py-3 text-gray-700 font-medium">
                  Total Charges
                </td>
                <td className="border border-gray-400 px-4 py-3 text-gray-700">
                  {cleanText(data.totalCharges) || "Not provided"}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-400 px-4 py-3 text-gray-700 font-medium">
                  Insurance Coverage
                </td>
                <td className="border border-gray-400 px-4 py-3 text-gray-700">
                  {cleanText(data.insuranceCoverage) || "Not provided"}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-400 px-4 py-3 text-gray-700 font-medium">
                  Patient Responsibility
                </td>
                <td className="border border-gray-400 px-4 py-3 text-gray-700">
                  {cleanText(data.patientResponsibility) || "Not provided"}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-400 px-4 py-3 text-gray-700 font-medium">
                  Payment Status
                </td>
                <td className="border border-gray-400 px-4 py-3 text-gray-700">
                  {cleanText(data.paymentStatus) || "Not provided"}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-400 px-4 py-3 text-gray-700 font-medium">
                  Billing Notes
                </td>
                <td className="border border-gray-400 px-4 py-3 text-gray-700">
                  {cleanText(data.billingNotes) || "Not provided"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DocumentAnalysis = () => {
  const [documents, setDocuments] = useState<DocumentRequest[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentRequest | null>(null);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [corsError, setCorsError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
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
      let hasUpdates = false;
      for (const doc of localDocs) {
        try {
          const updatedDoc = await awsApiClient.getRequest(doc.requestId);
          if (updatedDoc.status !== doc.status || updatedDoc.summary !== doc.summary) {
            // Update IndexedDB with new data but preserve original filename
            updatedDoc.fileName = doc.fileName; // Keep original filename
            await indexedDBManager.saveRequest(updatedDoc as any);
            hasUpdates = true;
            
            // Show notification for newly completed documents
            if (doc.status !== 'completed' && updatedDoc.status === 'completed') {
              toast({
                title: "Processing Complete",
                description: `Summary generated for ${doc.fileName}`,
              });
            }
          }
        } catch (apiError: any) {
          if (apiError.message.includes('CORS') || apiError.message.includes('Network')) {
            setCorsError(true);
          }
          // Continue with other documents even if one fails
          console.warn(`Failed to update status for ${doc.requestId}:`, apiError);
        }
      }

      // Reload from IndexedDB to show updates if there were any
      if (hasUpdates) {
        const refreshedDocs = await indexedDBManager.getAllRequests();
        setDocuments(refreshedDocs as any);
      }
      
      setLastRefresh(new Date());
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
    const maxAttempts = 60; // Poll for up to 10 minutes (60 * 10 seconds)
    let attempts = 0;
    let pollInterval: NodeJS.Timeout;

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
        await loadDocuments();

        if (updatedDoc.status === 'completed' || updatedDoc.status === 'failed') {
          if (pollInterval) clearInterval(pollInterval);
          
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
        if (attempts >= maxAttempts) {
          if (pollInterval) clearInterval(pollInterval);
          toast({
            title: "Polling Timeout",
            description: `Stopped checking status for ${updatedDoc.fileName}. Please refresh manually.`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.warn('Polling error:', error);
        attempts++;
        if (attempts >= maxAttempts) {
          if (pollInterval) clearInterval(pollInterval);
          toast({
            title: "Polling Error",
            description: `Failed to check status for request ${requestId}. Please refresh manually.`,
            variant: "destructive",
          });
        }
      }
    };

    // Start polling immediately, then every 10 seconds
    await poll();
    pollInterval = setInterval(poll, 10000);
    
    // Return cleanup function
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [loadDocuments, toast]);

  useEffect(() => {
    loadDocuments();
    
    // Set up periodic auto-refresh every 30 seconds
    const autoRefreshInterval = setInterval(() => {
      loadDocuments();
    }, 30000);
    
    return () => {
      clearInterval(autoRefreshInterval);
    };
  }, [loadDocuments]);



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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={loadDocuments}
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">
                  Auto-refresh: 30s
                </span>
                <span className="text-xs text-muted-foreground">
                  Last: {lastRefresh.toLocaleTimeString()}
                </span>
              </div>
            </div>
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

          {/* Multi-File Upload Section */}
          <MultiFileUpload 
            onUploadComplete={(requestId, patientId) => {
              toast({
                title: "Upload Complete",
                description: `Documents uploaded successfully for patient ${patientId}. Processing started...`,
              });
              loadDocuments();
              // Start polling for this specific request
              pollForUpdates(requestId);
            }}
          />



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
                                    setShowDocumentViewer(true);
                                  }}
                                >
                                  <FileText className="mr-1 h-4 w-4" />
                                  View Document
                                </Button>
                            ) : doc.status === 'processing' ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                >
                                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                  Processing
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  Auto-checking...
                                </span>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAnalyze(doc.requestId)}
                              >
                                <RefreshCw className="mr-1 h-4 w-4" />
                                Check Status
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

      {/* Document Viewer */}
      {showDocumentViewer && selectedDocument && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <DocumentViewer
            summary={selectedDocument.summary ? (() => {
              try {
                const parsed = JSON.parse(selectedDocument.summary);
                const data = parsed.data || parsed;
                // Convert flat data to expected format with summarizedText properties
                const formattedSummary: any = {};
                Object.keys(data).forEach(key => {
                  formattedSummary[key] = {
                    summarizedText: typeof data[key] === 'string' ? data[key] : String(data[key] || '*')
                  };
                });
                return formattedSummary;
              } catch {
                return {};
              }
            })() : {}}
            pages={selectedDocument.pages || []}
            documentS3Path={selectedDocument.documentS3Path}
            onBack={() => setShowDocumentViewer(false)}
          />
        </div>
      )}
    </div>
  );
};

export default DocumentAnalysis;
