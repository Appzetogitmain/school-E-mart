import React from 'react';
import { BookOpen } from 'lucide-react';

const SchoolCaseStudies = ({ reelsRef }) => {
  return (
    <div className="px-6 pb-8 mt-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-black text-deep-purple -ml-1">
          Case Studies
        </h2>
      </div>

      <div
        ref={reelsRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
      >
        <div className="min-w-full bg-white border border-dashed border-gray-200 rounded-[2rem] p-10 text-center">
          <BookOpen size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-400">No case studies available yet</p>
          <p className="text-xs text-gray-400 mt-1">Check back later for school success stories.</p>
        </div>
      </div>
    </div>
  );
};

export default SchoolCaseStudies;
