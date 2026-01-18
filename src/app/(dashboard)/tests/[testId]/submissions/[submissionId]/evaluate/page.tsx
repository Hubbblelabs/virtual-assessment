'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { toast } from 'sonner';
import { Save, ArrowLeft, CheckCircle } from 'lucide-react';

interface Answer {
    question: {
        _id: string;
        questionText: string;
        correctAnswer?: string;
    };
    answer: string;
    marksObtained?: number;
    remarks?: string;
}

interface Submission {
    _id: string;
    test: {
        _id: string;
        title: string;
        totalMarks: number;
    };
    student: {
        name: string;
        email: string;
    };
    answers: Answer[];
    totalMarksObtained?: number;
    status: string;
}

export default function EvaluatePage() {
    const params = useParams();
    const testId = params.testId as string;
    const submissionId = params.submissionId as string;
    const router = useRouter();
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [evaluations, setEvaluations] = useState<{ [key: string]: { marks: number; remarks: string } }>({});
    const { setLabel } = useBreadcrumb();

    useEffect(() => {
        fetchSubmission();
    }, [submissionId]);

    const fetchSubmission = async () => {
        try {
            const response = await api.get(`/submissions/${submissionId}`);
            const sub = response.data.submission;
            setSubmission(sub);
            setLabel(submissionId, `Evaluate - ${sub.student?.name}`);

            // Initialize evaluations
            const initialEvals: { [key: string]: { marks: number; remarks: string } } = {};
            sub.answers.forEach((ans: Answer) => {
                initialEvals[ans.question._id] = {
                    marks: ans.marksObtained || 0,
                    remarks: ans.remarks || ''
                };
            });
            setEvaluations(initialEvals);
        } catch (error) {
            console.error('Failed to fetch submission:', error);
            toast.error('Failed to load submission');
        } finally {
            setLoading(false);
        }
    };

    const handleMarksChange = (questionId: string, marks: number) => {
        setEvaluations(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], marks }
        }));
    };

    const handleRemarksChange = (questionId: string, remarks: string) => {
        setEvaluations(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], remarks }
        }));
    };

    const handleSave = async () => {
        if (!submission) return;

        setSaving(true);
        try {
            const updatedAnswers = submission.answers.map(ans => ({
                question: ans.question._id,
                answer: ans.answer,
                marksObtained: evaluations[ans.question._id]?.marks || 0,
                remarks: evaluations[ans.question._id]?.remarks || ''
            }));

            const totalMarksObtained = Object.values(evaluations).reduce((sum, e) => sum + (e.marks || 0), 0);

            await api.put(`/submissions/${submissionId}`, {
                answers: updatedAnswers,
                totalMarksObtained
            });

            toast.success('Evaluation saved successfully');
            router.push(`/tests/${testId}/submissions`);
        } catch (error) {
            console.error('Failed to save evaluation:', error);
            toast.error('Failed to save evaluation');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-pulse">Loading submission...</div>
            </div>
        );
    }

    if (!submission) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Submission not found</p>
            </div>
        );
    }

    const totalMarks = Object.values(evaluations).reduce((sum, e) => sum + (e.marks || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end">
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Score</p>
                        <p className="text-2xl font-bold">{totalMarks} / {submission.test?.totalMarks}</p>
                    </div>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Evaluation'}
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {submission.answers.map((answer, index) => (
                    <Card key={answer.question._id}>
                        <CardHeader>
                            <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="prose dark:prose-invert max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: answer.question.questionText }} />
                            </div>

                            <div className="bg-muted/50 p-4 rounded-lg">
                                <Label className="text-sm font-medium">Student&apos;s Answer</Label>
                                <p className="mt-1 whitespace-pre-wrap">{answer.answer || 'No answer provided'}</p>
                            </div>

                            {answer.question.correctAnswer && (
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                    <Label className="text-sm font-medium text-green-700 dark:text-green-400">Correct Answer</Label>
                                    <p className="mt-1 text-green-800 dark:text-green-300 whitespace-pre-wrap">
                                        {answer.question.correctAnswer}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor={`marks-${answer.question._id}`}>Marks Obtained</Label>
                                    <Input
                                        id={`marks-${answer.question._id}`}
                                        type="number"
                                        min="0"
                                        value={evaluations[answer.question._id]?.marks || 0}
                                        onChange={(e) => handleMarksChange(answer.question._id, parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor={`remarks-${answer.question._id}`}>Remarks</Label>
                                    <Textarea
                                        id={`remarks-${answer.question._id}`}
                                        value={evaluations[answer.question._id]?.remarks || ''}
                                        onChange={(e) => handleRemarksChange(answer.question._id, e.target.value)}
                                        placeholder="Optional feedback"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Complete Evaluation'}
                </Button>
            </div>
        </div>
    );
}
