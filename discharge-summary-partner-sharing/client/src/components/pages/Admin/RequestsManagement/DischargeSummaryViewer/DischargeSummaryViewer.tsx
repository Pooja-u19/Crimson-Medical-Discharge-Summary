import React, { useState, useEffect } from 'react';
import { Modal, Button, Loader, Alert, Text, Paper, Divider } from '@mantine/core';
import { IconDownload, IconPrinter, IconAlertCircle } from '@tabler/icons-react';
import api from '../../../../../api/axiosConfig';

interface DischargeSummaryViewerProps {
  opened: boolean;
  onClose: () => void;
  patientId: string;
  patientName?: string;
}

interface DischargeSummaryData {
  patientId: string;
  dischargeSummary: string;
  documentsProcessed: number;
}

const DischargeSummaryViewer: React.FC<DischargeSummaryViewerProps> = ({
  opened,
  onClose,
  patientId,
  patientName
}) => {
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<DischargeSummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (opened && patientId) {
      fetchDischargeSummary();
    }
  }, [opened, patientId]);

  const fetchDischargeSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/discharge-summary/${patientId}`);
      setSummaryData(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate discharge summary');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!summaryData) return;
    
    const element = document.createElement('a');
    const file = new Blob([summaryData.dischargeSummary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `discharge-summary-${patientId}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    if (!summaryData) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Discharge Summary - ${patientName || patientId}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; }
              .content { white-space: pre-wrap; }
              table { border-collapse: collapse; width: 100%; margin: 10px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .bold { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Hospital Discharge Summary</h1>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="content">${summaryData.dischargeSummary.replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const formatSummaryForDisplay = (summary: string) => {
    return summary
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <Text key={index} fw={700} size="md" mb="xs">
              {line.replace(/\*\*/g, '')}
            </Text>
          );
        } else if (line.includes('\t')) {
          const cells = line.split('\t');
          return (
            <div key={index} style={{ display: 'flex', marginBottom: '4px' }}>
              {cells.map((cell, cellIndex) => (
                <div
                  key={cellIndex}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    backgroundColor: cellIndex === 0 ? '#f8f9fa' : 'white'
                  }}
                >
                  {cell}
                </div>
              ))}
            </div>
          );
        } else if (line.trim()) {
          return (
            <Text key={index} mb="xs">
              {line}
            </Text>
          );
        }
        return <div key={index} style={{ height: '8px' }} />;
      });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Discharge Summary - ${patientName || patientId}`}
      size="xl"
      styles={{
        body: { maxHeight: '70vh', overflow: 'auto' },
        header: { backgroundColor: '#f8f9fa' }
      }}
    >
      {loading && (
        <div className="flex justify-center items-center py-8">
          <Loader size="lg" />
          <Text ml="md">Generating discharge summary...</Text>
        </div>
      )}

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
          {error}
        </Alert>
      )}

      {summaryData && (
        <>
          <div className="flex justify-between items-center mb-4">
            <Text size="sm" color="dimmed">
              Generated from {summaryData.documentsProcessed} medical documents
            </Text>
            <div className="flex gap-2">
              <Button
                leftSection={<IconDownload size={16} />}
                variant="outline"
                onClick={handleDownload}
                size="sm"
              >
                Download
              </Button>
              <Button
                leftSection={<IconPrinter size={16} />}
                variant="outline"
                onClick={handlePrint}
                size="sm"
              >
                Print
              </Button>
            </div>
          </div>
          
          <Divider mb="md" />
          
          <Paper p="md" style={{ backgroundColor: '#fafafa' }}>
            {formatSummaryForDisplay(summaryData.dischargeSummary)}
          </Paper>
        </>
      )}

      {!loading && !error && !summaryData && (
        <Text color="dimmed" ta="center" py="xl">
          No discharge summary available
        </Text>
      )}
    </Modal>
  );
};

export default DischargeSummaryViewer;