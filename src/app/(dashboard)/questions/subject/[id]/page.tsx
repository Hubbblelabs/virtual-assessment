'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { QuestionListSkeleton } from "@/components/skeletons";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Trash2, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

// Define strict interfaces
interface Question {
    _id: string;
    questionText: string;
    questionType: string;
    marks: number;
    difficultyLevel: 'easy' | 'medium' | 'hard';
    chapter: string;
    topic?: string;
    options?: string[];
    correctAnswer?: string;
}

interface Subject {
    _id: string;
    name: string;
}

export default function SubjectQuestionsPage() {
    const params = useParams();
    const router = useRouter();
    const subjectId = params.id as string;

    const [questions, setQuestions] = useState<Question[]>([]);
    const [subject, setSubject] = useState<Subject | null>(null);
    const [loading, setLoading] = useState(true);

    // Delete State
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Filter & Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [difficultyFilter, setDifficultyFilter] = useState('all');

    useEffect(() => {
        if (subjectId) {
            fetchData();
        }
    }, [subjectId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [subjectRes, questionsRes] = await Promise.all([
                api.get(`/subjects/${subjectId}`),
                api.get(`/questions?subject=${subjectId}`)
            ]);

            setSubject(subjectRes.data);
            setQuestions(questionsRes.data.questions);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load questions');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setQuestionToDelete(id);
        setDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!questionToDelete) return;

        try {
            setDeleting(true);
            await api.delete(`/questions/${questionToDelete}`);
            toast.success('Question deleted successfully');
            setDeleteOpen(false);
            setQuestionToDelete(null);
            fetchData(); // Refresh list
        } catch (error: any) {
            console.error('Failed to delete question:', error);
            if (error.response?.status === 409 && error.response?.data?.dependencies) {
                toast.error(`Cannot delete: ${error.response.data.dependencies[0]}`);
            } else {
                toast.error('Failed to delete question');
            }
        } finally {
            setDeleting(false);
        }
    };

    const getDifficultyColor = (level: string) => {
        switch (level) {
            case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
            case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.questionText.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || q.questionType === typeFilter;
        const matchesDifficulty = difficultyFilter === 'all' || q.difficultyLevel === difficultyFilter;
        return matchesSearch && matchesType && matchesDifficulty;
    });

    // Get unique question types for the filter
    const questionTypes = Array.from(new Set(questions.map(q => q.questionType)));

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4 h-10">
                    <div className="h-10 w-10 rounded-md bg-muted animate-pulse" />
                    <div className="ml-auto h-10 w-32 rounded-md bg-muted animate-pulse" />
                </div>
                <QuestionListSkeleton />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="ml-auto">
                        <Button onClick={() => router.push(`/questions/create?subject=${subjectId}`)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Question
                        </Button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search questions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {questionTypes.map(type => (
                                    <SelectItem key={type} value={type} className="capitalize">
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="All Difficulties" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Difficulties</SelectItem>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {questions.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-10">
                            <p className="text-muted-foreground mb-4">No questions found for this subject.</p>
                            <Button onClick={() => router.push(`/questions/create?subject=${subjectId}`)}>
                                Create First Question
                            </Button>
                        </CardContent>
                    </Card>
                ) : filteredQuestions.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-10">
                            <p className="text-muted-foreground">No questions match your filters.</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredQuestions.map((question) => (
                        <Card key={question._id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3 bg-muted/30 border-b">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <Badge variant="outline" className="capitalize bg-background">
                                                {question.questionType}
                                            </Badge>
                                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize border ${getDifficultyColor(question.difficultyLevel)}`}>
                                                {question.difficultyLevel}
                                            </span>
                                            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-secondary text-secondary-foreground border border-secondary">
                                                {question.marks} Marks
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive h-8 w-8"
                                        onClick={() => handleDeleteClick(question._id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="mb-3">
                                    <p className="text-sm font-medium leading-relaxed">{question.questionText}</p>
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground bg-muted/20 p-2 rounded-md">
                                    {question.chapter && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-semibold text-foreground">Chapter:</span>
                                            <span>{question.chapter}</span>
                                        </div>
                                    )}
                                    {question.topic && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-semibold text-foreground">Topic:</span>
                                            <span>{question.topic}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Question</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this question? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleting}
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
