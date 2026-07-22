import { useState } from 'react';
import { Alert, Button, FileInput, Group, Loader } from '@mantine/core';
import { IconCloudUpload } from '@tabler/icons-react';
import { processDocument } from '../api/processDocument';
import type { ParsedFile } from '../types';

interface UploadFormProps {
  onResult: (result: ParsedFile) => void;
  showStoreButton: boolean;
  onStoreClick: () => void;
}

export function UploadForm({ onResult, showStoreButton, onStoreClick }: UploadFormProps) {
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
      setFile(null);
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
          label="Upload a CSV or Excel file from Local machine"
          placeholder="Choose file"
          accept=".csv,.xls,.xlsx"
          value={file}
          onChange={setFile}
          w={320}
        />
        <Button loading={loading} onClick={handleSubmit} disabled={!file || loading}>
          Process document
        </Button>
        {showStoreButton && (
          <Button onClick={onStoreClick} leftSection={<IconCloudUpload size={18} />}>
            Store in Cloud
          </Button>
        )}
      </Group>
      {error && (
        <Alert color="red" title="Error" mt="md">
          {error}
        </Alert>
      )}
    </div>
  );
}
