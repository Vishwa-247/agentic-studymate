import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface ChecklistItemProps {
  label: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ label, status, message }) => {
  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />;
    }
  };

  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-4 rounded-lg">
      <div className="mt-1">{getIcon()}</div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-800 text-sm mb-1">{label}</h4>
        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
};

interface SearchabilityChecklistProps {
  analysis: any; // Using any for now to map from backend response dynamically
}

export const SearchabilityChecklist: React.FC<SearchabilityChecklistProps> = ({ analysis }) => {
  // Helper to determine status from score
  const getStatus = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  };

  const sections = analysis?.sections_analysis || {};

  const checklistItems: ChecklistItemProps[] = [
    {
      label: 'Contact Information',
      status: getStatus(sections.contact_info?.score || 0),
      message: sections.contact_info?.feedback || 'Contact information analysis unavailable.'
    },
    {
      label: 'Summary Section',
      status: getStatus(sections.summary?.score || 0),
      message: sections.summary?.feedback || 'Summary section analysis unavailable.'
    },
    {
      label: 'Work Experience',
      status: getStatus(sections.experience?.score || 0),
      message: sections.experience?.feedback || 'Experience section analysis unavailable.'
    },
    {
      label: 'Education',
      status: getStatus(sections.education?.score || 0),
      message: sections.education?.feedback || 'Education section analysis unavailable.'
    },
    {
      label: 'Skills',
      status: getStatus(sections.skills?.score || 0),
      message: sections.skills?.feedback || 'Skills section analysis unavailable.'
    }
    // We can add "Job Title Match" etc if we extract that specifically from keyword analysis
  ];

  // Add keyword density check if available
  if (analysis?.keyword_analysis?.keyword_density !== undefined) {
    const density = analysis.keyword_analysis.keyword_density;
    checklistItems.push({
      label: 'Keyword Optimization',
      status: density > 0.5 ? 'success' : 'warning',
      message: density > 0.5 
        ? 'Good keyword density found relative to the job description.' 
        : 'Keyword density is low. Try incorporating more terms from the job description.'
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Searchability</h3>
          <p className="text-sm text-gray-500">ATS compliance and parsing checks</p>
        </div>
        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
          Important
        </span>
      </div>
      <div className="p-2">
        {checklistItems.map((item, index) => (
          <ChecklistItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
};
