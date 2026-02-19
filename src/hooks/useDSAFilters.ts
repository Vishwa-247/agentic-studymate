import { useState, useMemo } from 'react';
import { DSATopic } from '@/data/dsaProblems';
import { Company } from '@/data/companyProblems';

interface Filters {
  difficulty: string[];
  companies: string[];
}

interface UseDSAFiltersProps {
  topics: DSATopic[];
  companies: Company[];
}

export const useDSAFilters = ({ topics, companies }: UseDSAFiltersProps) => {
  const [filters, setFilters] = useState<Filters>({
    difficulty: [],
    companies: []
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Filter topics
  const filteredTopics = useMemo(() => {
    if (!topics || !Array.isArray(topics)) {
      return [];
    }
    return topics.filter(topic => {
      // Search filter
      if (searchQuery && !topic.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Difficulty filter
      if (filters.difficulty.length > 0 && !filters.difficulty.includes(topic.difficulty)) {
        return false;
      }


      return true;
    });
  }, [topics, filters, searchQuery]);

  // Filter companies
  const filteredCompanies = useMemo(() => {
    if (!companies || !Array.isArray(companies)) {
      return [];
    }
    return companies.filter(company => {
      // Search filter
      if (searchQuery && !company.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Company name filter
      if (filters.companies.length > 0 && !filters.companies.includes(company.title)) {
        return false;
      }

      // Difficulty filter - check if company has problems matching the difficulty
      if (filters.difficulty.length > 0) {
        if (!company.problems || !Array.isArray(company.problems)) {
          return false;
        }
        const hasMatchingProblems = company.problems.some(problem => 
          filters.difficulty.includes(problem.difficulty)
        );
        if (!hasMatchingProblems) {
          return false;
        }
      }

      return true;
    });
  }, [companies, filters, searchQuery]);

  // Get available company names for filter dropdown
  const availableCompanies = useMemo(() => {
    if (!companies || !Array.isArray(companies)) {
      return [];
    }
    return companies.map(company => company.title).sort();
  }, [companies]);

  // Filter problems within companies based on difficulty
  const getFilteredProblemsForCompany = (company: Company) => {
    if (!company.problems || !Array.isArray(company.problems)) {
      return [];
    }
    if (filters.difficulty.length === 0) {
      return company.problems;
    }
    return company.problems.filter(problem => 
      filters.difficulty.includes(problem.difficulty)
    );
  };

  // Statistics
  const stats = useMemo(() => {
    const totalTopics = filteredTopics.length;
    const totalProblems = filteredTopics.reduce((sum, topic) => sum + topic.totalProblems, 0);
    const solvedProblems = filteredTopics.reduce((sum, topic) => sum + topic.solvedProblems, 0);

    const totalCompanies = filteredCompanies.length;
    const totalCompanyProblems = filteredCompanies.reduce((sum, company) => {
      const problems = getFilteredProblemsForCompany(company);
      return sum + problems.length;
    }, 0);
    const solvedCompanyProblems = filteredCompanies.reduce((sum, company) => {
      const problems = getFilteredProblemsForCompany(company);
      return sum + problems.filter(p => p.completed).length;
    }, 0);

    return {
      topics: {
        total: totalTopics,
        totalProblems,
        solvedProblems
      },
      companies: {
        total: totalCompanies,
        totalProblems: totalCompanyProblems,
        solvedProblems: solvedCompanyProblems
      }
    };
  }, [filteredTopics, filteredCompanies, filters]);

  return {
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    filteredTopics,
    filteredCompanies,
    availableCompanies,
    getFilteredProblemsForCompany,
    stats
  };
};