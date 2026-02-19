import React, { useState } from 'react';
import { Check, X, Lock, Copy, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SkillItem {
  name: string;
  foundInResume: boolean;
  frequencyInJob?: number;
  importance?: 'high' | 'medium' | 'low';
}

interface SkillsComparisonTableProps {
  skills: SkillItem[];
  title?: string;
  description?: string;
  scoreImpact?: 'High' | 'Medium' | 'Low';
}

export const SkillsComparisonTable: React.FC<SkillsComparisonTableProps> = ({
  skills,
  title = "Hard Skills",
  description = "Hard skills enable you to perform job-specific duties and responsibilities.",
  scoreImpact = "High"
}) => {
  const [showAll, setShowAll] = useState(false);
  const displayedSkills = showAll ? skills : skills.slice(0, 10);

  const copyAllSkills = () => {
    const text = skills.map(s => s.name).join(', ');
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            {scoreImpact} Score Impact
          </span>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed max-w-3xl">
          {description}
        </p>
      </div>

      {/* Table Actions */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Skills Comparison
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyAllSkills}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 mr-2" />
                Copy All
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy all skills to clipboard</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold w-1/3">Skill</th>
              <th className="px-6 py-4 font-semibold text-center w-1/4">Resume</th>
              <th className="px-6 py-4 font-semibold text-center w-1/4">Job Description</th>
            </tr>
          </thead>
          <tbody>
            {displayedSkills.map((skill, index) => (
              <tr 
                key={index} 
                className="bg-white border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-gray-800">
                  {skill.name}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    {skill.foundInResume ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-gray-600 font-medium">
                  {skill.frequencyInJob || 1}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {skills.length > 10 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
          <Button 
            variant="ghost" 
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            {showAll ? 'Show Less' : `Show ${skills.length - 10} More Skills`}
          </Button>
        </div>
      )}
    </div>
  );
};
