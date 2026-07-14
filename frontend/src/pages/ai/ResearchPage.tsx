import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, FileText, AlertTriangle, ArrowRight, CheckCircle2, Clock,
  Sparkles, FileUp, Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState, LoadingState } from '@/components/shared/states';
import { getResearchUploads, uploadResearchDocument, getResearchResult } from '@/api/client';
import type { ResearchUpload, ResearchResult } from '@/types';
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

  const loadUploads = useCallback(async () => {
    setIsLoadingUploads(true);
    setError(null);
    try {
      const res = await getResearchUploads();
      setUploads(res.data);
      // Auto-select first completed
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

    // Simulate progress
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
        status: 'processing',
        progress: 90,
      };
      setUploads(prev => [newUpload, ...prev]);
      setSelectedUpload(newUpload);
      setResult(null);

      // Simulate completion after processing
      const resultRes = await getResearchResult(uploadRes.data.id);
      setUploads(prev =>
        prev.map(u => u.id === uploadRes.data.id ? resultRes.data : u)
      );
      if (resultRes.data.result) {
        setResult(resultRes.data.result);
        setSelectedUpload(resultRes.data);
      }
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
    if (upload.result) {
      setResult(upload.result);
    } else if (upload.status === 'completed') {
      setIsLoadingResult(true);
      try {
        const res = await getResearchResult(upload.id);
        setResult(res.data.result || null);
      } catch {
        setResult(null);
      } finally {
        setIsLoadingResult(false);
      }
    } else {
      setResult(null);
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
                      <button
                        key={upload.id}
                        onClick={() => handleSelectUpload(upload)}
                        className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors hover:bg-accent flex items-center gap-3 ${
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
                              {format(new Date(upload.uploadedAt), 'MMM d')}
                            </span>
                          </div>
                        </div>
                        <Badge className={`text-[10px] shrink-0 ${st.cls}`}>{st.label}</Badge>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel */}
      <div className="flex-1 min-w-0">
        {error && <ErrorState message={error} onRetry={loadUploads} />}

        {!result && !isLoadingResult && !error && (
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

        {result && !isLoadingResult && (
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-ai" />
                <CardTitle className="text-lg">Research Analysis</CardTitle>
              </div>
              {selectedUpload && (
                <p className="text-sm text-muted-foreground">{selectedUpload.fileName}</p>
              )}
            </CardHeader>
            <CardContent className="pb-6">
              <ScrollArea className="max-h-[calc(100vh-14rem)] custom-scrollbar">
                <Tabs defaultValue="summary">
                  <TabsList className="mb-4">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="findings">Key Findings</TabsTrigger>
                    <TabsTrigger value="gaps">Research Gaps</TabsTrigger>
                    <TabsTrigger value="future">Future Work</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="mt-0">
                    <p className="text-sm leading-relaxed text-foreground/90">{result.summary}</p>
                  </TabsContent>

                  <TabsContent value="findings" className="mt-0">
                    <ul className="space-y-2">
                      {result.keyFindings.map((finding, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </TabsContent>

                  <TabsContent value="gaps" className="mt-0">
                    <ul className="space-y-2">
                      {result.researchGaps.map((gap, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </TabsContent>

                  <TabsContent value="future" className="mt-0">
                    <ul className="space-y-2">
                      {result.futureWork.map((work, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <ArrowRight className="h-4 w-4 text-ai mt-0.5 shrink-0" />
                          <span>{work}</span>
                        </li>
                      ))}
                    </ul>
                  </TabsContent>
                </Tabs>

                <Separator className="my-6" />

                <div>
                  <h4 className="text-sm font-semibold mb-2">Methodology</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.methodology}</p>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}