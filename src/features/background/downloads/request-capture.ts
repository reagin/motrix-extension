import { filenameMetadata, requestContexts } from './state';

interface RequestHeaderDetails {
  url: string;
  requestHeaders?: Array<{ name: string; value?: string }>;
}

interface ResponseHeaderDetails {
  url: string;
  responseHeaders?: Array<{ name: string; value?: string }>;
}

export function captureRequestHeaders(details: RequestHeaderDetails): void {
  requestContexts.capture({
    url: details.url,
    requestHeaders: details.requestHeaders?.map((header) => ({
      name: header.name,
      value: header.value,
    })),
  });
}

export function captureResponseHeaders(details: ResponseHeaderDetails): void {
  filenameMetadata.capture({
    url: details.url,
    responseHeaders: details.responseHeaders?.map((header) => ({
      name: header.name,
      value: header.value,
    })),
  });
}
