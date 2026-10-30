export type ContentStatus = 'pending_approval' | 'changes_requested' | 'approved';

export type ContentTypeFormat = 'static' | 'carousel' | 'reel' | 'story';

export type MediaType = 'image' | 'carousel' | 'video' | 'drive_video' | 'document';

export type SocialPlatform = 'instagram_feed' | 'instagram_story' | 'reels' | 'tiktok' | 'linkedin' | 'facebook';

export type UserRole = 'owner' | 'manager' | 'creator' | 'viewer';

export interface AgencyUser {
  id: string;
  name: string;
  email: string;
  phone?: string; // WhatsApp number
  password?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
  status: 'active' | 'inactive';
}

export interface AuditLogItem {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userEmail: string;
  action: 
    | 'post_created'
    | 'post_approved'
    | 'post_changes_requested'
    | 'post_edited'
    | 'post_deleted'
    | 'comment_added'
    | 'client_created'
    | 'client_edited'
    | 'client_deleted'
    | 'project_created'
    | 'project_edited'
    | 'user_created'
    | 'user_edited'
    | 'user_deleted'
    | 'theme_updated'
    | 'login';
  details: string;
  entityId?: string;
  entityName?: string;
  timestamp: string;
}

export interface CommentItem {
  id: string;
  postId: string;
  authorRole: 'agency' | 'client';
  authorName: string;
  text: string;
  timestamp: string;
  avatar?: string;
}

export interface GeneralChatMessage {
  id: string;
  clientId: string;
  projectId?: string;
  authorRole: 'agency' | 'client';
  authorName: string;
  text: string;
  timestamp: string;
  avatar?: string;
}

export interface SupportDocument {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
  uploadDate: string;
}

export interface PostContent {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  status: ContentStatus;
  contentType?: ContentTypeFormat;
  mediaType: MediaType;
  mediaUrls: string[];
  driveVideoUrl?: string;
  caption: string;
  scheduledDate: string; // ISO date-time
  platforms: SocialPlatform[];
  requestedChangesNote?: string;
  comments: CommentItem[];
  supportFiles?: SupportDocument[];
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  createdByUserId?: string;
  createdByUserName?: string;
}

export interface FolderProject {
  id: string;
  clientId: string;
  name: string;
  description: string;
  coverImage?: string;
  status: 'active' | 'review' | 'completed';
  clientAccessKey: string; // unique link token
  supportDocs: SupportDocument[];
  createdAt: string;
  createdByUserId?: string;
  createdByUserName?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email?: string;
  phone?: string; // WhatsApp
  whatsappGroupLink?: string; // Link do grupo do WhatsApp
  logo: string;
  brandColor?: string;
  niche: string;
  notes?: string;
  createdAt: string;
  createdByUserId?: string;
  createdByUserName?: string;
  assignedManagerId?: string;
  assignedManagerName?: string;
  assignedManagerIds?: string[];
  assignedManagerNames?: string[];
}

export interface AgencyConfig {
  agencyName: string;
  agencyLogo: string;
  primaryColor: string;
  accentColor: string;
  accountManagerName: string;
  accountManagerPhone: string;
  accountManagerEmail: string;
}

export interface NotificationItem {
  id: string;
  recipient: 'client' | 'agency';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'approval' | 'changes' | 'new_content' | 'comment';
  link?: string;
  targetPhone?: string;
  postId?: string;
  projectId?: string;
  clientId?: string;
  authorName?: string;
  authorRole?: string;
}
