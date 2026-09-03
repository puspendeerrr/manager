import React, { useState, useEffect, useRef } from 'react';
import { Typography, Input, Button, Card, Tag, Alert, Spin, Avatar, message as antMessage } from 'antd';
import { RobotOutlined, SendOutlined, UserOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { ActionCard } from '../components/ActionCard';
import { VoiceInput } from '../components/VoiceInput';
import { aiService } from '../services/aiService';
import { AiChatMessage } from '@sonam/shared';
import { useTheme } from '../context/ThemeContext';

const { Title, Text } = Typography;

export const SonamPage: React.FC = () => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const redPrimary = isDark ? '#ef4444' : '#dc2626';

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'init_1',
      sender: 'sonam',
      text: "Good day! I'm Sonam, your Personal AI Work & Todo Assistant. You can type or speak to ask me anything across your tasks, Google Calendar, Gmail, and reminders!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAiConfigured, setIsAiConfigured] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (customText?: string) => {
    const queryText = customText || input.trim();
    if (!queryText || loading) return;

    const userMsg: AiChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const res = await aiService.sendChatMessage({ message: queryText });
      setIsAiConfigured(res.isAiConfigured);

      const sonamMsg: AiChatMessage = {
        id: `msg_sonam_${Date.now()}`,
        sender: 'sonam',
        text: res.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionCard: res.actionCard || null,
      };

      setMessages((prev) => [...prev, sonamMsg]);
    } catch (err: any) {
      antMessage.error(err.message || 'Failed to communicate with Sonam AI');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    if (transcript.trim()) {
      handleSendMessage(transcript.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{ maxWidth: 850, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header Title */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Title level={2} style={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 800, margin: 0 }}>
              Ask Sonam
            </Title>
            <Text style={{ color: isDark ? '#9ca3af' : '#64748b', fontSize: 14 }}>
              Your Personal AI Todo & Reminder Assistant
            </Text>
          </div>
          <Tag color="red" icon={<ThunderboltOutlined />} style={{ fontWeight: 700, borderRadius: 8, padding: '4px 10px' }}>
            AI Assistant Active
          </Tag>
        </div>
      </div>

      {!isAiConfigured && (
        <Alert
          type="warning"
          message="GEMINI_API_KEY Missing"
          description="Sonam is currently using offline fallback responses. Add GEMINI_API_KEY to server/.env to enable full live Gemini AI capabilities!"
          showIcon
          style={{ marginBottom: 16, borderRadius: 12 }}
        />
      )}

      {/* Chat Messages Container */}
      <Card
        style={{
          flex: 1,
          borderRadius: 16,
          borderColor: isDark ? '#27272a' : '#e2e8f0',
          background: isDark ? '#18181b' : '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          marginBottom: 20,
        }}
        bodyStyle={{
          padding: '20px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <Avatar
              icon={msg.sender === 'user' ? <UserOutlined /> : <RobotOutlined />}
              style={{
                background: msg.sender === 'user' ? redPrimary : isDark ? '#3f3f46' : '#64748b',
                flexShrink: 0,
              }}
            />

            <div style={{ maxWidth: '80%' }}>
              <div
                style={{
                  background: msg.sender === 'user' ? redPrimary : isDark ? '#27272a' : '#f1f5f9',
                  color: msg.sender === 'user' ? '#ffffff' : isDark ? '#f8fafc' : '#0f172a',
                  padding: '12px 16px',
                  borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                {msg.text}
              </div>

              {msg.actionCard && (
                <ActionCard action={msg.actionCard} onActionComplete={() => handleSendMessage('Action completed!')} />
              )}

              <div style={{ fontSize: 11, color: isDark ? '#6b7280' : '#94a3b8', marginTop: 4, textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Avatar icon={<RobotOutlined />} style={{ background: redPrimary }} />
            <div style={{ background: isDark ? '#27272a' : '#f1f5f9', padding: '10px 16px', borderRadius: 16 }}>
              <Spin size="small" tip="Sonam is processing..." />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </Card>

      {/* Quick Input Toolbar with Voice Component */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <VoiceInput onTranscript={handleVoiceTranscript} disabled={loading} />

        <Input
          placeholder="Ask Sonam or speak... (e.g. 'Kal mera schedule kya hai?')"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          size="large"
          style={{ borderRadius: 12, background: isDark ? '#18181b' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a' }}
        />

        <Button
          type="primary"
          icon={<SendOutlined />}
          size="large"
          loading={loading}
          onClick={() => handleSendMessage()}
          style={{
            background: redPrimary,
            border: 'none',
            borderRadius: 12,
            fontWeight: 700,
            padding: '0 24px',
          }}
        >
          Send
        </Button>
      </div>
    </div>
  );
};
