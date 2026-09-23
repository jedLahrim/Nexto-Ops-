'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender?: {
    id: string;
    fullName?: string;
    email: string;
  };
}

export function TicketThreadDialog({
  incidentId,
  onOpenChange,
}: {
  incidentId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch initial history
  const { data: initialMessages, isLoading } = useQuery({
    queryKey: ['ticket_messages', incidentId],
    queryFn: async () => {
      if (!incidentId) return [];
      const res = await api.get(`/itsm/${incidentId}/messages`);
      return res.data as Message[];
    },
    enabled: !!incidentId,
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
      scrollToBottom();
    }
  }, [initialMessages]);

  useEffect(() => {
    if (!incidentId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    // Connect to WebSocket gateway
    // In production, the socket URL should come from env. For now, defaulting to standard dev port.
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';
    const newSocket = io(`${socketUrl}/tickets`, {
      auth: { token },
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_ticket', { incidentId });
    });

    newSocket.on('new_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [incidentId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket || !incidentId) return;

    socket.emit('send_message', { incidentId, content: inputValue.trim() });
    setInputValue('');
  };

  return (
    <Dialog open={!!incidentId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg h-[600px] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Ticket Thread</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden relative">
          <ScrollArea className="h-full w-full p-4" ref={scrollRef}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground pt-10">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isMe = msg.sender?.id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {isMe ? 'You' : msg.sender?.fullName || msg.sender?.email || 'System'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <div
                        className={`px-3 py-2 rounded-lg text-sm ${
                          isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
