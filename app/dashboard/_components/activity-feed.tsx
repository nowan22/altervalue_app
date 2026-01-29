"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Bell,
  CheckCircle,
  FileUp,
  FolderPlus,
  LogIn,
  Rocket,
  Settings,
  Target,
  UserPlus,
  AlertTriangle,
  FileCheck,
  ClipboardList,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ActivityLog {
  id: string;
  type: string;
  action: string;
  description?: string;
  companyName?: string;
  userName?: string;
  userRole?: string;
  entityName?: string;
  createdAt: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  USER_LOGIN: <LogIn className="h-4 w-4" />,
  USER_CREATED: <UserPlus className="h-4 w-4" />,
  MISSION_CREATED: <FolderPlus className="h-4 w-4" />,
  MISSION_UPDATED: <Target className="h-4 w-4" />,
  SURVEY_CREATED: <ClipboardList className="h-4 w-4" />,
  SURVEY_LAUNCHED: <Rocket className="h-4 w-4" />,
  SURVEY_CLOSED: <CheckCircle className="h-4 w-4" />,
  DOCUMENT_UPLOADED: <FileUp className="h-4 w-4" />,
  DOCUMENT_APPROVED: <FileCheck className="h-4 w-4" />,
  ACTION_PLAN_CREATED: <Calendar className="h-4 w-4" />,
  ALERT_CREATED: <Bell className="h-4 w-4" />,
  ALERT_RESOLVED: <CheckCircle className="h-4 w-4" />,
  INTERVENTION_OVERDUE: <AlertTriangle className="h-4 w-4" />,
  SETTINGS_UPDATED: <Settings className="h-4 w-4" />,
  DEFAULT: <Activity className="h-4 w-4" />,
};

const COLOR_MAP: Record<string, string> = {
  USER_LOGIN: "bg-success/20 text-success",
  USER_CREATED: "bg-primary/20 text-primary",
  MISSION_CREATED: "bg-primary/20 text-primary",
  MISSION_UPDATED: "bg-info/20 text-info",
  SURVEY_LAUNCHED: "bg-success/20 text-success",
  SURVEY_CLOSED: "bg-secondary/20 text-secondary",
  DOCUMENT_UPLOADED: "bg-secondary/20 text-secondary",
  DOCUMENT_APPROVED: "bg-success/20 text-success",
  ALERT_CREATED: "bg-warning/20 text-warning",
  ALERT_RESOLVED: "bg-success/20 text-success",
  INTERVENTION_OVERDUE: "bg-error/20 text-error",
  DEFAULT: "bg-muted text-muted-foreground",
};

interface ActivityFeedProps {
  initialLogs?: ActivityLog[];
  limit?: number;
  showHeader?: boolean;
}

export default function ActivityFeed({ initialLogs = [], limit = 8, showHeader = true }: ActivityFeedProps) {
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
  const [isLoading, setIsLoading] = useState(!initialLogs.length);

  useEffect(() => {
    if (!initialLogs.length) {
      fetchLogs();
    }
  }, [initialLogs.length]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/activity-logs?limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (type: string) => ICON_MAP[type] || ICON_MAP.DEFAULT;
  const getColorClass = (type: string) => COLOR_MAP[type] || COLOR_MAP.DEFAULT;

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
    } catch {
      return "";
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Activity className="h-5 w-5 text-primary" />
              Fil d'activité
            </CardTitle>
            <CardDescription>Chargement...</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Activity className="h-5 w-5 text-primary" />
            Fil d'activité
          </CardTitle>
          <CardDescription>Actions récentes sur la plateforme</CardDescription>
        </CardHeader>
      )}
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucune activité récente</p>
            <p className="text-sm text-muted-foreground/70">Les actions seront enregistrées ici</p>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {logs.slice(0, limit).map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getColorClass(log.type)}`}>
                    {getIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {log.action}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      {log.userName && <span>{log.userName}</span>}
                      {log.companyName && (
                        <>
                          <span>•</span>
                          <span className="truncate">{log.companyName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatTime(log.createdAt)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
