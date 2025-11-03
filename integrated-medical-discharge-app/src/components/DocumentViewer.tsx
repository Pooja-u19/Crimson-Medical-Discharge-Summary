import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Download, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface ExaminationItem {
  label: string;
  admission: string;
}

interface TreatmentItem {
  drugName: string;
  dosage?: string;
  frequency?: string;
  numberOfDays?: string;
  remark?: string;
}

interface DocumentViewerProps {
  summary: {
    [key: string]: {
      pageSource?: number[];
      usedRawText?: string;
      summarizedText: string;
    };
  };
  pages?: string[];
  documentS3Path?: string;
  onBack?: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  summary = {},
  pages = ["No pages available."],
  documentS3Path,
  onBack
}) => {
  const navigate = useNavigate();
  const [openPages, setOpenPages] = useState<{ [key: number]: boolean }>({ 0: true });
  const pageRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const summaryRef = useRef<HTMLDivElement | null>(null);

  // Function to handle summary clicks (currently unused but kept for future functionality)
  // const handleSummaryClick = (usedRawText: string, pageNumber: number) => {
  //   setHighlightText(usedRawText);
  //   setActivePage(pageNumber);
  //   setOpenPages(prev => ({ ...prev, [pageNumber]: true }));
  // };



  const downloadPDF = async () => {
    if (!summaryRef.current) return;

    try {
      const canvas = await html2canvas(summaryRef.current, { 
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      // Canvas is ready for PDF generation

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const pxPerMm = canvas.width / imgWidth;
      // const imgHeight = canvas.height / pxPerMm; // Unused variable

      let position = 0;
      let pageCanvas = document.createElement("canvas");
      const ctx = pageCanvas.getContext("2d")!;
      const pageHeightPx = pageHeight * pxPerMm;

      while (position < canvas.height) {
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(pageHeightPx, canvas.height - position);

        ctx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          position,
          canvas.width,
          pageCanvas.height,
          0,
          0,
          canvas.width,
          pageCanvas.height
        );

        const pageData = pageCanvas.toDataURL("image/png");
        if (position > 0) pdf.addPage();
        pdf.addImage(
          pageData,
          "PNG",
          0,
          0,
          imgWidth,
          pageCanvas.height / pxPerMm
        );
        position += pageHeightPx;
      }

      pdf.save("Discharge_Summary.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const downloadSummary = () => {
    const getText = (field: any) => {
      if (!field?.summarizedText) return "*";
      return typeof field.summarizedText === 'string' ? field.summarizedText : String(field.summarizedText);
    };

    const summaryText = `DISCHARGE SUMMARY\n\n` +
      `Patient Name: ${getText(summary.patientName)}\n` +
      `Gender: ${getText(summary.gender)}\n` +
      `Age: ${getText(summary.age)}\n` +
      `IP No: ${getText(summary.ipNo)}\n` +
      `Admission Date: ${getText(summary.admissionDate)}\n` +
      `Discharge Date: ${getText(summary.dischargeDate)}\n` +
      `Admitting Doctor: ${getText(summary.admittingDoctor)}\n\n` +
      `DIAGNOSIS:\n${getText(summary.diagnosis)}\n\n` +
      `PRESENTING COMPLAINTS:\n${getText(summary.presentingComplaints)}\n\n` +
      `PAST HISTORY:\n${getText(summary.pastHistory)}\n\n` +
      `HOSPITAL COURSE:\n${getText(summary.hospitalCourse)}\n\n` +
      `TREATMENT DURING HOSPITALIZATION:\n${getText(summary.hospitalizationTreatment)}\n\n` +
      `ADVICE:\n${getText(summary.advice)}\n\n` +
      `PREVENTIVE CARE:\n${getText(summary.preventiveCare)}\n\n` +
      `WHEN TO OBTAIN URGENT CARE:\n${getText(summary.obtainUrgentCare)}\n\n` +
      `BILLING INFORMATION:\n` +
      `Total Charges: ${getText(summary.totalCharges)}\n` +
      `Insurance Coverage: ${getText(summary.insuranceCoverage)}\n` +
      `Patient Responsibility: ${getText(summary.patientResponsibility)}\n` +
      `Payment Status: ${getText(summary.paymentStatus)}\n` +
      `Billing Notes: ${getText(summary.billingNotes)}`;

    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Discharge_Summary.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const togglePage = (index: number) => {
    setOpenPages(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-50 z-10 py-4">
        <Button onClick={handleBack} variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          {documentS3Path && (
            <Button
              onClick={() => window.open(documentS3Path, "_blank")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Source
            </Button>
          )}
          <Button
            onClick={downloadPDF}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Summary
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card ref={summaryRef} className="mb-6 bg-white shadow-lg">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Discharge Summary
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Patient Information Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 pb-4 border-b">
            <div className="space-y-2">
              <p><strong>Name:</strong> {typeof summary.patientName?.summarizedText === 'string' ? summary.patientName.summarizedText : String(summary.patientName?.summarizedText || "*")}</p>
              <p><strong>Gender:</strong> {typeof summary.gender?.summarizedText === 'string' ? summary.gender.summarizedText : String(summary.gender?.summarizedText || "*")}</p>
              <p><strong>Age:</strong> {typeof summary.age?.summarizedText === 'string' ? summary.age.summarizedText : String(summary.age?.summarizedText || "*")}</p>
              <p><strong>Admitting Doctor:</strong> {typeof summary.admittingDoctor?.summarizedText === 'string' ? summary.admittingDoctor.summarizedText : String(summary.admittingDoctor?.summarizedText || "*")}</p>
            </div>
            <div className="space-y-2">
              <p><strong>IP No:</strong> {typeof summary.ipNo?.summarizedText === 'string' ? summary.ipNo.summarizedText : String(summary.ipNo?.summarizedText || "*")}</p>
              <p><strong>Summary No:</strong> {typeof summary.summaryNumber?.summarizedText === 'string' ? summary.summaryNumber.summarizedText : String(summary.summaryNumber?.summarizedText || "*")}</p>
              <p><strong>Admission Date:</strong> {typeof summary.admissionDate?.summarizedText === 'string' ? summary.admissionDate.summarizedText : String(summary.admissionDate?.summarizedText || "*")}</p>
              <p><strong>Discharge Date:</strong> {typeof summary.dischargeDate?.summarizedText === 'string' ? summary.dischargeDate.summarizedText : String(summary.dischargeDate?.summarizedText || "*")}</p>
            </div>
          </div>

          {/* Clinical Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1">Diagnosis</h3>
              <p className="text-gray-700">{typeof summary.diagnosis?.summarizedText === 'string' ? summary.diagnosis.summarizedText : String(summary.diagnosis?.summarizedText || "*")}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1">Presenting Complaints</h3>
              <p className="text-gray-700">{typeof summary.presentingComplaints?.summarizedText === 'string' ? summary.presentingComplaints.summarizedText : String(summary.presentingComplaints?.summarizedText || "*")}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1">Past History</h3>
              <p className="text-gray-700">{typeof summary.pastHistory?.summarizedText === 'string' ? summary.pastHistory.summarizedText : String(summary.pastHistory?.summarizedText || "*")}</p>
            </div>

            {/* Systemic Examination Table */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-1">Systemic Examination</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border-2 border-gray-400">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Exam Name</th>
                      <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Value (Admission)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.systemicExamination?.summarizedText ? (
                      (() => {
                        try {
                          const text = summary.systemicExamination.summarizedText;
                          if (typeof text === 'string') {
                            return JSON.parse(
                              text.replace(/[\x00-\x1F\x7F]/g, "")
                            ).map((item: ExaminationItem, index: number) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-400 px-4 py-3">{item.label}</td>
                                <td className="border border-gray-400 px-4 py-3">{item.admission}</td>
                              </tr>
                            ));
                          } else {
                            return (
                              <tr>
                                <td className="border border-gray-400 px-4 py-3" colSpan={2}>
                                  {String(text)}
                                </td>
                              </tr>
                            );
                          }
                        } catch {
                          return (
                            <tr>
                              <td className="border border-gray-400 px-4 py-3" colSpan={2}>
                                {String(summary.systemicExamination.summarizedText)}
                              </td>
                            </tr>
                          );
                        }
                      })()
                    ) : (
                      <tr>
                        <td className="border border-gray-400 px-4 py-3" colSpan={2}>*</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1">Summary of Key Investigations</h3>
              <p className="text-gray-700">{typeof summary.keyInvestigationSummary?.summarizedText === 'string' ? summary.keyInvestigationSummary.summarizedText : String(summary.keyInvestigationSummary?.summarizedText || "*")}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1">Hospital Course</h3>
              <p className="text-gray-700">{typeof summary.hospitalCourse?.summarizedText === 'string' ? summary.hospitalCourse.summarizedText : String(summary.hospitalCourse?.summarizedText || "*")}</p>
            </div>

            {/* Treatment During Hospitalization */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1">Treatment During Hospitalization</h3>
              <div className="ml-4">
                <p className="font-medium mb-2">Drug Names:</p>
                {summary.hospitalizationTreatment?.summarizedText ? (
                  typeof summary.hospitalizationTreatment.summarizedText === 'string' ? (
                    summary.hospitalizationTreatment.summarizedText
                      .split(", ")
                      .map((drug, index) => (
                        <p key={index} className="ml-4 text-gray-700">• {drug}</p>
                      ))
                  ) : (
                    <p className="ml-4 text-gray-700">• {String(summary.hospitalizationTreatment.summarizedText)}</p>
                  )
                ) : (
                  <p className="text-gray-700">*</p>
                )}
              </div>
            </div>

            {/* Treatment on Discharge Table */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-1">Treatment on Discharge</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border-2 border-gray-400">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Drug Name</th>
                      <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Dosage</th>
                      <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Frequency</th>
                      <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Duration</th>
                      <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.dischargeTreatment?.summarizedText ? (
                      (() => {
                        try {
                          const text = summary.dischargeTreatment.summarizedText;
                          if (typeof text === 'string') {
                            return JSON.parse(
                              text.replace(/[\x00-\x1F\x7F]/g, "")
                            ).map((drug: TreatmentItem, index: number) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-400 px-4 py-3">{drug.drugName}</td>
                                <td className="border border-gray-400 px-4 py-3">{drug.dosage || "-"}</td>
                                <td className="border border-gray-400 px-4 py-3">{drug.frequency || "-"}</td>
                                <td className="border border-gray-400 px-4 py-3">{drug.numberOfDays || "-"}</td>
                                <td className="border border-gray-400 px-4 py-3">{drug.remark || "-"}</td>
                              </tr>
                            ));
                          } else {
                            return (
                              <tr>
                                <td className="border border-gray-400 px-4 py-3" colSpan={5}>
                                  {String(text)}
                                </td>
                              </tr>
                            );
                          }
                        } catch {
                          return (
                            <tr>
                              <td className="border border-gray-400 px-4 py-3" colSpan={5}>
                                {String(summary.dischargeTreatment.summarizedText)}
                              </td>
                            </tr>
                          );
                        }
                      })()
                    ) : (
                      <tr>
                        <td className="border border-gray-400 px-4 py-3 text-center" colSpan={5}>
                          No treatment details available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1">Advice</h3>
              <p className="text-gray-700">{typeof summary.advice?.summarizedText === 'string' ? summary.advice.summarizedText : String(summary.advice?.summarizedText || "*")}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1">Preventive Care</h3>
              <p className="text-gray-700">{typeof summary.preventiveCare?.summarizedText === 'string' ? summary.preventiveCare.summarizedText : String(summary.preventiveCare?.summarizedText || "*")}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1">When to Obtain Urgent Care</h3>
              <p className="text-gray-700">{typeof summary.obtainUrgentCare?.summarizedText === 'string' ? summary.obtainUrgentCare.summarizedText : String(summary.obtainUrgentCare?.summarizedText || "*")}</p>
            </div>

            {/* Billing Information Table */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-1">Billing Information</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border-2 border-gray-400">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Billing Item</th>
                      <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-400 px-4 py-3 font-medium">Total Charges</td>
                      <td className="border border-gray-400 px-4 py-3">{typeof summary.totalCharges?.summarizedText === 'string' ? summary.totalCharges.summarizedText : String(summary.totalCharges?.summarizedText || "Not provided")}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-400 px-4 py-3 font-medium">Insurance Coverage</td>
                      <td className="border border-gray-400 px-4 py-3">{typeof summary.insuranceCoverage?.summarizedText === 'string' ? summary.insuranceCoverage.summarizedText : String(summary.insuranceCoverage?.summarizedText || "Not provided")}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-400 px-4 py-3 font-medium">Patient Responsibility</td>
                      <td className="border border-gray-400 px-4 py-3">{typeof summary.patientResponsibility?.summarizedText === 'string' ? summary.patientResponsibility.summarizedText : String(summary.patientResponsibility?.summarizedText || "Not provided")}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-400 px-4 py-3 font-medium">Payment Status</td>
                      <td className="border border-gray-400 px-4 py-3">{typeof summary.paymentStatus?.summarizedText === 'string' ? summary.paymentStatus.summarizedText : String(summary.paymentStatus?.summarizedText || "Not provided")}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-400 px-4 py-3 font-medium">Billing Notes</td>
                      <td className="border border-gray-400 px-4 py-3">{typeof summary.billingNotes?.summarizedText === 'string' ? summary.billingNotes.summarizedText : String(summary.billingNotes?.summarizedText || "Not provided")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Pages */}
      <Card className="bg-white shadow-lg print:hidden">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Document Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pages.map((page, index) => (
              <Collapsible
                key={index}
                open={openPages[index]}
                onOpenChange={() => togglePage(index)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <span className="text-lg font-medium flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Page {index + 1}
                  </span>
                  {openPages[index] ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p
                      ref={(el) => (pageRefs.current[index] = el)}
                      className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: page,
                      }}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentViewer;