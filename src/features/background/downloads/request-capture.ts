import { filenameMetadata, redirectContexts, requestContexts } from './state';

interface RequestDetails {
  url: string;
  requestId?: string;
}

interface RequestHeaderDetails {
  url: string;
  requestHeaders?: Array<{ name: string; value?: string }>;
}

interface ResponseHeaderDetails {
  url: string;
  responseHeaders?: Array<{ name: string; value?: string }>;
}

interface RedirectDetails {
  url: string;
  requestId?: string;
  redirectUrl?: string;
}

export function captureRequest(details: RequestDetails): void {
  redirectContexts.captureRequest({
    url: details.url,
    requestId: details.requestId,
  });
}

export function captureRedirect(details: RedirectDetails): void {
  redirectContexts.captureRedirect({
    url: details.url,
    requestId: details.requestId,
    redirectUrl: details.redirectUrl,
  });
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
