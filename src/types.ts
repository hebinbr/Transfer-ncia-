export interface DevicePeer {
  id: string;
  name: string;
  type: 'mobile' | 'desktop';
  platform: 'iOS' | 'macOS' | 'Windows' | 'Android' | 'Linux' | 'Other';
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  joinedAt: number;
  lastActive: number;
}

export interface SharedFileItem {
  id: string;
  filename: string;
  storedPath: string;
  size: number;
  mimetype: string;
  senderId: string;
  senderName: string;
  targetId?: string;
  roomCode: string;
  userEmail?: string;
  createdAt: number;
  downloadCount: number;
  packageId?: string;
  orderIndex?: number;
}

export interface SharedPackageItem {
  id: string;
  name: string;
  files: SharedFileItem[];
  totalSize: number;
  senderId: string;
  senderName: string;
  targetId?: string;
  roomCode: string;
  userEmail?: string;
  createdAt: number;
  downloadCount: number;
}

export interface SharedTextItem {
  id: string;
  text: string;
  type: 'text' | 'url';
  senderId: string;
  senderName: string;
  roomCode: string;
  createdAt: number;
}

export interface UserAccount {
  email: string;
  name: string;
  avatar?: string;
  isLoggedIn: boolean;
}

export interface TransferProgress {
  id: string;
  filename: string;
  progress: number; // 0 to 100
  speed?: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export type TransferStatus = 'success' | 'error';
export type TransferDirection = 'sent' | 'received';
export type TransferKind = 'file' | 'package';

export interface TransferHistoryItem {
  id: string;
  name: string;
  kind: TransferKind;
  direction: TransferDirection;
  status: TransferStatus;
  size: number;
  fileCount?: number;
  mimetype?: string;
  senderName: string;
  targetName?: string;
  timestamp: number;
  errorMessage?: string;
  downloadUrl?: string;
  fileId?: string;
  packageId?: string;
}
