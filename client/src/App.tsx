import { useState } from 'react';
import { Container, Title } from '@mantine/core';
import { UploadForm } from './components/UploadForm';
import { ResultTable } from './components/ResultTable';
import { SensitiveColumnsModal } from './components/SensitiveColumnsModal';
import { getSensitiveColumnInfo, type SensitiveColumnInfo } from './utils/sensitiveColumns';
import type { ParsedFile } from './types';

export function App() {
  const [result, setResult] = useState<ParsedFile | null>(null);
  const [sensitiveColumns, setSensitiveColumns] = useState<SensitiveColumnInfo[]>([]);
  const [confirmedSensitiveIds, setConfirmedSensitiveIds] = useState<Set<string>>(new Set());
  const [modalOpened, setModalOpened] = useState(false);

  const handleResult = (newResult: ParsedFile) => {
    setResult(newResult);
    const columns = getSensitiveColumnInfo(newResult);
    setSensitiveColumns(columns);
    setConfirmedSensitiveIds(new Set());
    setModalOpened(columns.length > 0);
  };

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="lg">
        Document Quality Viewer
      </Title>
      <UploadForm onResult={handleResult} />
      {result && <ResultTable result={result} confirmedSensitiveIds={confirmedSensitiveIds} />}
      {result && (
        <SensitiveColumnsModal
          opened={modalOpened}
          columns={sensitiveColumns}
          headers={result.headers}
          onConfirm={(ids) => {
            setConfirmedSensitiveIds(ids);
            setModalOpened(false);
          }}
        />
      )}
    </Container>
  );
}
