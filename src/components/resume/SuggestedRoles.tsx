import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircularScore } from "./CircularScore";
import { Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface SuggestedRole {
  title: string;
  match_score: number;
  reasoning: string;
  key_skills: string[];
}

interface SuggestedRolesProps {
  roles: SuggestedRole[];
  onSelectRole: (role: string) => void;
}

export const SuggestedRoles: React.FC<SuggestedRolesProps> = ({ roles, onSelectRole }) => {
  if (!roles || roles.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Roles That Fit You</h3>
          <p className="text-xs text-muted-foreground">Based on your resume analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {roles.map((role, i) => (
          <motion.div
            key={role.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="group cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 h-full">
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm text-foreground leading-tight flex-1 pr-2">
                    {role.title}
                  </h4>
                  <div className="shrink-0">
                    <CircularScore score={role.match_score} size="sm" showLabel={false} />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-3 flex-1">
                  {role.reasoning}
                </p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {role.key_skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-[10px] py-0 px-1.5">
                      {skill}
                    </Badge>
                  ))}
                  {role.key_skills.length > 3 && (
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                      +{role.key_skills.length - 3}
                    </Badge>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs text-primary hover:text-primary hover:bg-primary/5 group-hover:bg-primary/5"
                  onClick={() => onSelectRole(role.title)}
                >
                  Scan for this role <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
