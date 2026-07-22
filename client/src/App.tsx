import { useState } from 'react';
import { ActionIcon, Container, Group, Indicator, Title } from '@mantine/core';
import { IconCloud } from '@tabler/icons-react';
import { UploadForm } from './components/UploadForm';
import { ResultTable } from './components/ResultTable';
import { SensitiveColumnsModal } from './components/SensitiveColumnsModal';
import { TableTitlePromptModal } from './components/TableTitlePromptModal';
import { StoredTablesDrawer } from './components/StoredTablesDrawer';
import { getSensitiveColumnInfo, type SensitiveColumnInfo } from './utils/sensitiveColumns';
import type { ParsedFile, StoredTable } from './types';

export function App() {
  const [result, setResult] = useState<ParsedFile | null>(null);
  const [sensitiveColumns, setSensitiveColumns] = useState<SensitiveColumnInfo[]>([]);
  const [confirmedSensitiveIds, setConfirmedSensitiveIds] = useState<Set<string>>(new Set());
  const [modalOpened, setModalOpened] = useState(false);
  const [storedTables, setStoredTables] = useState<StoredTable[]>([]);
  const [storeModalOpened, setStoreModalOpened] = useState(false);
  const [drawerOpened, setDrawerOpened] = useState(false);

  const handleResult = (newResult: ParsedFile) => {
    setResult(newResult);
    const columns = getSensitiveColumnInfo(newResult);
    setSensitiveColumns(columns);
    setConfirmedSensitiveIds(new Set());
    setModalOpened(columns.length > 0);
  };

  const handleClearView = () => {
    setResult(null);
    setSensitiveColumns([]);
    setConfirmedSensitiveIds(new Set());
    setModalOpened(false);
  };

  const handleStoreConfirm = (title: string) => {
    if (result) {
      setStoredTables((prev) => [...prev, { title, tableObject: result }]);
    }
    setStoreModalOpened(false);
    handleClearView();
  };

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Document Quality Viewer</Title>
        <Indicator label={storedTables.length} size={18} offset={4} color="blue">
          <ActionIcon
            size="lg"
            variant="light"
            radius="xl"
            aria-label="Stored tables"
            data-testid="stored-tables-toggle"
            onClick={() => setDrawerOpened(true)}
          >
            <IconCloud size={20} />
          </ActionIcon>
        </Indicator>
      </Group>
      <UploadForm
        onResult={handleResult}
        showStoreButton={!!result}
        onStoreClick={() => setStoreModalOpened(true)}
      />
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
      <TableTitlePromptModal
        opened={storeModalOpened}
        onConfirm={handleStoreConfirm}
        onCancel={() => setStoreModalOpened(false)}
      />
      <StoredTablesDrawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        tables={storedTables}
      />
    </Container>
  );
}
