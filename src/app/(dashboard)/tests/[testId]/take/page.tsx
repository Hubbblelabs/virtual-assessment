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
import { Clock, Send, AlertCircle, CheckCircle, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

interface Attachment {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
}

interface Question {
    _id: string;
    question: {
        _id: string;
        questionText: string;
        questionType?: string;
        options?: string[];
        correctAnswer?: string;
        attachments?: Attachment[];
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
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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

            // Check for existing pending submission (test already in progress)
            try {
                const submissionsResponse = await api.get('/submissions', {
                    params: { test: testId, status: 'pending' }
                });
                const pendingSubmissions = submissionsResponse.data.submissions || [];
                const pendingSubmission = pendingSubmissions.find((s: any) =>
                    (s.test === testId || s.test?._id === testId) && s.status === 'pending'
                );

                if (pendingSubmission) {
                    // Resume the test - calculate remaining time
                    const startTime = new Date(pendingSubmission.createdAt).getTime();
                    const now = Date.now();
                    const elapsedSeconds = Math.floor((now - startTime) / 1000);
                    const remainingTime = Math.max(0, (fetchedTest.duration * 60) - elapsedSeconds);

                    if (remainingTime > 0) {
                        // Restore answers if any
                        if (pendingSubmission.answers && pendingSubmission.answers.length > 0) {
                            const restoredAnswers = initialAnswers.map((a: Answer) => {
                                const savedAnswer = pendingSubmission.answers.find(
                                    (pa: any) => pa.question === a.question || pa.question?._id === a.question
                                );
                                return savedAnswer ? { ...a, answer: savedAnswer.answerText || '' } : a;
                            });
                            setAnswers(restoredAnswers);
                        }

                        setTimeRemaining(remainingTime);
                        setTestStarted(true);
                    }
                }
            } catch (subError) {
                console.error('Failed to check for pending submission:', subError);
                // Non-fatal error, continue with normal flow
            }
        } catch (error) {
            console.error('Failed to fetch test:', error);
            alert('Failed to load test details');
        } finally {
            setLoading(false);
        }
    };

    const handleStartTest = async () => {
        if (!test) return;

        try {
            // Call the start endpoint to create a pending submission
            await api.post(`/tests/${test._id}/start`);

            setTimeRemaining(test.duration * 60);
            setTestStarted(true);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            alert(err.response?.data?.message || 'Failed to start test');
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

    const goToNextQuestion = () => {
        if (test && currentQuestionIndex < test.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const goToPreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const goToQuestion = (index: number) => {
        setCurrentQuestionIndex(index);
    };

    const isQuestionAnswered = (questionId: string) => {
        const answer = answers.find(a => a.question === questionId);
        return answer && answer.answer.trim() !== '';
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

    const renderQuestionText = (text: string, attachments?: Attachment[]) => {
        if (!text) return null;

        // Split by the attachment pattern
        const parts = text.split(/({{attachment:\d+}})/g);

        return (
            <div className="prose dark:prose-invert max-w-none text-foreground">
                {parts.map((part, index) => {
                    const match = part.match(/{{attachment:(\d+)}}/);
                    if (match) {
                        const attachmentIndex = parseInt(match[1]);
                        if (attachments && attachments[attachmentIndex]) {
                            return (
                                <img
                                    key={index}
                                    src={attachments[attachmentIndex].fileUrl}
                                    alt={`Attachment ${attachmentIndex + 1}`}
                                    className="max-w-full max-h-[500px] w-auto h-auto object-contain rounded-lg my-4 border block"
                                />
                            );
                        }
                        return null;
                    }
                    // Render regular text
                    return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
                })}
            </div>
        );
    };

    const sortedQuestions = [...test.questions].sort((a, b) => a.order - b.order);
    const currentQuestion = sortedQuestions[currentQuestionIndex];
    const answeredCount = sortedQuestions.filter(q => isQuestionAnswered(q.question._id)).length;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Question Container - Left Side */}
                <div className="lg:col-span-9 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex justify-between">
                                <span>Question {currentQuestionIndex + 1} of {sortedQuestions.length}</span>
                                <span className="text-sm font-normal text-muted-foreground">{currentQuestion.marks} marks</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {renderQuestionText(currentQuestion.question.questionText, currentQuestion.question.attachments)}

                            {currentQuestion.question.questionType === 'multiple-choice' && currentQuestion.question.options ? (
                                <div className="space-y-2">
                                    {currentQuestion.question.options.map((option, optIndex) => (
                                        <label key={optIndex} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors">
                                            <input
                                                type="radio"
                                                name={`question-${currentQuestion.question._id}`}
                                                value={option}
                                                checked={answers.find(a => a.question === currentQuestion.question._id)?.answer === option}
                                                onChange={(e) => handleAnswerChange(currentQuestion.question._id, e.target.value)}
                                                className="w-4 h-4"
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : currentQuestion.question.questionType === 'true-false' ? (
                                <div className="space-y-2">
                                    {['True', 'False'].map((option, optIndex) => (
                                        <label key={optIndex} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors">
                                            <input
                                                type="radio"
                                                name={`question-${currentQuestion.question._id}`}
                                                value={option}
                                                checked={answers.find(a => a.question === currentQuestion.question._id)?.answer === option}
                                                onChange={(e) => handleAnswerChange(currentQuestion.question._id, e.target.value)}
                                                className="w-4 h-4"
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <Textarea
                                    placeholder="Enter your answer..."
                                    value={answers.find(a => a.question === currentQuestion.question._id)?.answer || ''}
                                    onChange={(e) => handleAnswerChange(currentQuestion.question._id, e.target.value)}
                                    rows={6}
                                    className="text-base"
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between gap-4">
                        <Button
                            variant="outline"
                            onClick={goToPreviousQuestion}
                            disabled={currentQuestionIndex === 0}
                            className="gap-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>

                        <div className="flex items-center gap-2">
                            {currentQuestionIndex === sortedQuestions.length - 1 ? (
                                <Button
                                    onClick={() => setConfirmDialogOpen(true)}
                                    disabled={submitting}
                                    className="gap-2 bg-green-600 hover:bg-green-700"
                                >
                                    <Send className="h-4 w-4" />
                                    {submitting ? 'Submitting...' : 'Submit Test'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={goToNextQuestion}
                                    className="gap-2"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Test Info, Timer & Questions */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Test Info & Timer Card */}
                    <Card className="sticky top-4">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">{test.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Timer */}
                            <div className={`flex items-center justify-center gap-2 text-2xl font-mono p-3 rounded-lg ${timeRemaining < 300 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-muted'}`}>
                                <Clock className="h-6 w-6" />
                                {formatTime(timeRemaining)}
                            </div>

                            {/* Progress */}
                            <div className="text-center text-sm text-muted-foreground">
                                {answeredCount}/{sortedQuestions.length} answered
                            </div>

                            {/* Question Navigation */}
                            <div className="pt-4 border-t">
                                <p className="text-sm font-medium mb-3">Questions</p>
                                <div className="grid grid-cols-5 gap-2">
                                    {sortedQuestions.map((q, index) => {
                                        const isAnswered = isQuestionAnswered(q.question._id);
                                        const isCurrent = index === currentQuestionIndex;
                                        return (
                                            <button
                                                key={q._id}
                                                onClick={() => goToQuestion(index)}
                                                className={`
                                                    w-9 h-9 rounded-lg text-sm font-medium transition-all
                                                    ${isCurrent
                                                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                                                        : isAnswered
                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
                                                            : 'bg-muted hover:bg-muted/80 border border-border'
                                                    }
                                                `}
                                            >
                                                {index + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="pt-4 border-t space-y-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700" />
                                    <span>Answered</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className="w-4 h-4 rounded bg-muted border border-border" />
                                    <span>Not Answered</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className="w-4 h-4 rounded bg-primary" />
                                    <span>Current</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Submit Test</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to submit this test? You have answered {answeredCount} out of {sortedQuestions.length} questions.
                            {answeredCount < sortedQuestions.length && (
                                <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">
                                    ⚠️ You still have {sortedQuestions.length - answeredCount} unanswered question(s).
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">Submit</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
