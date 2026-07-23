import { useEffect, useState } from 'react';
import { ActionIcon, Alert, Container, Group, Indicator, Title } from '@mantine/core';
import { IconCloud } from '@tabler/icons-react';
import { UploadForm } from './components/UploadForm';
import { ResultTable } from './components/ResultTable';
import { SensitiveColumnsModal } from './components/SensitiveColumnsModal';
import { TableTitlePromptModal } from './components/TableTitlePromptModal';
import { StoredTablesDrawer } from './components/StoredTablesDrawer';
import { getSensitiveColumnInfo, type SensitiveColumnInfo } from './utils/sensitiveColumns';
import { storeTable, listStoredTables, deleteStoredTable } from './api/storedTables';
import type { ParsedFile, StoredTable } from './types';

export function App() {
  const [result, setResult] = useState<ParsedFile | null>(null);
  const [sensitiveColumns, setSensitiveColumns] = useState<SensitiveColumnInfo[]>([]);
  const [confirmedSensitiveIds, setConfirmedSensitiveIds] = useState<Set<string>>(new Set());
  const [modalOpened, setModalOpened] = useState(false);
  const [storedTables, setStoredTables] = useState<StoredTable[]>([]);
  const [storeModalOpened, setStoreModalOpened] = useState(false);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);

  useEffect(() => {
    listStoredTables()
      .then((tables) => {
        setStoredTables(tables);
        setDrawerError(null);
      })
      .catch((err) => {
        console.error('Failed to load stored tables', err);
        setDrawerError(err instanceof Error ? err.message : 'Failed to load stored tables');
        setDrawerOpened(true);
      });
  }, []);

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

  const handleStoreConfirm = async (title: string) => {
    if (!result) {
      setStoreModalOpened(false);
      return;
    }
    try {
      const stored = await storeTable(title, result);
      setStoredTables((prev) => [...prev, stored]);
      setStoreError(null);
      setStoreModalOpened(false);
      handleClearView();
    } catch (err) {
      console.error('Failed to store table', err);
      setStoreModalOpened(false);
      handleClearView();
      setStoreError(err instanceof Error ? err.message : 'Failed to store table');
    }
  };

  const handleLoadStoredTable = (table: StoredTable) => {
    handleResult(table.tableObject);
    setDrawerOpened(false);
  };

  const handleDeleteStoredTable = async (id: string) => {
    try {
      await deleteStoredTable(id);
      setStoredTables((prev) => prev.filter((table) => table.id !== id));
      setDrawerError(null);
    } catch (err) {
      console.error('Failed to delete stored table', err);
      setDrawerError(err instanceof Error ? err.message : 'Failed to delete stored table');
    }
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
      {storeError && (
        <Alert color="red" mt="md" title="Failed to store table" mb="md" data-testid="store-table-error-alert">
          {storeError}
        </Alert>
      )}
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
        onClose={() => {
          setDrawerOpened(false);
          setDrawerError(null);
        }}
        tables={storedTables}
        onLoad={handleLoadStoredTable}
        onDelete={handleDeleteStoredTable}
        error={drawerError}
      />
    </Container>
  );
}
