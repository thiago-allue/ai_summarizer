import { useState, useRef } from 'react';
import { Layout, Typography, Row, Col, Slider, Radio, Input, Button, Divider, Space, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

/**
 * SummarizerPage component
 * Renders the interface for entering text and receiving a summary.
 * Includes controls for summary length, creativity, and output mode.
 *
 * @returns {JSX.Element} The main summarizer interface.
 */
const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

export default function SummarizerPage() {
  // Manages the user input text
  const [inputText, setInputText] = useState('');

  // Manages the summarized text output
  const [summaryText, setSummaryText] = useState('');

  // Manages the percentage of the text length to summarize
  const [percent, setPercent] = useState(30);

  // Manages the creativity level (temperature)
  const [creativity, setCreativity] = useState(0.3);

  // Manages the current mode (summary or bullets)
  const [mode, setMode] = useState('summary');

  // Controls the loading state and stop functionality
  const [loading, setLoading] = useState(false);

  // Reference to the summary output area for scrolling
  const summaryRef = useRef(null);

  // Reference to the AbortController for stopping ongoing fetch
  const abortRef = useRef(null);

  // Count words in the input text
  const inputWords = inputText.trim().length === 0 ? 0 : inputText.trim().split(/\s+/).length;

  // Count words in the summary text
  const summaryWords = summaryText.trim().length === 0 ? 0 : summaryText.trim().split(/\s+/).length;

  /**
   * Handles the summarization process using streaming from the server endpoint.
   * Aborts the request if already in progress.
   * Includes error handling and logging for debugging and reliability.
   */
  const handleSummarize = async () => {
    if (loading) {
      // If a request is already in progress, abort it
      abortRef.current?.abort();
      setLoading(false);
      return;
    }

    if (!inputText.trim()) return;

    setSummaryText('');
    setLoading(true);

    console.log('Summarize request initiated');

    const controller = new AbortController();
    abortRef.current = controller;

    let response;
    try {
      response = await fetch('http://localhost:6677/stream_summary/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: inputText,
          percent,
          bullets: mode === 'bullets',
          temperature: creativity
        }),
        signal: controller.signal,
      });
    } catch (error) {
      console.error('Error while initiating fetch request:', error);
      setLoading(false);
      return;
    }

    if (!response) {
      setLoading(false);
      console.error('No response received from the server.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setSummaryText((prev) => prev + decoder.decode(value));
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Streaming error:', err);
        message.error('Streaming interrupted');
      }
    } finally {
      setLoading(false);
      if (summaryRef.current) summaryRef.current.scrollTop = 0;
    }
  };

  /**
   * Copies the current summary text to the clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      message.success('Summary copied');
    } catch (err) {
      console.error('Copy failed:', err);
      message.error('Copy failed');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', textAlign: 'center', padding: 0 }}>
        <Title level={2} style={{ margin: '16px 0' }}>Text Summarizer</Title>
      </Header>
      <Content style={{ padding: '24px 48px' }}>
        <Row gutter={24} style={{ marginBottom: 16 }} align="top">
          <Col span={12}>
            <Text strong>Summary Length: {percent}%</Text>
            <Slider min={1} max={100} value={percent} onChange={setPercent} style={{ marginBottom: 8 }} />

            <Text strong>Creativity: {creativity}</Text>
            <Slider min={0} max={1} step={0.1} value={creativity} onChange={setCreativity} />
          </Col>
          <Col span={12} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Radio.Group
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              style={{ alignSelf: 'flex-start' }}
            >
              <Radio.Button value="summary">Summary</Radio.Button>
              <Radio.Button value="bullets">Show Bullets</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <TextArea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste or type text…"
              autoSize={{ minRows: 14 }}
              style={{ resize: 'none' }}
            />
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <Text type="secondary">{inputWords} Words</Text>
            </div>
          </Col>
          <Col span={12}>
            <TextArea
              ref={summaryRef}
              value={summaryText}
              readOnly
              placeholder="Summary will appear here…"
              autoSize={{ minRows: 14 }}
              style={{ resize: 'none' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <Text type="secondary">{summaryWords} Words</Text>
              <Space>
                <Button type="text" icon={<CopyOutlined />} onClick={handleCopy}>
                  Copy Text
                </Button>
              </Space>
            </div>
          </Col>
        </Row>

        <Divider />

        <Row justify="center" gutter={16}>
          <Button type="primary" size="large" onClick={handleSummarize} loading={loading}>
            {loading ? 'Stop' : 'Summarize'}
          </Button>
        </Row>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        <Text type="secondary">For the evaluation of www.easymate.ai</Text>
      </Footer>
    </Layout>
  );
}

