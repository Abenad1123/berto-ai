import React from 'react';
import {
  Microscope,
  Code2,
  Globe2,
  Languages,
  Calculator,
  Stethoscope,
  Briefcase,
  BookOpen,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export function getCategoryIcon(category: string, className = 'w-4 h-4'): React.ReactNode {
  const norm = category.toLowerCase().trim();

  switch (norm) {
    case 'science':
    case 'biology':
    case 'chemistry':
    case 'physics':
      return <Microscope className={className} aria-hidden="true" />;
    case 'computer science':
    case 'cs':
    case 'programming':
    case 'coding':
      return <Code2 className={className} aria-hidden="true" />;
    case 'history':
    case 'geography':
    case 'social studies':
      return <Globe2 className={className} aria-hidden="true" />;
    case 'language':
    case 'languages':
    case 'spanish':
    case 'french':
    case 'japanese':
      return <Languages className={className} aria-hidden="true" />;
    case 'math':
    case 'mathematics':
    case 'calculus':
    case 'algebra':
      return <Calculator className={className} aria-hidden="true" />;
    case 'medicine':
    case 'medical':
    case 'health':
    case 'anatomy':
      return <Stethoscope className={className} aria-hidden="true" />;
    case 'business':
    case 'economics':
    case 'finance':
      return <Briefcase className={className} aria-hidden="true" />;
    case 'all':
      return <Sparkles className={className} aria-hidden="true" />;
    default:
      return norm.includes('exam') ? (
        <GraduationCap className={className} aria-hidden="true" />
      ) : (
        <BookOpen className={className} aria-hidden="true" />
      );
  }
}
