import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, FileText, Database, Loader2, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/shared/states';
import { getRAGDocuments, uploadRAGDocument } from '@/api/client';
import type { RAGDocument } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const statusBadge: Record<string, { label: string; cls: string }> = {
  indexed: { label: 'Indexed', cls: 'bg-success/10 text-success border-success/20' },
  processing: { label: 'Processing', cls: 'bg-warning/10 text-warning border-warning/20' },
  failed: { label: 'Failed', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function AdminRAGDocs() {
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getRAGDocuments();
      setDocuments(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 200);

    try {
      const res = await uploadRAGDocument(file);
      setDocuments(prev => [res.data, ...prev]);
      setUploadProgress(100);
      toast.success(res.message || 'Document uploaded successfully.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      clearInterval(interval);
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (error) return <ErrorState message={error} onRetry={fetchDocuments} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5" />
        <h2 className="text-lg font-semibold">RAG Document Management</h2>
        <Badge variant="secondary" className="text-xs">{documents.length} documents</Badge>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardContent className="p-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-ai bg-ai/5'
                : isUploading
                  ? 'border-muted bg-muted/50 cursor-not-allowed'
                  : 'border-border hover:border-ai/50 hover:bg-accent/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
              aria-label="Upload PDF for RAG indexing"
            />
            {isUploading ? (
              <div className="space-y-3 max-w-sm mx-auto">
                <Loader2 className="h-8 w-8 text-ai mx-auto animate-spin" />
                <p className="text-sm font-medium">Uploading and processing document...</p>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium">Drop a PDF here or click to browse</p>
                <p className="text-xs text-muted-foreground">
                  Documents will be chunked and indexed for the RAG knowledge base
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Indexed Documents</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchDocuments} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12 text-muted-foreground" />}
              title="No documents indexed"
              description="Upload PDF documents above to build the RAG knowledge base."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead className="hidden sm:table-cell">File Size</TableHead>
                    <TableHead className="hidden md:table-cell">Chunks</TableHead>
                    <TableHead className="hidden lg:table-cell">Uploaded By</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map(doc => {
                    const st = statusBadge[doc.status] || statusBadge.processing;
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium text-sm truncate max-w-[200px]">{doc.fileName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {formatFileSize(doc.fileSize)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {doc.chunkCount} chunks
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {doc.uploadedBy}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${st.cls}`}>{st.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}