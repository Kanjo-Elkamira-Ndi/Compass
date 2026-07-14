import React, { useState, useEffect } from 'react';
import {
  GripVertical, Sparkles, Save, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState, ErrorState } from '@/components/shared/states';
import { getCourses, generateExam } from '@/api/client';
import type { ExamQuestion, ExamConfig, QuestionType, Difficulty, Course } from '@/types';
import { toast } from 'sonner';

const difficultyColors: Record<string, string> = {
  easy: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  hard: 'bg-destructive/10 text-destructive border-destructive/20',
};

const typeLabels: Record<QuestionType, string> = {
  mcq: 'MCQ',
  'short-answer': 'Short Answer',
  essay: 'Essay',
  'true-false': 'True/False',
};

function SortableQuestion({
  question,
  index,
  onQuestionChange,
}: {
  question: ExamQuestion;
  index: number;
  onQuestionChange: (id: string, field: string, value: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2">
      {/* Drag handle */}
      <button
        className="mt-3 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder question ${index + 1}`}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <Card className="flex-1">
        <CardContent className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold">Q{index + 1}</span>
            <Badge variant="outline" className="text-xs">{typeLabels[question.type]}</Badge>
            <Badge className={`text-xs ${difficultyColors[question.difficulty]}`}>
              {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
            </Badge>
            <Badge variant="secondary" className="text-xs">{question.points} pts</Badge>
          </div>

          {/* Editable question text */}
          <Textarea
            value={question.question}
            onChange={e => onQuestionChange(question.id, 'question', e.target.value)}
            className="min-h-[60px] text-sm"
            aria-label={`Question ${index + 1} text`}
          />

          {/* MCQ Options */}
          {question.type === 'mcq' && question.options && (
            <RadioGroup
              value={question.options.find(o => o.isCorrect)?.label || ''}
              className="space-y-2"
              aria-label={`Question ${index + 1} options`}
            >
              {question.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.label} id={`${question.id}-opt-${oi}`} disabled />
                  <Label htmlFor={`${question.id}-opt-${oi}`} className="text-sm flex-1">
                    {opt.label}. {opt.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* True/False */}
          {question.type === 'true-false' && (
            <RadioGroup
              value={question.answer || ''}
              className="flex gap-4"
              aria-label={`Question ${index + 1} true/false`}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="True" id={`${question.id}-true`} disabled />
                <Label htmlFor={`${question.id}-true`}>True</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="False" id={`${question.id}-false`} disabled />
                <Label htmlFor={`${question.id}-false`}>False</Label>
              </div>
            </RadioGroup>
          )}

          {/* Short Answer / Essay placeholder */}
          {(question.type === 'short-answer' || question.type === 'essay') && (
            <Textarea
              placeholder={question.type === 'short-answer' ? 'Expected short answer...' : 'Expected essay response...'}
              value={question.answer || ''}
              onChange={e => onQuestionChange(question.id, 'answer', e.target.value)}
              className="min-h-[44px] text-sm"
              disabled
              aria-label={`Question ${index + 1} answer`}
            />
          )}

          {/* Explanation (collapsible) */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown className="h-3.5 w-3.5" />
              Show Explanation
              <ChevronUp className="h-3.5 w-3.5" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="text-sm text-muted-foreground mt-2 pl-1 border-l-2 border-ai/30">
                {question.explanation}
              </p>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}

export function AIExamGenerator() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [topic, setTopic] = useState('');
  const [courseId, setCourseId] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(['mcq']);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const res = await getCourses();
      setCourses(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const handleTypeToggle = (type: QuestionType) => {
    setQuestionTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleGenerate = async () => {
    if (!topic || questionTypes.length === 0) return;
    setIsGenerating(true);
    setError(null);
    try {
      const config: ExamConfig = {
        topic,
        courseId,
        difficulty,
        questionCount,
        questionTypes,
      };
      const res = await generateExam(config);
      setQuestions(res.data);
      toast.success('Exam generated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate exam');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setQuestions(prev => {
        const oldIndex = prev.findIndex(q => q.id === active.id);
        const newIndex = prev.findIndex(q => q.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleQuestionChange = (id: string, field: string, value: string) => {
    setQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleSave = () => {
    toast.success('Exam saved successfully!');
  };

  const typeOptions: { value: QuestionType; label: string }[] = [
    { value: 'mcq', label: 'Multiple Choice' },
    { value: 'short-answer', label: 'Short Answer' },
    { value: 'essay', label: 'Essay' },
    { value: 'true-false', label: 'True / False' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-ai" />
            <CardTitle className="text-lg">AI Exam Generator</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exam-topic">Topic</Label>
              <Input
                id="exam-topic"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g., Data Structures and Algorithms"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exam-course">Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger id="exam-course">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <RadioGroup
                value={difficulty}
                onValueChange={v => setDifficulty(v as Difficulty)}
                className="flex gap-4"
              >
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                  <div key={d} className="flex items-center gap-1.5">
                    <RadioGroupItem value={d} id={`diff-${d}`} />
                    <Label htmlFor={`diff-${d}`} className="capitalize">{d}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exam-count">Question Count (1-20)</Label>
              <Input
                id="exam-count"
                type="number"
                min={1}
                max={20}
                value={questionCount}
                onChange={e => setQuestionCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Question Types</Label>
            <div className="flex flex-wrap gap-4">
              {typeOptions.map(opt => (
                <div key={opt.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`type-${opt.value}`}
                    checked={questionTypes.includes(opt.value)}
                    onCheckedChange={() => handleTypeToggle(opt.value)}
                  />
                  <Label htmlFor={`type-${opt.value}`} className="text-sm">{opt.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !topic || questionTypes.length === 0}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Exam
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Questions */}
      {questions.length > 0 && (
        <>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <SortableQuestion
                    key={q.id}
                    question={q}
                    index={i}
                    onQuestionChange={handleQuestionChange}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Exam
            </Button>
          </div>
        </>
      )}

      {!isGenerating && questions.length === 0 && !error && (
        <div className="text-center py-12 text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Configure the exam above and click Generate to create questions.</p>
        </div>
      )}
    </div>
  );
}