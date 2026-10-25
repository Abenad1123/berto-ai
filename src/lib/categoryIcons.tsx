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
  FolderTree,
} from 'lucide-react';

export function getCategoryIcon(
  category: string,
  className = 'w-4 h-4',
  customIcon?: string
): React.ReactNode {
  if (customIcon) {
    const trimmed = customIcon.trim();
    // If it's an emoji or symbol
    if (/\p{Extended_Pictographic}/u.test(trimmed) || /[\u{1F300}-\u{1FAFF}]/u.test(trimmed)) {
      return (
        <span
          className={`inline-flex items-center justify-center select-none ${className}`}
          style={{ fontSize: '1.2em' }}
        >
          {trimmed}
        </span>
      );
    }

    switch (trimmed.toLowerCase()) {
      case 'sparkles':
        return <Sparkles className={className} aria-hidden="true" />;
      case 'foldertree':
      case 'folder':
        return <FolderTree className={className} aria-hidden="true" />;
      case 'microscope':
      case 'science':
        return <Microscope className={className} aria-hidden="true" />;
      case 'code':
      case 'code2':
        return <Code2 className={className} aria-hidden="true" />;
      case 'globe':
      case 'globe2':
      case 'history':
        return <Globe2 className={className} aria-hidden="true" />;
      case 'languages':
        return <Languages className={className} aria-hidden="true" />;
      case 'calculator':
      case 'math':
        return <Calculator className={className} aria-hidden="true" />;
      case 'stethoscope':
      case 'medicine':
        return <Stethoscope className={className} aria-hidden="true" />;
      case 'briefcase':
      case 'business':
        return <Briefcase className={className} aria-hidden="true" />;
      case 'graduationcap':
      case 'cap':
      case 'exam':
        return <GraduationCap className={className} aria-hidden="true" />;
      case 'bookopen':
      case 'book':
        return <BookOpen className={className} aria-hidden="true" />;
      default:
        break;
    }
  }

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
