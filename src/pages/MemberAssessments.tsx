import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { memberAssessments } from "@/data/memberAssessments";
import { aiAssessmentService } from "@/services/AIAssessmentService";
import type { AIProcessingResult } from "@/types/assessment-types";
import type { Json, Tables } from "@/integrations/supabase/types";

type SupabaseAssessmentRow = Tables<"assessments_enhanced">;

// ... (rest of the file remains the same)