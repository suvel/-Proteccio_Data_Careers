import { useState } from 'react';
import { Alert, Button, FileInput, Group, Loader } from '@mantine/core';
import { processDocument } from '../api/processDocument';
import type { ParsedFile } from '../types';

interface UploadFormProps {
  onResult: (result: ParsedFile) => void;
}

export function UploadForm({ onResult }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await processDocument(file);
      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Group align="flex-end">
        <FileInput
          label="Upload a CSV or Excel file"
          placeholder="Choose file"
          accept=".csv,.xls,.xlsx"
          value={file}
          onChange={setFile}
          w={320}
        />
        <Button onClick={handleSubmit} disabled={!file || loading}>
          {loading ? <Loader size="xs" color="white" /> : 'Process document'}
        </Button>
      </Group>
      {error && (
        <Alert color="red" title="Error" mt="md">
          {error}
        </Alert>
      )}
    </div>
  );
}
