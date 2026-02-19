import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ExternalLink, Briefcase, Search, Loader2, MapPin, DollarSign,
    Clock, ChevronDown, ChevronUp, CheckCircle2, XCircle, Target,
    ArrowUpDown, Filter, Zap, Globe, TrendingUp, AlertTriangle
} from 'lucide-react';
import { CircularScore } from '../resume/CircularScore';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Types ───────────────────────────────────────────────── */
interface JobMatch {
    title: string;
    company: string;
    url: string;
    overall_score: number;
    skills_match: number;
    experience_match: number;
    matching_skills: string[];
    missing_skills: string[];
    reasoning: string;
    gap_analysis: string;
    location: string;
    experience_level: string;
    salary_estimate: string;
    posted_age: string;
    source: string;
}

interface JobRecommendationsProps {
    jobRole: string;
    resumeText?: string;
}

type Freshness = 'pd' | 'pw' | 'pm';
type SortBy = 'score' | 'recent';

/* ─── Score color helper ──────────────────────────────────── */
const scoreColor = (s: number) =>
    s >= 80 ? 'text-emerald-500' : s >= 60 ? 'text-amber-500' : s >= 40 ? 'text-orange-500' : 'text-red-400';

const scoreBg = (s: number) =>
    s >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : s >= 60 ? 'bg-amber-500/10 border-amber-500/30' : s >= 40 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-red-400/10 border-red-400/30';

const levelBadge = (l: string) => {
    const lower = l.toLowerCase();
    if (lower.includes('senior') || lower.includes('lead')) return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    if (lower.includes('mid')) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    return 'bg-green-500/10 text-green-400 border-green-500/30';
};

