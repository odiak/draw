declare class ClipboardItem {
  constructor(data: { [mimeType: string]: Blob | string | Promise<Blob> | Promise<string> })
  types: Array<string>
  getType(type: string): Promise<Blob>
}

interface Clipboard {
  write(clipboardItems: Array<ClipboardItem>): Promise<void>
  read(): Promise<Array<ClipboardItem>>
}
