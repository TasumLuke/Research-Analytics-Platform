// main landing page
// ui components from https://www.shadcn.io/template (open source)
import { useNavigate } from "react-router-dom";
import { Brain, BarChart3 } from "lucide-react";
import { Card } from "@/components/user-interface/card";
import { Button } from "@/components/user-interface/button";
import logo from "@/assets/stevens-logo.png";
const LandingPage = () => {
  const goTo = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="container mx-auto px-6 py-12 flex-1">
        {/* logo and title */}
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
            Select workflow
          </p>
        </div>

        {/* workflow options */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* model training option */}
          <Card 
            className="p-6 cursor-pointer border-2"
            onClick={() => goTo("/train-model")}
          >
            <div className="flex flex-col space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              
              <div>
                <h2 className="text-lg font-medium mb-2">AI Model Training</h2>
                <p className="text-sm text-muted-foreground">
                  Train Random Forest models with version control
                </p>
              </div>

              <Button variant="outline" className="w-full">
                Start Training
              </Button>
            </div>
          </Card>

          {/* data analysis option */}
          <Card 
            className="p-6 cursor-pointer border-2"
            onClick={() => goTo("/analyze-data")}
          >
            <div className="flex flex-col space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              
              <div>
                <h2 className="text-lg font-medium mb-2">Data Analysis</h2>
                <p className="text-sm text-muted-foreground">
                  Statistical analysis with ANOVA and visualizations
                </p>
              </div>

              <Button variant="outline" className="w-full">
                Analyze Data
              </Button>
            </div>
          </Card>
        </div>
      </main>

      {/* footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Created by Luke Rimmo Lego & Dr. Denver Baptiste
          </p>
          <p className="text-xs text-muted-foreground">
            UI components from <a href="https://www.shadcn.io/template" target="_blank" rel="noopener noreferrer" className="underline">shadcn/ui</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
