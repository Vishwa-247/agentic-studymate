import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, Edit3, Save, X } from "lucide-react";
import { useState } from "react";

interface ProfileSectionProps {
  title: string;
  description: string;
  isCompleted: boolean;
  completionPercentage: number;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
}

export default function ProfileSection({ 
  title, 
  description, 
  isCompleted, 
  completionPercentage, 
  children, 
  icon,
  onEdit,
  onSave,
  onCancel,
  isEditing = false,
  isLoading = false
}: ProfileSectionProps) {
return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge 
              variant={isCompleted ? "default" : "outline"}
              className={isCompleted ? "bg-success text-success-foreground" : ""}
            >
              {isCompleted ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <Circle className="h-3 w-3 mr-1" />
              )}
              {completionPercentage}%
            </Badge>
            
            {/* Edit/Save/Cancel Controls */}
            {title !== "Resume Upload" && title !== "Preview" && (
              <div className="flex items-center gap-1">
                {!isEditing ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onEdit}
                    className="h-8 px-2"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={onSave}
                      disabled={isLoading}
                      className="h-8 px-2"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1"></div>
                      ) : (
                        <Save className="h-3 w-3 mr-1" />
                      )}
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={onCancel}
                      className="h-8 px-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}