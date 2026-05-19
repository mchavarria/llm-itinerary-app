import { MockMailClient } from '../mail/mockMailClient';
import { useAppStore } from '../../store/useAppStore';
import db from '../../storage/db';

const client = new MockMailClient();

export async function syncEngine() {
  const { addSyncLog, setSyncProgress } = useAppStore.getState();

  addSyncLog('Starting sync...');
  setSyncProgress(true);

  try {
    const folders = await db.settings.toArray();
    for (const folder of folders) {
      addSyncLog(`Fetching emails from folder: ${folder.name}`);
      const emails = await client.fetchNewEmails(folder.folderID);
      // Simulate saving files in store .etc}}