/* ─── Skeleton Loader ─────────────────────────────────────── */
const SearchSkeleton = () => (
    <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
            <div className="h-5 w-5 rounded-full bg-primary/20 animate-pulse" />
            <div className="h-4 w-56 bg-muted/50 rounded animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-muted/10 p-6 animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-full bg-muted/40" />
                    <div className="flex-1 space-y-3">
                        <div className="h-5 w-2/3 bg-muted/40 rounded" />
                        <div className="h-4 w-1/3 bg-muted/30 rounded" />
                        <div className="flex gap-2">
                            <div className="h-6 w-16 bg-muted/30 rounded-full" />
                            <div className="h-6 w-20 bg-muted/30 rounded-full" />
                            <div className="h-6 w-14 bg-muted/30 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

/* ─── Score Mini-Bar ──────────────────────────────────────── */
const MiniBar = ({ label, value }: { label: string; value: number }) => (
    <div className="space-y-1">
        <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className={`font-semibold ${scoreColor(value)}`}>{value}%</span>
        </div>
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
                className={`h-full rounded-full ${value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : value >= 40 ? 'bg-orange-500' : 'bg-red-400'}`}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            />
        </div>
    </div>
);

/* ═══════════════════════════════════════════════════════════ */
/*  Main Component                                           */
/* ═══════════════════════════════════════════════════════════ */
export const JobRecommendations: React.FC<JobRecommendationsProps> = ({ jobRole, resumeText }) => {
    const [jobs, setJobs] = useState<JobMatch[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [notConfigured, setNotConfigured] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    // Filters & controls
    const [freshness, setFreshness] = useState<Freshness>('pw');
    const [sortBy, setSortBy] = useState<SortBy>('score');
    const [resultLimit, setResultLimit] = useState(10);
    const [sourcesUsed, setSourcesUsed] = useState<string[]>([]);
    const [totalFound, setTotalFound] = useState(0);

    const searchedRef = useRef(false);

    /* ── Auto-search on first render if role is set ── */
    useEffect(() => {
        if (jobRole && !searchedRef.current) {
            searchedRef.current = true;
            handleSearch();
        }
    }, []);

    const getGatewayToken = () => {
        try { return localStorage.getItem('gateway_access_token'); } catch { return null; }
    };

    const handleSearch = async () => {
        setLoading(true);
        setSearched(false);
        setErrorMessage(null);
        setNotConfigured(false);
        setExpandedIndex(null);
        try {
            const token = getGatewayToken();
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            };

            const response = await fetch('http://localhost:8000/api/job-search/search-and-match', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    query: `${jobRole} jobs`,
                    resume_text: resumeText,
                    limit: resultLimit,
                    freshness,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                const detail = String((data as any)?.detail || 'Search failed');
                const lower = detail.toLowerCase();
                const isConfigError =
                    lower.includes('api key') || lower.includes('not configured') ||
                    (response.status === 500 && (lower.includes('brave') || lower.includes('firecrawl') || lower.includes('groq')));
                if (isConfigError) {
                    setNotConfigured(true);
                    setErrorMessage(detail);
                    setJobs([]);
                    setSearched(true);
                    return;
                }
                throw new Error(detail);
            }

            setJobs(data.matches || []);
            setSourcesUsed(data.sources_used || []);
            setTotalFound(data.total_found || 0);
            setSearched(true);
        } catch (error) {
            console.error("Job search error:", error);
            setJobs([]);
            setSearched(true);
            setErrorMessage(error instanceof Error ? error.message : 'Job search failed');
        } finally {
            setLoading(false);
        }
    };

    /* ── Sort ── */
    const sortedJobs = [...jobs].sort((a, b) => {
        if (sortBy === 'score') return b.overall_score - a.overall_score;
        return 0; // 'recent' — keep server order (already by freshness)
    });

    const freshnessLabels: Record<Freshness, string> = { pd: 'Past 24h', pw: 'Past Week', pm: 'Past Month' };

    return (
        <div className="space-y-5">
            {/* ── Header + Controls ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-primary" />
                        Job Market Scanner
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Live job search across Brave & Firecrawl — matched against your resume.
                    </p>
                </div>
                <Button onClick={handleSearch} disabled={loading} className="gap-2 shrink-0">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {loading ? 'Scanning...' : 'Scan Jobs'}
                </Button>
            </div>

            {/* ── Filters Row ── */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Freshness:</span>
                </div>
                {(['pd', 'pw', 'pm'] as Freshness[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFreshness(f)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                            freshness === f
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted/20 text-muted-foreground border-transparent hover:bg-muted/40'
                        }`}
                    >
                        {freshnessLabels[f]}
                    </button>
                ))}

                <div className="w-px h-5 bg-border mx-2 hidden sm:block" />

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>Sort:</span>
                </div>
                <button
                    onClick={() => setSortBy(sortBy === 'score' ? 'recent' : 'score')}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-muted/20 border border-transparent hover:bg-muted/40 transition-all"
                >
                    {sortBy === 'score' ? '🎯 Best Match' : '🕐 Most Recent'}
                </button>
            </div>

            {/* ── Loading ── */}
            {loading && <SearchSkeleton />}

            {/* ── Config Error ── */}
            {!loading && searched && notConfigured && (
                <div className="text-center py-10 bg-muted/10 rounded-xl border border-dashed">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">Job Search not fully configured</p>
                    <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
                        {errorMessage || 'Missing API keys (BRAVE_SEARCH_API_KEY or FIRECRAWL_API_KEY). Add them to your .env file.'}
                    </p>
                </div>
            )}

            {/* ── General Error ── */}
            {!loading && searched && !notConfigured && errorMessage && (
                <div className="text-center py-10 bg-red-500/5 rounded-xl border border-dashed border-red-500/20">
                    <XCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                    <p className="text-muted-foreground">{errorMessage}</p>
                </div>
            )}

            {/* ── No Results ── */}
            {!loading && searched && !notConfigured && !errorMessage && jobs.length === 0 && (
                <div className="text-center py-10 bg-muted/10 rounded-xl border border-dashed">
                    <Globe className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground">No matching jobs found. Try a broader freshness window or different role.</p>
                </div>
            )}

            {/* ── Results Summary ── */}
            {!loading && searched && jobs.length > 0 && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-primary" /> {totalFound} jobs found</span>
                    <span>•</span>
                    <span>{jobs.length} matched</span>
                    {sourcesUsed.length > 0 && (
                        <>
                            <span>•</span>
                            <span>Sources: {sourcesUsed.filter(Boolean).join(', ')}</span>
                        </>
                    )}
                </div>
            )}

            {/* ── Job Cards ── */}
            <div className="space-y-3">
                <AnimatePresence>
                    {sortedJobs.map((job, index) => {
                        const isExpanded = expandedIndex === index;
                        return (
                            <motion.div
                                key={`${job.url}-${index}`}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ delay: index * 0.06 }}
                            >
                                <Card className={`transition-all overflow-hidden border ${scoreBg(job.overall_score)} hover:shadow-md group`}>
                                    <CardContent className="p-0">
                                        {/* ── Main Row ── */}
                                        <div
                                            className="flex items-start gap-4 p-5 cursor-pointer"
                                            onClick={() => setExpandedIndex(isExpanded ? null : index)}
                                        >
                                            {/* Score ring */}
                                            <div className="shrink-0 pt-1">
                                                <CircularScore score={job.overall_score} size="sm" showLabel={false} />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="min-w-0">
                                                        <h4 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
                                                            {job.title}
                                                        </h4>
                                                        <p className="text-sm font-medium text-muted-foreground">{job.company}</p>
                                                    </div>
                                                    <Badge variant={job.overall_score >= 75 ? "default" : "secondary"} className="shrink-0">
                                                        {job.overall_score}%
                                                    </Badge>
                                                </div>

                                                {/* Meta row */}
                                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                    {job.location && (
                                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                                                    )}
                                                    {job.salary_estimate && job.salary_estimate !== 'Unknown' && (
                                                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary_estimate}</span>
                                                    )}
                                                    {job.experience_level && (
                                                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${levelBadge(job.experience_level)}`}>
                                                            {job.experience_level}
                                                        </span>
                                                    )}
                                                    {job.posted_age && (
                                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.posted_age}</span>
                                                    )}
                                                </div>

                                                {/* Matching skills preview */}
                                                {job.matching_skills?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {job.matching_skills.slice(0, 4).map((s) => (
                                                            <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                                                                <CheckCircle2 className="w-2.5 h-2.5" />{s}
                                                            </span>
                                                        ))}
                                                        {job.matching_skills.length > 4 && (
                                                            <span className="text-[10px] text-muted-foreground px-1">+{job.matching_skills.length - 4} more</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Expand chevron */}
                                            <div className="shrink-0 pt-2 text-muted-foreground">
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </div>
                                        </div>

                                        {/* ── Expanded Detail ── */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-5 pb-5 pt-0 space-y-4 border-t border-border/50">
                                                        {/* Score bars */}
                                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                                            <MiniBar label="Skills Match" value={job.skills_match} />
                                                            <MiniBar label="Experience Match" value={job.experience_match} />
                                                        </div>

                                                        {/* AI reasoning */}
                                                        <div className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3 py-1.5 bg-primary/5 rounded-r">
                                                            "{job.reasoning}"
                                                        </div>

                                                        {/* Missing skills */}
                                                        {job.missing_skills?.length > 0 && (
                                                            <div>
                                                                <h5 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                                                                    <Target className="w-3 h-3" /> Skills Gap
                                                                </h5>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {job.missing_skills.map((s) => (
                                                                        <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-medium border border-red-500/20">
                                                                            <XCircle className="w-2.5 h-2.5" />{s}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Gap analysis */}
                                                        {job.gap_analysis && (
                                                            <div>
                                                                <h5 className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                                                                    <TrendingUp className="w-3 h-3" /> How to Qualify
                                                                </h5>
                                                                <p className="text-xs text-muted-foreground leading-relaxed">{job.gap_analysis}</p>
                                                            </div>
                                                        )}

                                                        {/* Apply button */}
                                                        <div className="pt-1">
                                                            <Button size="sm" className="gap-2 h-8" asChild>
                                                                <a href={job.url} target="_blank" rel="noopener noreferrer">
                                                                    Apply Now <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* ── Load More ── */}
            {!loading && searched && jobs.length > 0 && jobs.length >= resultLimit && (
                <div className="text-center pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setResultLimit((l) => l + 10); }}
                        className="gap-2"
                    >
                        Load More Results
                    </Button>
                </div>
            )}
        </div>
    );
};
