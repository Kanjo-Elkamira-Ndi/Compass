import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, FileText, AlertTriangle, ArrowRight, CheckCircle2, Clock,
  Sparkles, FileUp, Inbox, Trash2, Send, Bot, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ErrorState, EmptyState, LoadingState } from '@/components/shared/states';
import {
  getResearchUploads, uploadResearchDocument,
  researchChat, deleteResearchUpload,
} from '@/api/client';
import type { ResearchUpload, ResearchResult, ResearchChatMessage } from '@/types';
import { format } from 'date-fns';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const statusBadge: Record<string, { label: string; cls: string }> = {
  uploading: { label: 'Uploading', cls: 'bg-primary/10 text-primary border-primary/20' },
  processing: { label: 'Processing', cls: 'bg-warning/10 text-warning border-warning/20' },
  completed: { label: 'Completed', cls: 'bg-success/10 text-success border-success/20' },
  failed: { label: 'Failed', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function AIResearch() {
  const [uploads, setUploads] = useState<ResearchUpload[]>([]);
  const [selectedUpload, setSelectedUpload] = useState<ResearchUpload | null>(null);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [isLoadingUploads, setIsLoadingUploads] = useState(true);
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatMessages, setChatMessages] = useState<ResearchChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadUploads = useCallback(async () => {
    setIsLoadingUploads(true);
    setError(null);
    try {
      const res = await getResearchUploads();
      setUploads(res.data);
      const completed = res.data.find(u => u.status === 'completed' && u.result);
      if (completed) {
        setSelectedUpload(completed);
        setResult(completed.result || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load uploads');
    } finally {
      setIsLoadingUploads(false);
    }
  }, []);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  const handleFileSelect = async (file: File) => {
    if (file.type !== 'application/pdf') {
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const uploadRes = await uploadResearchDocument(file);
      const newUpload: ResearchUpload = {
        ...uploadRes.data,
        status: 'completed',
        progress: 100,
      };
      setUploads(prev => [newUpload, ...prev]);
      setSelectedUpload(newUpload);
      setResult(newUpload.result || null);
      setChatMessages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectUpload = async (upload: ResearchUpload) => {
    setSelectedUpload(upload);
    setChatMessages([]);
    if (upload.result) {
      setResult(upload.result);
    } else if (upload.status === 'completed') {
      setIsLoadingResult(true);
      try {
        const res = await getResearchUploads();
        const updated = res.data.find(u => u.id === upload.id);
        if (updated?.result) {
          setResult(updated.result);
          setUploads(prev => prev.map(u => u.id === upload.id ? updated : u));
        }
      } catch {
        setResult(null);
      } finally {
        setIsLoadingResult(false);
      }
    } else {
      setResult(null);
    }
  };

  const handleDelete = async (uploadId: string) => {
    try {
      await deleteResearchUpload(uploadId);
      setUploads(prev => prev.filter(u => u.id !== uploadId));
      if (selectedUpload?.id === uploadId) {
        setSelectedUpload(null);
        setResult(null);
        setChatMessages([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !selectedUpload || isChatting) return;
    const question = chatInput.trim();
    setChatInput('');

    const userMsg: ResearchChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: question,
    };
    setChatMessages(prev => [...prev, userMsg]);

    setIsChatting(true);
    try {
      const res = await researchChat(selectedUpload.id, question);
      const answer = res.data?.answer || 'No response received.';
      const assistantMsg: ResearchChatMessage = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: answer,
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg: ResearchChatMessage = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: 'Sorry, I could not process your question. Please try again.',
      };
      setChatMessages(prev => [...prev, errMsg]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-4rem)]">
      {/* Left Panel */}
      <div className="w-full lg:w-96 shrink-0 flex flex-col gap-4 lg:h-full">
        {/* Upload Zone */}
        <Card>
          <CardContent className="p-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-ai bg-ai/5'
                  : 'border-border hover:border-ai/50 hover:bg-accent/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileInputChange}
                aria-label="Upload PDF file"
              />
              {isUploading ? (
                <div className="space-y-3">
                  <FileUp className="h-8 w-8 text-ai mx-auto animate-pulse" />
                  <p className="text-sm font-medium">Uploading...</p>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Drop PDF here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF files only</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upload History */}
        <Card className="flex-1 min-h-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upload History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingUploads ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : uploads.length === 0 ? (
              <div className="p-4">
                <p className="text-sm text-muted-foreground text-center">No uploads yet</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[calc(100vh-20rem)] custom-scrollbar">
                <div className="p-2 space-y-1">
                  {uploads.map(upload => {
                    const st = statusBadge[upload.status] || statusBadge.uploading;
                    return (
                      <div key={upload.id} className="flex items-center gap-2">
                        <button
                          onClick={() => handleSelectUpload(upload)}
                          className={`flex-1 min-w-0 text-left px-3 py-2.5 rounded-md text-sm transition-colors hover:bg-accent flex items-center gap-3 ${
                            selectedUpload?.id === upload.id ? 'bg-accent' : ''
                          }`}
                        >
                          <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-xs">{upload.fileName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-muted-foreground">
                                {formatFileSize(upload.fileSize)}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {upload.uploadedAt ? format(new Date(upload.uploadedAt), 'MMM d') : 'N/A'}
                              </span>
                            </div>
                          </div>
                          <Badge className={`text-[10px] shrink-0 ${st.cls}`}>{st.label}</Badge>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(upload.id); }}
                          className="shrink-0 p-2 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                          title="Delete this upload"
                          aria-label="Delete upload"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {error && <ErrorState message={error} onRetry={loadUploads} />}

        {!selectedUpload && !error && (
          <EmptyState
            icon={<Inbox className="h-12 w-12 text-muted-foreground" />}
            title="Upload a PDF to get started"
            description="Upload a research document to receive an AI-powered analysis including summary, key findings, research gaps, and future work recommendations."
          />
        )}

        {isLoadingResult && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        )}

        {result && !isLoadingResult && selectedUpload && (
          <Card className="flex-1 min-h-0">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-ai" />
                <CardTitle className="text-lg">Research Analysis</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">{selectedUpload.fileName}</p>
            </CardHeader>
            <CardContent className="pb-4">
              <Tabs defaultValue="summary">
                <TabsList className="mb-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="findings">Key Findings</TabsTrigger>
                  <TabsTrigger value="gaps">Research Gaps</TabsTrigger>
                  <TabsTrigger value="future">Future Work</TabsTrigger>
                  <TabsTrigger value="chat">Q&A Chat</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="mt-0">
                  <ScrollArea className="max-h-[calc(100vh-22rem)] custom-scrollbar">
                    <p className="text-sm leading-relaxed text-foreground/90">{result.summary}</p>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="findings" className="mt-0">
                  <ScrollArea className="max-h-[calc(100vh-22rem)] custom-scrollbar">
                    <ul className="space-y-2">
                      {result.keyFindings.map((finding, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="gaps" className="mt-0">
                  <ScrollArea className="max-h-[calc(100vh-22rem)] custom-scrollbar">
                    <ul className="space-y-2">
                      {result.researchGaps.map((gap, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="future" className="mt-0">
                  <ScrollArea className="max-h-[calc(100vh-22rem)] custom-scrollbar">
                    <ul className="space-y-2">
                      {result.futureWork.map((work, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <ArrowRight className="h-4 w-4 text-ai mt-0.5 shrink-0" />
                          <span>{work}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="chat" className="mt-0">
                  <div className="flex flex-col h-[calc(100vh-26rem)]">
                    <ScrollArea className="flex-1 pr-2 custom-scrollbar">
                      {chatMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                          <p>Ask a question about this document</p>
                        </div>
                      ) : (
                        <div className="space-y-4 py-2">
                          {chatMessages.map(msg => (
                            <div
                              key={msg.id}
                              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                            >
                              {msg.role === 'assistant' && (
                                <div className="h-8 w-8 rounded-full bg-ai/10 flex items-center justify-center shrink-0">
                                  <Bot className="h-4 w-4 text-ai" />
                                </div>
                              )}
                              <div
                                className={`rounded-lg px-4 py-2.5 max-w-[80%] text-sm ${
                                  msg.role === 'user'
                                    ? 'bg-ai text-white'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              </div>
                              {msg.role === 'user' && (
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                              )}
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>
                      )}
                    </ScrollArea>

                    <div className="flex gap-2 pt-3 border-t mt-3">
                      <Textarea
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={handleChatKeyDown}
                        placeholder="Ask a question about this document..."
                        className="min-h-[44px] max-h-[120px] resize-none text-sm"
                        rows={1}
                      />
                      <Button
                        size="icon"
                        onClick={handleSendChat}
                        disabled={!chatInput.trim() || isChatting}
                        className="shrink-0 h-[44px] w-[44px]"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
