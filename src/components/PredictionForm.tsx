/**
 * Prediction form component
 * Handles user input and runs predictions through the trained model
 */
import { useState } from "react";

import { Button } from "@/components/user-interface/button";
import { Card } from "@/components/user-interface/card";
import { Input } from "@/components/user-interface/input";
import { Label } from "@/components/user-interface/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/user-interface/select";
import { toast } from "sonner";
import { FeatureConfig } from "@/views/types";

interface PredictionFormProps {
  model: any;
  featureConfig: FeatureConfig;
  onPrediction: (prediction: any) => void;
}

const PredictionForm = ({ model, featureConfig, onPrediction }: PredictionFormProps) => {
  // set up form state with default values based on feature types
  const [formValues, setFormValues] = useState<{ [key: string]: string }>(() => {
    const initial: { [key: string]: string } = {};
    featureConfig.features.forEach(feature => {
      initial[feature] = featureConfig.featureTypes[feature] === 'numeric' ? '0' : '';
    });
    return initial;
  });

  const handleInputChange = (feature: string, value: string) => {
    setFormValues(prev => ({ ...prev, [feature]: value }));
  };

  const handlePredict = () => {
    try {
      // make sure user filled everything out
      const missingFields = featureConfig.features.filter(f => {
        const val = formValues[f];
        return !val || val === '';
      });

      if(missingFields.length > 0) {
        toast.error(`Fill these in first: ${missingFields.join(', ')}`);
        return;
      }
      
      // console.log("About to make prediction with:", formValues); // debug

      // pull out the mappings we saved when we trained
      const encodingMaps = model.options?.encodingMaps || {};
      const targetEncoding = model.options?.targetEncoding || {};
      const featureStats = model.options?.featureStats || {};

      // need to transform the user's input into what model expects
      // this was a pain to figure out lol
      const features = [featureConfig.features.map(feature => {
        const featureType = featureConfig.featureTypes[feature];
        
        if(featureType === 'numeric') {
          // numeric feature - parse and normalize
          const value = parseFloat(formValues[feature]);
          if(isNaN(value)) {
            throw new Error(`Bad number for ${feature}`);
          }
          
          // z-score normalization (same as training)
          if(featureStats[feature]) {
            const mean = featureStats[feature].mean;
            const std = featureStats[feature].std;
            const normalized = (value - mean) / std;
            return normalized;
          }
          return value; // fallback if no stats somehow
          
        } else {
          // categorical - need to encode
          const value = formValues[feature];
          const encoded = encodingMaps[feature]?.[value];
          
          if(encoded === undefined) {
            // this happens if user selects a category that wasn't in training data
            throw new Error(`Haven't seen '${value}' for ${feature} before`);
          }
          
          return encoded;
        }
      })];

      // run prediction
      const prediction = model.predict(features)[0];
      
      // calculate confidence - this is based on how many trees agree
      // learned this approach from: https://stackoverflow.com/questions/34534218
      const allTrees = (model as any).estimators || [];
      let classVotes: { [key: number]: number } = {};
      
      // count votes from each tree
      let treeIndex = 0;
      while(treeIndex < allTrees.length) {
        const currentTree = allTrees[treeIndex];
        try {
          const treePred = currentTree.predict(features)[0];
          if(classVotes[treePred]) {
            classVotes[treePred] = classVotes[treePred] + 1;
          } else {
            classVotes[treePred] = 1;
          }
        } catch(e) {
          // some trees fail sometimes, just skip them
          // console.log("Tree failed:", e);
        }
        treeIndex++;
      }

      // calculate confidence as percentage of trees that voted for winner
      let totalVotes = 0;
      for(const count of Object.values(classVotes)) {
        totalVotes = totalVotes + count;
      }
      
      let confidence;
      if(totalVotes > 0) {
        const votesForPrediction = classVotes[prediction] || 0;
        confidence = votesForPrediction / totalVotes;
      } else {
        confidence = 0.5; // default if something went wrong
      }
      
      // decode prediction back to human-readable label
      const targetClasses = Object.entries(targetEncoding);
      const predictedClass = targetClasses.find(([_, val]) => val === prediction)?.[0] || 'Unknown';

      const result = {
        inputs: { ...formValues },
        prediction: predictedClass,
        predictionValue: prediction,
        confidence: confidence,
        timestamp: new Date().toLocaleString(),
        targetVariable: featureConfig.target,
      };

      onPrediction(result);
      toast.success(`Prediction: ${predictedClass} (${(confidence * 100).toFixed(1)}% sure)`);
    } catch (error) {
      console.error("Prediction error:", error);
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    }
  };

  // pull categorical options from the encoding map
  const getCategoricalOptions = (feature: string): string[] => {
    const encodingMap = model.options?.encodingMaps?.[feature];
    return encodingMap ? Object.keys(encodingMap) : [];
  };

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium">Prediction</h3>
        <p className="text-xs text-muted-foreground">
          Target: {featureConfig.target}
        </p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {featureConfig.features.map(feature => (
            <div key={feature} className="space-y-1">
              <Label htmlFor={feature} className="text-xs">
                {feature}
              </Label>
              
              {featureConfig.featureTypes[feature] === 'numeric' ? (
                <Input
                  id={feature}
                  type="number"
                  step="any"
                  value={formValues[feature]}
                  onChange={(e) => handleInputChange(feature, e.target.value)}
                  placeholder="0"
                  className="h-8 text-sm"
                />
              ) : (
                <Select 
                  value={formValues[feature]} 
                  onValueChange={(val) => handleInputChange(feature, val)}
                >
                  <SelectTrigger id={feature} className="h-8 text-sm">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategoricalOptions(feature).map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>

        <Button onClick={handlePredict} className="w-full" size="sm">
          Predict
        </Button>
      </div>
    </Card>
  );
};

export default PredictionForm;
