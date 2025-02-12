interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | BufferSource | Blob): Promise<void>
  seek(position: number): Promise<void>
  truncate(size: number): Promise<void>
}

export interface FileSystemHandle {
  kind: 'file' | 'directory'
  name: string
}

export interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file'
  getFile(): Promise<File>
  createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory'
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>
  values(): AsyncIterableIterator<FileSystemHandle>
  keys(): AsyncIterableIterator<string>
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>
}

export type FileSystemNode = {
  name: string
  kind: 'file' | 'directory'
  handle?: FileSystemFileHandle
  children?: FileSystemNode[]
}

declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>
  }
}

export async function readDirectory(): Promise<FileSystemNode | null> {
  try {
    const directoryHandle = await window.showDirectoryPicker()
    const root: FileSystemNode = await readDirectoryRecursive(directoryHandle)
    return root
  } catch (error) {
    console.error('Error accessing directory:', error)
    return null
  }
}

async function readDirectoryRecursive(
  directoryHandle: FileSystemDirectoryHandle
): Promise<FileSystemNode> {
  const root: FileSystemNode = {
    name: directoryHandle.name,
    kind: 'directory',
    children: [],
  }

  for await (const [name, handle] of directoryHandle.entries()) {
    if (handle.kind === 'file') {
      root.children?.push({ 
        name, 
        kind: 'file', 
        handle: handle as FileSystemFileHandle 
      })
    } else if (handle.kind === 'directory') {
      const childDirectory = await readDirectoryRecursive(handle as FileSystemDirectoryHandle)
      root.children?.push(childDirectory)
    }
  }

  return root
}

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov'] as const
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a'] as const

type VideoExtension = typeof VIDEO_EXTENSIONS[number]
type AudioExtension = typeof AUDIO_EXTENSIONS[number]
type MediaExtension = VideoExtension | AudioExtension

export const isMediaFile = (fileName: string): boolean => {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.')) as MediaExtension
  return [...VIDEO_EXTENSIONS, ...AUDIO_EXTENSIONS].includes(ext)
}

export const isVideoFile = (fileName: string): boolean => {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.')) as VideoExtension
  return VIDEO_EXTENSIONS.includes(ext)
}