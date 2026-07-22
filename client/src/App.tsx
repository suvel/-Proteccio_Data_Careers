import { useState } from 'react';
import { Container, Title } from '@mantine/core';
import { UploadForm } from './components/UploadForm';
import { ResultTable } from './components/ResultTable';
import type { ParsedFile } from './types';

export function App() {
  const [result, setResult] = useState<ParsedFile | null>(null);

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="lg">
        Document Quality Viewer
      </Title>
      <UploadForm onResult={setResult} />
      {result && <ResultTable result={result} />}
    </Container>
  );
}
