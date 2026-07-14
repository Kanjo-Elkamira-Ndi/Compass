import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Plus, Send, Sparkles, MessageSquare, PanelLeftClose, PanelLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { LoadingState, ErrorState } from '@/components/shared/states';
import { useAuth } from '@/contexts/auth-context';
import {
  getChatSessions,
  getChatMessages,
  sendChatMessage,
  createChatSession,
} from '@/api/client';
import type { ChatSession, ChatMessage } from '@/types';
import { format } from 'date-fns';

export function AIChat() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    setError(null);
    try {
      const res = await getChatSessions();
      setSessions(res.data);
      if (res.data.length > 0 && !activeSessionId) {
        setActiveSessionId(res.data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Load messages when active session changes
  useEffect(() => {
    if (!activeSessionId) return;
    loadMessages(activeSessionId);
  }, [activeSessionId]);

  const loadMessages = async (sessionId: string) => {
    setIsLoadingMessages(true);
    setError(null);
    try {
      const res = await getChatMessages(sessionId);
      setMessages(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await createChatSession('New Chat');
      setSessions(prev => [res.data, ...prev]);
      setActiveSessionId(res.data.id);
      setMessages([]);
      setMobileOpen(false);
    } catch {
      // silent fail
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeSessionId || isSending) return;

    const content = input.trim();
    setInput('');
    setIsSending(true);

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: 'm-user-' + Date.now(),
      sessionId: activeSessionId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Auto-resize textarea back
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const res = await sendChatMessage(activeSessionId, content);
      setMessages(prev => [...prev, res.data]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: 'm-err-' + Date.now(),
        sessionId: activeSessionId,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 96) + 'px';
  };

  const sessionSidebar = (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <Button onClick={handleNewChat} className="w-full gap-2" aria-label="Start new chat">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-2 space-y-1">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => {
                setActiveSessionId(session.id);
                setMobileOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors hover:bg-accent ${
                session.id === activeSessionId
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{session.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(session.lastMessageAt), 'MMM d')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {session.messageCount} msgs
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Desktop sidebar */}
      {sidebarOpen && (
        <aside className="hidden md:flex w-64 border-r bg-card flex-col shrink-0">
          {sessionSidebar}
        </aside>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-2 px-4 py-3 border-b bg-card">
          {/* Mobile sheet trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open sessions">
                <PanelLeft className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Chat Sessions</SheetTitle>
              {sessionSidebar}
            </SheetContent>
          </Sheet>

          {/* Desktop toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Toggle sidebar"
          >
            <PanelLeftClose className="h-5 w-5" />
          </Button>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate">
              {sessions.find(s => s.id === activeSessionId)?.title || 'AI Academic Advisor'}
            </h2>
            <p className="text-xs text-muted-foreground">Powered by Compass AI</p>
          </div>
          <Badge variant="secondary" className="bg-ai/10 text-ai border-ai/20 shrink-0">
            <Sparkles className="h-3 w-3 mr-1" />
            AI
          </Badge>
        </header>

        {/* Messages */}
        {error && (
          <div className="mx-4 mt-4">
            <ErrorState message={error} onRetry={loadSessions} />
          </div>
        )}

        {isLoadingMessages ? (
          <div className="flex-1 p-6">
            <LoadingState rows={4} />
          </div>
        ) : (
          <ScrollArea className="flex-1 custom-scrollbar">
            <div className="max-w-3xl mx-auto p-4 space-y-4">
              {messages.length === 0 && !isLoadingMessages && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-full bg-ai/10 flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-ai" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Ask Compass AI</h3>
                  <p className="text-muted-foreground max-w-sm">
                    I can help with course selection, academic planning, degree requirements, and more.
                  </p>
                </div>
              )}

              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] sm:max-w-[75%]`}>
                    {msg.role === 'user' ? (
                      <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-br-md">
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="h-3.5 w-3.5 text-ai" />
                          <span className="text-xs font-medium text-ai">Compass AI</span>
                        </div>
                        <div className="text-sm text-foreground prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {msg.sources.map((src, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs bg-background border-border"
                              >
                                <Sparkles className="h-2.5 w-2.5 mr-1 text-ai" />
                                {src.documentName}
                                <span className="text-muted-foreground ml-1">
                                  {Math.round(src.relevance * 100)}%
                                </span>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <p className={`text-[10px] text-muted-foreground mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {format(new Date(msg.createdAt), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}

              {/* Loading dots */}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-ai animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 rounded-full bg-ai animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-ai animate-bounce [animation-delay:300ms]" />
                      </div>
                      <span className="text-xs text-muted-foreground ml-1">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}

        {/* Input area */}
        <div className="border-t bg-card p-4">
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about courses, grades, academic planning..."
              className="min-h-[44px] max-h-24 resize-none rounded-xl"
              rows={1}
              disabled={isSending}
              aria-label="Chat message input"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              size="icon"
              className="h-11 w-11 rounded-xl shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}