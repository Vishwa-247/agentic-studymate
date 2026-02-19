import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Code, MessageSquare, Globe, Wrench } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { Skill } from "@/types/profile";
import { useToast } from "@/hooks/use-toast";

const SKILL_CATEGORIES = [
  { value: "Technical", label: "Technical Skills", icon: Code },
  { value: "Soft", label: "Soft Skills", icon: MessageSquare },
  { value: "Language", label: "Languages", icon: Globe },
  { value: "Framework", label: "Frameworks", icon: Wrench },
  { value: "Tool", label: "Tools", icon: Wrench },
] as const;

const SKILL_LEVELS = [
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
  { value: "Expert", label: "Expert" },
] as const;

export default function SkillsForm() {
  const { profile, updateProfile, isLoading } = useProfile();
  const { toast } = useToast();
  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState<Skill['level']>("Intermediate");
  const [skillCategory, setSkillCategory] = useState<Skill['category']>("Technical");

  const addSkill = async () => {
    if (!skillName.trim()) return;

    try {
      const currentSkills = profile?.skills || [];
      
      // Check if skill already exists
      if (currentSkills.some(skill => skill.name.toLowerCase() === skillName.toLowerCase())) {
        toast({
          title: "Skill already exists",
          description: "This skill is already in your profile",
          variant: "destructive",
        });
        return;
      }

      const newSkill: Skill = {
        name: skillName.trim(),
        level: skillLevel,
        category: skillCategory,
      };

      const updatedSkills = [...currentSkills, newSkill];
      await updateProfile({ skills: updatedSkills });
      
      setSkillName("");
      toast({
        title: "Success",
        description: "Skill added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add skill",
        variant: "destructive",
      });
    }
  };

  const removeSkill = async (skillToRemove: Skill) => {
    try {
      const updatedSkills = profile?.skills?.filter(
        skill => !(skill.name === skillToRemove.name && skill.category === skillToRemove.category)
      ) || [];
      
      await updateProfile({ skills: updatedSkills });
      toast({
        title: "Success",
        description: "Skill removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove skill",
        variant: "destructive",
      });
    }
  };

  const updateSkillLevel = async (skill: Skill, newLevel: Skill['level']) => {
    try {
      const updatedSkills = profile?.skills?.map(s =>
        s.name === skill.name && s.category === skill.category
          ? { ...s, level: newLevel }
          : s
      ) || [];
      
      await updateProfile({ skills: updatedSkills });
      toast({
        title: "Success",
        description: "Skill level updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update skill level",
        variant: "destructive",
      });
    }
  };

  const getSkillsByCategory = (category: Skill['category']) => {
    return profile?.skills?.filter(skill => skill.category === category) || [];
  };

  const getLevelColor = (level: Skill["level"]) => {
    switch (level) {
      case "Beginner":
        return "bg-muted text-muted-foreground";
      case "Intermediate":
        return "bg-primary/10 text-primary";
      case "Advanced":
        return "bg-secondary text-secondary-foreground";
      case "Expert":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Skills & Expertise</h2>
        <p className="text-muted-foreground">
          Add your technical skills, soft skills, and languages to showcase your expertise.
        </p>
      </div>

      {/* Add Skill Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Skill
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter skill name (e.g., React, Python, Communication)"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill()}
              />
            </div>
            <Select value={skillCategory} onValueChange={(value: Skill['category']) => setSkillCategory(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SKILL_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={skillLevel} onValueChange={(value: Skill['level']) => setSkillLevel(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SKILL_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addSkill} disabled={!skillName.trim() || isLoading}>
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skills by Category */}
      <div className="space-y-6">
        {SKILL_CATEGORIES.map((category) => {
          const skills = getSkillsByCategory(category.value);
          const Icon = category.icon;
          
          if (skills.length === 0) return null;

          return (
            <Card key={category.value}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  {category.label}
                  <Badge variant="secondary">{skills.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <div key={`${skill.name}-${index}`} className="group relative">
                      <Badge
                        variant="outline"
                        className={`${getLevelColor(skill.level)} flex items-center gap-2 pr-1`}
                      >
                        <span>{skill.name}</span>
                        <Select
                          value={skill.level}
                          onValueChange={(value: Skill['level']) => updateSkillLevel(skill, value)}
                        >
                          <SelectTrigger className="h-4 w-4 border-0 bg-transparent p-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SKILL_LEVELS.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Skill Summary */}
      {profile?.skills && profile.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Skills Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {SKILL_LEVELS.map((level) => {
                const count = profile.skills.filter(skill => skill.level === level.value).length;
                return (
                  <div key={level.value} className="p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground">{level.label}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}