export interface DownloadItem {
  id: number;
  url: string;
  mime?: string;
  state?: string;
  filename?: string;
  fileSize?: number;
  finalUrl?: string;
  referrer?: string;
  totalBytes?: number;
  byExtensionId?: string;
}
