import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Clock, 
  Users, 
  Brain, 
  Trophy,
  Star,
  ArrowRight,
  BookOpen,
  Target,
  Zap
} from "lucide-react";

interface Assessment {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  difficulty_level: string;
  time_limit_minutes: number;
  max_attempts: number;
  is_public: boolean;
  is_active: boolean;
  ai_config_id?: string;
  passing_score: number;
  created_at: string;
  user_progress?: {
    best_score: number;
    total_attempts: number;
    is_completed: boolean;
    last_attempt_at: string;
  };
}

interface AssessmentCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export default function Assessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [assessmentsData, categoriesData] = await Promise.all([
        supabase
          .from("assessments_enhanced")
          .select(`
            *,
            user_assessment_progress!left (
              best_score,
              total_attempts,
              is_completed,
              last_attempt_at
            )
          `)
          .eq("is_active", true)
          .eq("is_public", true)
          .order("created_at", { ascending: false }),
        supabase
          .from("assessment_categories")
          .select("*")
          .eq("is_active", true)
          .order("name")
      ]);

      if (assessmentsData.error) throw assessmentsData.error;
      if (categoriesData.error) throw categoriesData.error;

      setAssessments(assessmentsData.data || []);
      setCategories(categoriesData.data || []);
    } catch (error: unknown) {
      console.error("Error loading assessments:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || assessment.category === selectedCategory;
    const matchesType = selectedType === "all" || assessment.type === selectedType;
    const matchesDifficulty = selectedDifficulty === "all" || assessment.difficulty_level === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesType && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'assessment': return <BookOpen className="w-5 h-5" />;
      case 'quiz': return <Target className="w-5 h-5" />;
      case 'challenge': return <Trophy className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    if (!category) return <BookOpen className="w-5 h-5" />;
    
    switch (category.icon) {
      case 'user': return <Users className="w-5 h-5" />;
      case 'heart': return <Star className="w-5 h-5" />;
      case 'users': return <Users className="w-5 h-5" />;
      case 'briefcase': return <BookOpen className="w-5 h-5" />;
      case 'book-open': return <BookOpen className="w-5 h-5" />;
      case 'trophy': return <Trophy className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading assessments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Assessments & Quizzes</h1>
          <p className="text-muted-foreground text-lg">
            Discover AI-powered assessments to understand yourself better
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assessments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="assessment">Assessments</SelectItem>
                  <SelectItem value="quiz">Quizzes</SelectItem>
                  <SelectItem value="challenge">Challenges</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedCategory === category.name ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedCategory(selectedCategory === category.name ? 'all' : category.name)}
              >
                <CardContent className="p-4 text-center">
                  <div className="flex justify-center mb-2">
                    {getCategoryIcon(category.name)}
                  </div>
                  <h3 className="font-medium">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Assessments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(assessment.type)}
                    <Badge variant="outline" className="capitalize">
                      {assessment.type}
                    </Badge>
                  </div>
                  {assessment.ai_config_id && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      AI
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{assessment.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {assessment.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {assessment.time_limit_minutes} min
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {assessment.max_attempts} attempts
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={getDifficultyColor(assessment.difficulty_level)}>
                    {assessment.difficulty_level}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {assessment.passing_score}% to pass
                  </div>
                </div>

                {assessment.user_progress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Your Progress</span>
                      <span>{assessment.user_progress.best_score}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${assessment.user_progress.best_score}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {assessment.user_progress.total_attempts} attempts
                      {assessment.user_progress.is_completed && (
                        <span className="ml-2 text-green-600 font-medium">✓ Completed</span>
                      )}
                    </div>
                  </div>
                )}

                <Link to={`/assessment/${assessment.id}`}>
                  <Button className="w-full">
                    {assessment.user_progress ? 'Continue' : 'Start Assessment'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAssessments.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No assessments found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or check back later for new assessments.
            </p>
          </div>
        )}

        {/* Featured Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Featured Assessments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-primary" />
                  <Badge variant="default">AI-Powered</Badge>
                </div>
                <CardTitle>Personality Assessment</CardTitle>
                <CardDescription>
                  Discover your personality type with our advanced AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="w-4 h-4" />
                      15 minutes
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Medium difficulty
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  <Badge variant="default">Challenge</Badge>
                </div>
                <CardTitle>Emotional Intelligence Challenge</CardTitle>
                <CardDescription>
                  Test and improve your emotional intelligence skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="w-4 h-4" />
                      20 minutes
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Hard difficulty
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
