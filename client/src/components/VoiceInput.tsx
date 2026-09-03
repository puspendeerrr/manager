import React, { useState, useEffect } from 'react';
import { Button, Tag, Space, Tooltip, message as antMessage } from 'antd';
import { AudioOutlined, AudioMutedOutlined, LoadingOutlined } from '@ant-design/icons';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'ERROR';

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, disabled }) => {
  const [state, setState] = useState<VoiceState>('IDLE');
  const [recognition, setRecognition] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-IN'; // Optimized for English/Hinglish Indian accent

    rec.onstart = () => {
      setState('LISTENING');
    };

    rec.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      if (currentTranscript) {
        onTranscript(currentTranscript);
      }
    };

    rec.onerror = (event: any) => {
      console.warn('[VoiceInput] Speech recognition error:', event.error);
      setState('ERROR');
      antMessage.error(`Voice error: ${event.error}`);
      setTimeout(() => setState('IDLE'), 3000);
    };

    rec.onend = () => {
      setState((prev) => (prev === 'LISTENING' ? 'IDLE' : prev));
    };

    setRecognition(rec);
  }, [onTranscript]);

  const toggleListening = () => {
    if (!isSupported) {
      antMessage.warning('Voice input is not supported in this browser.');
      return;
    }

    if (!recognition) return;

    if (state === 'LISTENING') {
      recognition.stop();
      setState('IDLE');
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.warn('Recognition start exception:', err);
      }
    }
  };

  const renderBadge = () => {
    switch (state) {
      case 'LISTENING':
        return (
          <Tag color="red" icon={<LoadingOutlined spin />}>
            Listening... Speak now
          </Tag>
        );
      case 'PROCESSING':
        return <Tag color="processing">Processing audio...</Tag>;
      case 'ERROR':
        return <Tag color="error">Voice Error</Tag>;
      case 'IDLE':
      default:
        return null;
    }
  };

  return (
    <Space align="center" size={8}>
      <Tooltip title={isSupported ? (state === 'LISTENING' ? 'Stop Listening' : 'Click to Speak') : 'Voice input unsupported'}>
        <Button
          type={state === 'LISTENING' ? 'primary' : 'default'}
          danger={state === 'LISTENING'}
          shape="circle"
          icon={isSupported ? <AudioOutlined /> : <AudioMutedOutlined />}
          onClick={toggleListening}
          disabled={disabled || !isSupported}
          style={{
            borderColor: state === 'LISTENING' ? '#ef4444' : '#e2e8f0',
            boxShadow: state === 'LISTENING' ? '0 0 12px rgba(239, 68, 68, 0.5)' : 'none',
          }}
        />
      </Tooltip>
      {renderBadge()}
    </Space>
  );
};
