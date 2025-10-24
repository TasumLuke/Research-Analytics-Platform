// handles the actual model training process
import { useState } from "react";
import { Brain, Play, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/user-interface/button";
import { Card } from "@/components/user-interface/card";
import { Badge } from "@/components/user-interface/badge";
import { Progress } from "@/components/user-interface/progress";
import { toast } from "sonner";
import { ResearchData, FeatureConfig } from "@/views/types";
import { RandomForestClassifier as RFClassifier } from "ml-random-forest";

interface ModelTrainingProps {
  data: ResearchData[];
  featureConfig: FeatureConfig;
  onModelTrained: (model: any, metrics: any, importance: any[]) => void;
  metrics: any;
  currentVersion: string;
}

const ModelTraining = ({ data, featureConfig, onModelTrained, metrics, currentVersion }: ModelTrainingProps) => {
  // training status
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStep, setTrainingStep] = useState("");
  const [optimizedParams, setOptimizedParams] = useState<any>(null);

  // figure out best settings based on data size
  const optimizeHyperparameters = () => {
    const datasetSize = data.length;
    const numFeatures = featureConfig.features.length;

    // default settings
    let nTrees = 100;
    let maxDepth = 10;
    let minSamples = 2;

    // adjust based on how much data we have
    if (datasetSize < 100) {
      nTrees = 50;
      maxDepth = 5;
      minSamples = 3;
    } else if (datasetSize < 500) {
      nTrees = 100;
      maxDepth = 8;
      minSamples = 2;
    } else if (datasetSize < 1000) {
      nTrees = 150;
      maxDepth = 12;
      minSamples = 2;
    } else {
      nTrees = 200;
      maxDepth = 15;
      minSamples = 3;
    }

    // more features need deeper trees
    if (numFeatures > 10) {
      maxDepth = Math.min(maxDepth + 3, 20);
      nTrees = Math.min(nTrees + 50, 250);
    }

    return { nTrees, maxDepth, minSamples };
  };

  // the main training function
  const trainModel = async () => {
    // need enough data to train properly
    if (data.length < 10) {
      toast.error("Hey, need at least 10 rows to train this thing");
      return;
    }

    setIsTraining(true);
    setTrainingStep("Starting training...");

    const params = optimizeHyperparameters();
    setOptimizedParams(params);

    try {
      // step 1: prepare the data
      setTrainingStep("Preparing data...");
      
      // convert text to numbers for categorical stuff
      const encodingMaps: { [key: string]: { [key: string]: number } } = {};
      const featureStats: { [key: string]: { mean: number; std: number } } = {};
      
      featureConfig.features.forEach(feature => {
        if (featureConfig.featureTypes[feature] === 'categorical') {
          // map each unique value to a number
          const uniqueValues = [...new Set(data.map(row => String(row[feature] || 'unknown')))];
          const map: { [key: string]: number } = {};
          uniqueValues.forEach((value, idx) => {
            map[value] = idx;
          });
          encodingMaps[feature] = map;
        } else {
          // calculate mean and standard deviation for numeric features
          const values = data.map(row => Number(row[feature]) || 0);
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
          const std = Math.sqrt(variance);
          featureStats[feature] = { mean, std: std || 1 };
        }
      });

      // step 2: turn all features into numbers and normalize them
      setTrainingStep("Encoding features...");
      const features = data.map(row => 
        featureConfig.features.map(feature => {
          const value = row[feature];
          if (featureConfig.featureTypes[feature] === 'categorical') {
            const strValue = String(value || 'unknown');
            return encodingMaps[feature][strValue] ?? 0;
          } else {
            const numValue = Number(value) || 0;
            const { mean, std } = featureStats[feature];
            return (numValue - mean) / std; // normalize
          }
        })
      );

      // step 3: prepare the target labels
      setTrainingStep("Processing target variable...");
      let labels: number[];
      let targetEncoding: { [key: string]: number } = {};

      if (featureConfig.featureTypes[featureConfig.target] === 'categorical') {
        // categorical target - just map to numbers
        const uniqueTargets = [...new Set(data.map(row => String(row[featureConfig.target] || 'unknown')))];
        if (uniqueTargets.length < 2) {
          throw new Error("Target variable must have at least 2 unique values");
        }
        uniqueTargets.forEach((value, idx) => {
          targetEncoding[value] = idx;
        });
        labels = data.map(row => targetEncoding[String(row[featureConfig.target] || 'unknown')]);
      } else {
        // numeric target - split at median
        const numericTargets = data.map(row => Number(row[featureConfig.target]) || 0);
        const sorted = [...numericTargets].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        labels = numericTargets.map(val => (val > median ? 1 : 0));
        targetEncoding = { 
          [`> ${median.toFixed(3)}`]: 1, 
          [`≤ ${median.toFixed(3)}`]: 0 
        };
      }

      // step 4: shuffle data randomly using fisher-yates algorithm
      setTrainingStep("Shuffling data...");
      const indices = Array.from({ length: data.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }

      // split 80/20 for train/test
      const splitIdx = Math.floor(data.length * 0.8);
      const trainIndices = indices.slice(0, splitIdx);
      const testIndices = indices.slice(splitIdx);

      const trainX = trainIndices.map(i => features[i]);
      const trainY = trainIndices.map(i => labels[i]);
      const testX = testIndices.map(i => features[i]);
      const testY = testIndices.map(i => labels[i]);

      // step 5: train the random forest classifier
      setTrainingStep(`Training ${params.nTrees} decision trees...`);
      const options = {
        nEstimators: params.nTrees,
        maxDepth: params.maxDepth,
        minNumSamples: params.minSamples,
        seed: 42, // consistent results
      };

      const classifier = new RFClassifier(options);
      classifier.train(trainX, trainY);

      // save everything we need for predictions later
      (classifier as any).options = {
        ...options,
        encodingMaps,
        targetEncoding,
        featureConfig,
        featureStats,
      };

      // step 6: test the model on unseen data
      setTrainingStep("Evaluating model...");
      const predictions = classifier.predict(testX);
      const accuracy = predictions.filter((pred: number, idx: number) => pred === testY[idx]).length / testY.length;

      // build confusion matrix
      let tp = 0, tn = 0, fp = 0, fn = 0;
      predictions.forEach((pred: number, idx: number) => {
        if (pred === 1 && testY[idx] === 1) tp++;
        else if (pred === 0 && testY[idx] === 0) tn++;
        else if (pred === 1 && testY[idx] === 0) fp++;
        else fn++;
      });

      // calculate metrics
      const precision = tp > 0 ? tp / (tp + fp) : 0;
      const recall = tp > 0 ? tp / (tp + fn) : 0;
      const f1Score = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

      // calculate ROC curve points
      const rocCurve: { fpr: number; tpr: number }[] = [];
      const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);
      
      thresholds.forEach(threshold => {
        let tp = 0, fp = 0, tn = 0, fn = 0;
        
        predictions.forEach((pred: number, idx: number) => {
          const actual = testY[idx];
          const predicted = pred;
          
          if (predicted === 1 && actual === 1) tp++;
          else if (predicted === 1 && actual === 0) fp++;
          else if (predicted === 0 && actual === 0) tn++;
          else if (predicted === 0 && actual === 1) fn++;
        });
        
        const tpr = tp + fn > 0 ? tp / (tp + fn) : 0;
        const fpr = fp + tn > 0 ? fp / (fp + tn) : 0;
        rocCurve.push({ fpr, tpr });
      });

      // calculate AUC (area under curve)
      rocCurve.sort((a, b) => a.fpr - b.fpr);
      let auc = 0;
      for (let i = 1; i < rocCurve.length; i++) {
        const width = rocCurve[i].fpr - rocCurve[i - 1].fpr;
        const height = (rocCurve[i].tpr + rocCurve[i - 1].tpr) / 2;
        auc += width * height;
      }

      const modelMetrics = {
        accuracy: accuracy * 100,
        precision: precision * 100,
        recall: recall * 100,
        f1Score: f1Score * 100,
        trainSize: trainX.length,
        testSize: testX.length,
        targetEncoding,
        confusionMatrix: { tp, tn, fp, fn },
        rocCurve,
        auc,
      };

      // step 7: figure out which features matter most using permutation importance
      setTrainingStep("Calculating feature importance...");
      const baselineAccuracy = accuracy;
      const featureImportance = await Promise.all(
        featureConfig.features.map(async (name, idx) => {
          // shuffle this feature and see how much worse the model gets
          const permutedX = testX.map(row => {
            const newRow = [...row];
            newRow[idx] = testX[Math.floor(Math.random() * testX.length)][idx];
            return newRow;
          });
          const permutedPreds = classifier.predict(permutedX);
          const permutedAccuracy = permutedPreds.filter((pred: number, i: number) => pred === testY[i]).length / testY.length;
          const importance = Math.max(0, baselineAccuracy - permutedAccuracy);
          return { feature: name, importance };
        })
      );

      // convert to percentages
      const totalImportance = featureImportance.reduce((sum, f) => sum + f.importance, 0);
      const normalizedImportance = featureImportance.map(f => ({
        ...f,
        importance: totalImportance > 0 ? (f.importance / totalImportance) * 100 : 0,
      }));

      setTrainingStep("Done!");
      
      // show results
      const accuracyPercent = (accuracy * 100).toFixed(1);
      toast.success(`Model trained successfully! Accuracy: ${accuracyPercent}%`);
      onModelTrained(classifier, modelMetrics, normalizedImportance);
    } catch (error) {
      console.error("Training error:", error);
      toast.error(error instanceof Error ? error.message : "Training failed");
    } finally {
      setIsTraining(false);
      setTrainingStep("");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium">Random Forest Training</h3>
            <p className="text-xs text-muted-foreground">Auto-optimized</p>
          </div>
          <Badge variant="outline" className="text-xs">{currentVersion}</Badge>
        </div>

        <div className="space-y-3">
          {optimizedParams && (
            <div className="p-2 bg-muted rounded text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-muted-foreground">Trees</p>
                  <p className="font-medium">{optimizedParams.nTrees}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Depth</p>
                  <p className="font-medium">{optimizedParams.maxDepth}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Min</p>
                  <p className="font-medium">{optimizedParams.minSamples}</p>
                </div>
              </div>
            </div>
          )}

          {isTraining && trainingStep && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{trainingStep}</span>
            </div>
          )}

          <Button
            onClick={trainModel}
            disabled={isTraining || data.length === 0}
            className="w-full"
            size="sm"
          >
            {isTraining ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                Training...
              </>
            ) : (
              <>
                <Play className="w-3 h-3 mr-2" />
                Train Model
              </>
            )}
          </Button>
        </div>
      </Card>

      {metrics && (
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Performance</h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 bg-muted rounded">
              <p className="text-xs text-muted-foreground">Accuracy</p>
              <p className="text-sm font-medium mt-1">
                {metrics.accuracy.toFixed(1)}%
              </p>
            </div>
            <div className="p-2 bg-muted rounded">
              <p className="text-xs text-muted-foreground">Precision</p>
              <p className="text-sm font-medium mt-1">
                {metrics.precision.toFixed(1)}%
              </p>
            </div>
            <div className="p-2 bg-muted rounded">
              <p className="text-xs text-muted-foreground">Recall</p>
              <p className="text-sm font-medium mt-1">
                {metrics.recall.toFixed(1)}%
              </p>
            </div>
            <div className="p-2 bg-muted rounded">
              <p className="text-xs text-muted-foreground">F1</p>
              <p className="text-sm font-medium mt-1">
                {metrics.f1Score.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ModelTraining;
