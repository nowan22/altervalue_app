// v4.0: Activity logging utility
import { ActivityType } from "@prisma/client";
import {
  LogIn,
  LogOut,
  UserPlus,
  UserCog,
  FolderPlus,
  FolderEdit,
  FolderMinus,
  ClipboardPlus,
  Rocket,
  ClipboardCheck,
  Target,
  FileUp,
  FileCheck,
  FileX,
  CheckSquare,
  CheckCircle,
  CalendarPlus,
  CalendarCheck,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Bell,
  BellOff,
  Settings,
  SlidersHorizontal,
  Info,
  Activity,
  LucideIcon,
} from "lucide-react";

interface LogActivityParams {
  type: ActivityType;
  action: string;
  description?: string;
  companyId?: string;
  companyName?: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
}

// Client-side activity logger
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await fetch("/api/activity-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

// Server-side activity logger (for API routes)
interface ServerLogParams extends LogActivityParams {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function logActivityServer(
  prismaClient: any,
  params: ServerLogParams
): Promise<void> {
  try {
    await prismaClient.activityLog.create({
      data: {
        userId: params.userId,
        userEmail: params.userEmail,
        userName: params.userName,
        userRole: params.userRole,
        type: params.type,
        action: params.action,
        description: params.description,
        companyId: params.companyId,
        companyName: params.companyName,
        entityType: params.entityType,
        entityId: params.entityId,
        entityName: params.entityName,
        metadata: params.metadata,
      },
    });
  } catch (error) {
    console.error("Failed to log activity (server):", error);
  }
}

// Activity type labels for display
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  USER_LOGIN: "Connexion",
  USER_LOGOUT: "Déconnexion",
  USER_CREATED: "Utilisateur créé",
  USER_UPDATED: "Utilisateur modifié",
  MISSION_CREATED: "Mission créée",
  MISSION_UPDATED: "Mission modifiée",
  MISSION_DELETED: "Mission supprimée",
  SURVEY_CREATED: "Enquête créée",
  SURVEY_LAUNCHED: "Enquête lancée",
  SURVEY_CLOSED: "Enquête clôturée",
  SURVEY_THRESHOLD_REACHED: "Seuil de réponses atteint",
  DOCUMENT_UPLOADED: "Document téléversé",
  DOCUMENT_APPROVED: "Document approuvé",
  DOCUMENT_EXPIRED: "Document expiré",
  WORKFLOW_STEP_COMPLETED: "Étape workflow complétée",
  WORKFLOW_TASK_COMPLETED: "Tâche workflow complétée",
  ACTION_PLAN_CREATED: "Plan d'action créé",
  ACTION_PLAN_APPROVED: "Plan d'action approuvé",
  INTERVENTION_CREATED: "Intervention créée",
  INTERVENTION_COMPLETED: "Intervention complétée",
  INTERVENTION_OVERDUE: "Intervention en retard",
  ALERT_CREATED: "Alerte créée",
  ALERT_RESOLVED: "Alerte résolue",
  SETTINGS_UPDATED: "Paramètres modifiés",
  COEFFICIENT_UPDATED: "Coefficients modifiés",
  SYSTEM_NOTIFICATION: "Notification système",
  CUSTOM: "Action personnalisée",
};

// Activity type icons (as Lucide components)
export const ACTIVITY_TYPE_ICONS: Record<ActivityType, LucideIcon> = {
  USER_LOGIN: LogIn,
  USER_LOGOUT: LogOut,
  USER_CREATED: UserPlus,
  USER_UPDATED: UserCog,
  MISSION_CREATED: FolderPlus,
  MISSION_UPDATED: FolderEdit,
  MISSION_DELETED: FolderMinus,
  SURVEY_CREATED: ClipboardPlus,
  SURVEY_LAUNCHED: Rocket,
  SURVEY_CLOSED: ClipboardCheck,
  SURVEY_THRESHOLD_REACHED: Target,
  DOCUMENT_UPLOADED: FileUp,
  DOCUMENT_APPROVED: FileCheck,
  DOCUMENT_EXPIRED: FileX,
  WORKFLOW_STEP_COMPLETED: CheckSquare,
  WORKFLOW_TASK_COMPLETED: CheckCircle,
  ACTION_PLAN_CREATED: CalendarPlus,
  ACTION_PLAN_APPROVED: CalendarCheck,
  INTERVENTION_CREATED: PlusCircle,
  INTERVENTION_COMPLETED: CheckCircle2,
  INTERVENTION_OVERDUE: AlertTriangle,
  ALERT_CREATED: Bell,
  ALERT_RESOLVED: BellOff,
  SETTINGS_UPDATED: Settings,
  COEFFICIENT_UPDATED: SlidersHorizontal,
  SYSTEM_NOTIFICATION: Info,
  CUSTOM: Activity,
};

// Activity type colors
export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  USER_LOGIN: "text-success",
  USER_LOGOUT: "text-muted-foreground",
  USER_CREATED: "text-primary",
  USER_UPDATED: "text-info",
  MISSION_CREATED: "text-primary",
  MISSION_UPDATED: "text-info",
  MISSION_DELETED: "text-error",
  SURVEY_CREATED: "text-secondary",
  SURVEY_LAUNCHED: "text-success",
  SURVEY_CLOSED: "text-info",
  SURVEY_THRESHOLD_REACHED: "text-success",
  DOCUMENT_UPLOADED: "text-secondary",
  DOCUMENT_APPROVED: "text-success",
  DOCUMENT_EXPIRED: "text-warning",
  WORKFLOW_STEP_COMPLETED: "text-success",
  WORKFLOW_TASK_COMPLETED: "text-success",
  ACTION_PLAN_CREATED: "text-primary",
  ACTION_PLAN_APPROVED: "text-success",
  INTERVENTION_CREATED: "text-secondary",
  INTERVENTION_COMPLETED: "text-success",
  INTERVENTION_OVERDUE: "text-error",
  ALERT_CREATED: "text-warning",
  ALERT_RESOLVED: "text-success",
  SETTINGS_UPDATED: "text-muted-foreground",
  COEFFICIENT_UPDATED: "text-muted-foreground",
  SYSTEM_NOTIFICATION: "text-info",
  CUSTOM: "text-muted-foreground",
};
