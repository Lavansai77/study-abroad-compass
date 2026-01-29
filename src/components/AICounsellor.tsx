import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Send, Loader2, User, Bot } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AICounsellorProps {
  open: boolean;
  onClose: () => void;
  onAction?: () => void;
}

export default function AICounsellor({ open, onClose, onAction }: AICounsellorProps) {
  const { profile, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      // Add welcome message
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hello ${profile?.full_name?.split(' ')[0] || 'there'}! 👋 I'm your AI Counsellor, here to guide you through your study abroad journey.

Based on your profile, I can help you with:
- **Understanding your profile strengths and gaps**
- **Recommending universities** (Dream, Target, or Safe)
- **Explaining why universities fit** your profile
- **Shortlisting and locking universities**
- **Creating personalized to-do tasks**

What would you like to discuss today?`
      }]);
    }
  }, [open, profile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context from profile and shortlisted universities
      const { data: shortlisted } = await supabase
        .from('shortlisted_universities')
        .select(`
          *,
          universities (name, country, category, tuition_min, tuition_max)
        `);

      const { data: todos } = await supabase
        .from('todos')
        .select('*')
        .eq('completed', false);

      const context = {
        profile: profile,
        shortlistedUniversities: shortlisted || [],
        pendingTodos: todos || []
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-counsellor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          messages: messages.filter(m => m.id !== 'welcome').map(m => ({
            role: m.role,
            content: m.content
          })).concat([{ role: 'user', content: input.trim() }]),
          context,
          userId: user?.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = (Date.now() + 1).toString();

      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: ''
      }]);

      if (reader) {
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => 
                  prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m)
                );
              }

              // Check for actions in the response
              if (parsed.action) {
                handleAction(parsed.action);
              }
            } catch {
              // Incomplete JSON, put back in buffer
              buffer = line + '\n' + buffer;
              break;
            }
          }
        }
      }

      // Save messages to database
      if (user) {
        await supabase.from('chat_messages').insert([
          { user_id: user.id, role: 'user', content: input.trim() },
          { user_id: user.id, role: 'assistant', content: assistantContent }
        ]);
      }

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: { type: string; data: any }) => {
    if (!user) return;

    try {
      switch (action.type) {
        case 'shortlist_university':
          await supabase.from('shortlisted_universities').upsert({
            user_id: user.id,
            university_id: action.data.universityId,
            status: 'shortlisted',
            risk_level: action.data.riskLevel,
            fit_score: action.data.fitScore
          });
          break;
        
        case 'lock_university':
          await supabase.from('shortlisted_universities')
            .update({ status: 'locked', locked_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('university_id', action.data.universityId);
          
          // Update stage to 4 if first lock
          await supabase.from('profiles')
            .update({ current_stage: 4 })
            .eq('user_id', user.id)
            .lt('current_stage', 4);
          break;

        case 'create_todo':
          await supabase.from('todos').insert({
            user_id: user.id,
            title: action.data.title,
            description: action.data.description,
            category: action.data.category,
            priority: action.data.priority,
            due_date: action.data.dueDate,
            university_id: action.data.universityId
          });
          break;
      }

      onAction?.();
    } catch (error) {
      console.error('Action error:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display text-xl">AI Counsellor</span>
              <p className="text-sm font-normal text-muted-foreground">Your personal study abroad guide</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' ? 'bg-primary' : 'gradient-hero'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-4 rounded-2xl ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                        : 'bg-muted rounded-tl-sm'
                    }`}>
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm p-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about universities, applications, or your profile..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
