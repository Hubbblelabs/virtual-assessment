'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
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
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { Clock, Send, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

interface Question {
    _id: string;
    question: {
        _id: string;
        questionText: string;
        questionType?: string;
        options?: string[];
        correctAnswer?: string;
    };
    marks: number;
    order: number;
}

interface Answer {
    question: string;
    answer: string;
}

interface Test {
    _id: string;
    title: string;
    subject: { name: string };
    duration: number;
    totalMarks: number;
    questions: Question[];
    isPublished: boolean;
}

export default function TakeTestPage() {
    const params = useParams();
    const testId = params.testId as string;
    const router = useRouter();
    const { user } = useAuth();
    const [test, setTest] = useState<Test | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [testStarted, setTestStarted] = useState(false);
    const { setLabel } = useBreadcrumb();
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    useEffect(() => {
        fetchTest();
    }, [testId]);

    useEffect(() => {
        if (testStarted && timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [testStarted, timeRemaining]);

    const fetchTest = async () => {
        try {
            const response = await api.get(`/tests/${testId}`);
            const fetchedTest = response.data.test;
            setTest(fetchedTest);
            setLabel(fetchedTest._id, fetchedTest.title);

            const initialAnswers = fetchedTest.questions.map((q: Question) => ({
                question: q.question._id,
                answer: ''
            }));
            setAnswers(initialAnswers);
        } catch (error) {
            console.error('Failed to fetch test:', error);
            alert('Failed to load test details');
        } finally {
            setLoading(false);
        }
    };

    const handleStartTest = () => {
        if (test) {
            setTimeRemaining(test.duration * 60);
            setTestStarted(true);
        }
    };

    const handleAnswerChange = (questionId: string, answer: string) => {
        setAnswers((prev) =>
            prev.map((a) =>
                a.question === questionId ? { ...a, answer } : a
            )
        );
    };

    const handleSubmit = async () => {
        if (!test) return;

        setSubmitting(true);
        try {
            await api.post('/submissions', {
                testId: test._id,
                answers: answers,
                timeTaken: (test.duration * 60) - timeRemaining
            });
            alert('Test submitted successfully!');
            router.push('/tests');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            alert(err.response?.data?.message || 'Failed to submit test');
        } finally {
            setSubmitting(false);
            setConfirmDialogOpen(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-pulse">Loading test...</div>
            </div>
        );
    }

    if (!test) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Test not found</p>
            </div>
        );
    }

    if (!testStarted) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{test.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p><strong>Subject:</strong> {test.subject?.name}</p>
                        <p><strong>Duration:</strong> {test.duration} minutes</p>
                        <p><strong>Total Marks:</strong> {test.totalMarks}</p>
                        <p><strong>Questions:</strong> {test.questions.length}</p>
                        <div className="border-t pt-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                Once you start, the timer will begin. Make sure you have stable internet.
                            </p>
                            <Button onClick={handleStartTest} className="w-full">
                                Start Test
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const sortedQuestions = [...test.questions].sort((a, b) => a.order - b.order);

    return (
        <div className="space-y-6">
            {/* Timer Header */}
            <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center justify-between">
                <h1 className="text-xl font-bold">{test.title}</h1>
                <div className={`flex items-center gap-2 text-lg font-mono ${timeRemaining < 300 ? 'text-red-600' : ''}`}>
                    <Clock className="h-5 w-5" />
                    {formatTime(timeRemaining)}
                </div>
            </div>

            {/* Questions */}
            <div className="space-y-6 max-w-3xl mx-auto">
                {sortedQuestions.map((item, index) => (
                    <Card key={item._id}>
                        <CardHeader>
                            <CardTitle className="flex justify-between">
                                <span>Question {index + 1}</span>
                                <span className="text-sm font-normal text-muted-foreground">{item.marks} marks</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div dangerouslySetInnerHTML={{ __html: item.question.questionText }} />

                            {item.question.questionType === 'multiple-choice' && item.question.options ? (
                                <div className="space-y-2">
                                    {item.question.options.map((option, optIndex) => (
                                        <label key={optIndex} className="flex items-center gap-2 p-2 rounded border hover:bg-muted cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`question-${item.question._id}`}
                                                value={option}
                                                checked={answers.find(a => a.question === item.question._id)?.answer === option}
                                                onChange={(e) => handleAnswerChange(item.question._id, e.target.value)}
                                            />
                                            {option}
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <Textarea
                                    placeholder="Enter your answer..."
                                    value={answers.find(a => a.question === item.question._id)?.answer || ''}
                                    onChange={(e) => handleAnswerChange(item.question._id, e.target.value)}
                                    rows={4}
                                />
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Submit Button */}
            <div className="max-w-3xl mx-auto">
                <Button
                    onClick={() => setConfirmDialogOpen(true)}
                    className="w-full"
                    size="lg"
                    disabled={submitting}
                >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? 'Submitting...' : 'Submit Test'}
                </Button>
            </div>

            <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Submit Test</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to submit this test? You cannot undo this action.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
