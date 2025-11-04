// home page where you pick what to do
// using shadcn ui components: https://www.shadcn.io/template
// just two cards... needed 4 dis
import { useNavigate } from "react-router-dom";
import { Brain, BarChart3 } from "lucide-react";
import { Card } from "@/components/user-interface/card";
import { Button } from "@/components/user-interface/button";
import logo from "@/assets/stevens-logo.png";

const LandingPage = () => {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="container mx-auto px-6 py-12 flex-1">
        {/* logo and title section */}
        <div className="text-center mb-12">
          <img 
            src={logo}
            alt="Stevens Institute of Technology" 
            className="h-20 mx-auto mb-4"
          />
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Research Analytics
          </h1>
          <p className="text-base text-muted-foreground">
            Choose an option
          </p>
        </div>

        {/* main feature cards */}
        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {/* model training card */}
          <Card 
            className="p-5 cursor-pointer hover:border-primary"
            onClick={() => nav('/train-model')}
          >
            <div className="space-y-3">
              <Brain className="w-7 h-7 text-primary mb-2" />
              
              <div>
                <h2 className="text-lg font-medium mb-1">Model Training</h2>
                <p className="text-sm text-muted-foreground">
                  Train Random Forest models with version control
                </p>
              </div>

              <Button variant="outline" className="w-full mt-3">
                Start Training
              </Button>
            </div>
          </Card>

          {/* stats card */}
          <Card 
            className="p-5 cursor-pointer hover:border-primary"
            onClick={() => nav('/analyze-data')}
          >
            <div className="space-y-3">
              <BarChart3 className="w-7 h-7 text-primary mb-2" />
              
              <div>
                <h2 className="text-lg font-medium mb-1">Data Analysis</h2>
                <p className="text-sm text-muted-foreground">
                  Statistical analysis with ANOVA and visualizations
                </p>
              </div>

              <Button variant="outline" className="w-full mt-3">
                Analyze Data
              </Button>
            </div>
          </Card>
        </div>
      </main>

      {/* bottom credits */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Made by Luke Rimmo Lego, Samantha Gauthier & Dr. Denver Baptiste
          </p>
          <p className="text-xs text-muted-foreground">
            UI from <a href="https://www.shadcn.io/template" target="_blank" rel="noopener noreferrer" className="underline">shadcn/ui</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
