import { useState } from 'react';
import { documentsAPI } from '../services/api';

const ExportDocumentDialog = ({ isOpen, onClose, document }) => {
  const [exporting, setExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);

  if (!isOpen || !document) return null;

  const handleExport = async (format) => {
    try {
      setExporting(true);
      setSelectedFormat(format);

      let blob;
      let filename;

      if (format === 'pdf') {
        blob = await documentsAPI.exportToPdf(document.id);
        filename = `${document.title.replace(/\s+/g, '_')}.pdf`;
      } else if (format === 'docx') {
        blob = await documentsAPI.exportToDocx(document.id);
        filename = `${document.title.replace(/\s+/g, '_')}.docx`;
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Close dialog after short delay
      setTimeout(() => {
        onClose();
        setExporting(false);
        setSelectedFormat(null);
      }, 1000);
    } catch (error) {
      alert('Failed to export document. Please try again.');
      setExporting(false);
      setSelectedFormat(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      {/* Dialog Box */}
      <div className="relative bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="font-black text-lg uppercase tracking-wider">Export Document</span>
          </div>
          <button
            onClick={onClose}
            disabled={exporting}
            className="hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <p className="text-sm text-gray-700 mb-6">
            Choose a format to export <span className="font-bold text-black">"{document.title}"</span>
          </p>

          <div className="space-y-3">
            {/* PDF Export Button */}
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              className="w-full p-6 border-2 border-black hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 border-2 border-black flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                      <path d="M14 2v6h6M9 13h6M9 17h6"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg uppercase">PDF Format</p>
                    <p className="text-xs text-gray-500 font-mono">Portable Document Format</p>
                  </div>
                </div>
                {exporting && selectedFormat === 'pdf' ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </button>

            {/* Word Export Button */}
            <button
              onClick={() => handleExport('docx')}
              disabled={exporting}
              className="w-full p-6 border-2 border-black hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 border-2 border-black flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                      <path d="M14 2v6h6M10 18l-2-6 2-6h2l2 6-2 6h-2z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg uppercase">Word Format</p>
                    <p className="text-xs text-gray-500 font-mono">Microsoft Word Document</p>
                  </div>
                </div>
                {exporting && selectedFormat === 'docx' ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </button>
          </div>

          {/* Info Note */}
          <div className="mt-6 bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs text-gray-600 font-mono">
              NOTE: Export preserves text formatting including bold, italic, underline, and alignment.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            disabled={exporting}
            className="w-full py-3 border-2 border-black font-bold text-sm uppercase tracking-widest hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDocumentDialog;
