'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
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

    const getDifficultyColor = (level: string) => {
        switch (level) {
            case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
            case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-2 text-muted-foreground">Loading questions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
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
                ) : (
                    questions.map((question) => (
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
                                    {/* Actions could go here */}
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
        </div>
    );
}
