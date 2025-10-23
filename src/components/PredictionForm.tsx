// form for making predictions with the trained model
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
  // initialize form with default values
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
      // make sure user filled everything in
      const missingFields = featureConfig.features.filter(f => {
        const val = formValues[f];
        return !val || val === '';
      });

      if (missingFields.length > 0) {
        toast.error(`Please fill in: ${missingFields.join(', ')}`);
        return;
      }

      // grab the encoding maps from when we trained
      const encodingMaps = model.options?.encodingMaps || {};
      const targetEncoding = model.options?.targetEncoding || {};
      const featureStats = model.options?.featureStats || {};

      // convert form values to model input
      const features = [featureConfig.features.map(feature => {
        if (featureConfig.featureTypes[feature] === 'numeric') {
          const value = parseFloat(formValues[feature]);
          if (isNaN(value)) {
            throw new Error(`Invalid numeric value for ${feature}`);
          }
          // normalize the same way we did in training
          if (featureStats[feature]) {
            const { mean, std } = featureStats[feature];
            return (value - mean) / std;
          }
          return value;
        } else {
          const value = formValues[feature];
          const encoded = encodingMaps[feature]?.[value];
          if (encoded === undefined) {
            throw new Error(`Unknown category '${value}' for ${feature}`);
          }
          return encoded;
        }
      })];

      // run prediction
      const prediction = model.predict(features)[0];
      
      // figure out confidence by counting votes from trees
      const allTrees = (model as any).estimators || [];
      let classVotes: { [key: number]: number } = {};
      
      allTrees.forEach((tree: any) => {
        try {
          const treePred = tree.predict(features)[0];
          classVotes[treePred] = (classVotes[treePred] || 0) + 1;
        } catch {
          // some trees might fail, just skip them
        }
      });

      const totalVotes = Object.values(classVotes).reduce((a, b) => a + b, 0);
      const confidence = totalVotes > 0 ? (classVotes[prediction] || 0) / totalVotes : 0.5;
      
      // convert prediction back to readable label
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
      toast.success(`Prediction: ${predictedClass} (${(confidence * 100).toFixed(1)}% confidence)`);
    } catch (error) {
      console.error("Prediction error:", error);
      const message = error instanceof Error ? error.message : "Error making prediction";
      toast.error(message);
    }
  };

  // get dropdown options for categorical features
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
