'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Trash2, Check, X, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FormTopic {
    id: string;
    name: string;
}

interface FormChapter {
    id: string;
    name: string;
    topics: FormTopic[];
}

interface SortableChapterItemProps {
    id: string;
    chapter: FormChapter;
    chapterIndex: number;
    subjectId: string;
    editingChapterIndex: number | null;
    editingChapterValue: string;
    setEditingChapterValue: (value: string) => void;
    handleSaveChapter: (subjectId: string, chapterIndex: number, topics: FormTopic[]) => void;
    setEditingChapterIndex: (index: number | null) => void;
    toggleExpandChapter: (subjectId: string, chapterIndex: number) => void;
    handleStartEditChapter: (chapterIndex: number, name: string) => void;
    handleDeleteChapter: (subjectId: string, chapterIndex: number) => void;
    expandedChapter: { subjectId: string; chapterIndex: number } | null;
    children?: React.ReactNode;
}

export function SortableChapterItem({
    id,
    chapter,
    chapterIndex,
    subjectId,
    editingChapterIndex,
    editingChapterValue,
    setEditingChapterValue,
    handleSaveChapter,
    setEditingChapterIndex,
    toggleExpandChapter,
    handleStartEditChapter,
    handleDeleteChapter,
    children
}: SortableChapterItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="border rounded-md bg-card mb-2">
            <div className="flex items-center gap-2 p-2.5">
                <div {...attributes} {...listeners} className="cursor-move text-muted-foreground hover:text-foreground">
                    <GripVertical className="h-4 w-4" />
                </div>
                {editingChapterIndex === chapterIndex ? (
                    <>
                        <Input
                            value={editingChapterValue}
                            onChange={(e) => setEditingChapterValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveChapter(subjectId, chapterIndex, chapter.topics);
                                if (e.key === 'Escape') setEditingChapterIndex(null);
                            }}
                            className="flex-1 h-8"
                            autoFocus
                        />
                        <Button
                            size="sm"
                            onClick={() => handleSaveChapter(subjectId, chapterIndex, chapter.topics)}
                            className="h-8 px-2"
                        >
                            <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingChapterIndex(null)}
                            className="h-8 px-2"
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{chapter.name}</span>
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                    {chapter.topics.length} topic{chapter.topics.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleExpandChapter(subjectId, chapterIndex)}
                            className="h-7 w-7 p-0"
                            title="View topics"
                        >
                            <List className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEditChapter(chapterIndex, chapter.name)}
                            className="h-7 w-7 p-0"
                        >
                            <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteChapter(subjectId, chapterIndex)}
                            className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </>
                )}
            </div>
            {children}
        </div>
    );
}

interface SortableTopicItemProps {
    id: string;
    topic: string;
    topicIndex: number;
    chapterIndex: number;
    subjectId: string;
    editingTopic: { chapterIndex: number; topicIndex: number } | null;
    editingTopicValue: string;
    setEditingTopicValue: (value: string) => void;
    handleSaveTopic: (subjectId: string, chapterIndex: number, topicIndex: number) => void;
    setEditingTopic: (value: { chapterIndex: number; topicIndex: number } | null) => void;
    handleStartEditTopic: (chapterIndex: number, topicIndex: number, topic: string) => void;
    handleDeleteTopic: (subjectId: string, chapterIndex: number, topicIndex: number) => void;
}

export function SortableTopicItem({
    id,
    topic,
    topicIndex,
    chapterIndex,
    subjectId,
    editingTopic,
    editingTopicValue,
    setEditingTopicValue,
    handleSaveTopic,
    setEditingTopic,
    handleStartEditTopic,
    handleDeleteTopic
}: SortableTopicItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-1.5 bg-card p-1.5 rounded text-xs border mb-1.5">
            <div {...attributes} {...listeners} className="cursor-move text-muted-foreground hover:text-foreground">
                <GripVertical className="h-3 w-3" />
            </div>
            {editingTopic?.chapterIndex === chapterIndex &&
                editingTopic?.topicIndex === topicIndex ? (
                <>
                    <Input
                        value={editingTopicValue}
                        onChange={(e) => setEditingTopicValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTopic(subjectId, chapterIndex, topicIndex);
                            if (e.key === 'Escape') setEditingTopic(null);
                        }}
                        className="flex-1 h-6 text-xs"
                        autoFocus
                    />
                    <Button
                        size="sm"
                        onClick={() => handleSaveTopic(subjectId, chapterIndex, topicIndex)}
                        className="h-6 px-1.5"
                    >
                        <Check className="h-3 w-3" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingTopic(null)}
                        className="h-6 px-1.5"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </>
            ) : (
                <>
                    <span className="flex-1">{topic}</span>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEditTopic(chapterIndex, topicIndex, topic)}
                        className="h-6 w-6 p-0"
                    >
                        <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTopic(subjectId, chapterIndex, topicIndex)}
                        className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </>
            )}
        </div>
    );
}
