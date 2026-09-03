import React from 'react';
import { Card, Tag, Typography, Space, Button } from 'antd';
import { RobotOutlined, ClockCircleOutlined, AlertOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { SonamDashboardSummary } from '@sonam/shared';

const { Text, Title } = Typography;

interface SonamBannerProps {
  summary: SonamDashboardSummary | null;
  loading?: boolean;
}

export const SonamBanner: React.FC<SonamBannerProps> = ({ summary, loading }) => {
  const navigate = useNavigate();

  if (loading || !summary) {
    return <Card loading style={{ borderRadius: 16, marginBottom: 20 }} />;
  }

  const { greeting, sonamInsightMessage, nextImportantTask, stats } = summary;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        borderRadius: 16,
        padding: '24px 28px',
        color: '#ffffff',
        marginBottom: 24,
        boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.35)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Background Circles */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ maxWidth: 640 }}>
          <Space align="center" style={{ marginBottom: 6 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                color: '#ffffff',
              }}
            >
              <RobotOutlined style={{ marginRight: 6 }} /> Sonam AI Todo Assistant
            </span>
          </Space>

          <Title level={2} style={{ color: '#ffffff', margin: '4px 0 8px 0', fontSize: 26, fontWeight: 800 }}>
            {greeting}
          </Title>

          <Text style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: 15, lineHeight: 1.5, display: 'block', marginBottom: 14 }}>
            {sonamInsightMessage}
          </Text>

          <Button
            type="default"
            icon={<MessageOutlined style={{ color: '#dc2626' }} />}
            size="middle"
            onClick={() => navigate('/sonam')}
            style={{
              borderRadius: 20,
              fontWeight: 700,
              color: '#dc2626',
              background: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            Ask Sonam
          </Button>
        </div>

        {/* Next Urgent Task Highlight Box */}
        {nextImportantTask ? (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(12px)',
              borderRadius: 12,
              padding: '14px 18px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              minWidth: 260,
              maxWidth: 320,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#fef08a', marginBottom: 4 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} /> Next Up
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#ffffff', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nextImportantTask.title}
            </div>
            <Tag color="warning" style={{ fontWeight: 700, borderRadius: 6, border: 'none' }}>
              {nextImportantTask.deadlineFormatted}
            </Tag>
          </div>
        ) : (
          stats.overdueCount > 0 && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(12px)',
                borderRadius: 12,
                padding: '14px 18px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                minWidth: 220,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fef08a', marginBottom: 4 }}>
                <AlertOutlined style={{ marginRight: 4 }} /> Overdue Action Required
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#ffffff' }}>
                {stats.overdueCount} Overdue Task{stats.overdueCount === 1 ? '' : 's'}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
