/**
 * Random Forest Model Training Component
 * Handles data preprocessing, training, evaluation, and feature importance calculation
 * Auto-optimizes hyperparameters based on dataset size
 */
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
  // training progress tracking
  const [isTraining, setIsTraining] = useState(false);
   const [currentStep, setCurrentStep] = useState("");
   const [hyperparameters, setHyperparameters] = useState<any>(null);

  /**
   * Auto-optimize Random Forest hyperparameters based on dataset characteristics
   * Considers dataset size and number of features to balance performance vs accuracy
   */
  const optimizeHyperparameters = () => {
    const datasetSize = data.length;
    const featureCount = featureConfig.features.length;

    // baseline hyperparameters
    let numberOfTrees = 100;
    let maxTreeDepth = 10;
    let minSamplesPerLeaf = 2;

    // scale based on dataset size (smaller datasets need less complexity)
    if (datasetSize < 100) {
      numberOfTrees = 50;
       maxTreeDepth = 5;
      minSamplesPerLeaf = 3;
    } else if (datasetSize < 500) {
      numberOfTrees = 100;
      maxTreeDepth = 8;
      minSamplesPerLeaf = 2;
    } else if (datasetSize < 1000) {
      numberOfTrees = 150;
      maxTreeDepth = 12;
      minSamplesPerLeaf = 2;
    } else {
      numberOfTrees = 200;
      maxTreeDepth = 15;
      minSamplesPerLeaf = 3;
    }

    // high-dimensional data benefits from deeper trees and more estimators
    if (featureCount > 10) {
      maxTreeDepth = Math.min(maxTreeDepth + 3, 20);
      numberOfTrees = Math.min(numberOfTrees + 50, 250);
    }

    return { nTrees: numberOfTrees, maxDepth: maxTreeDepth, minSamples: minSamplesPerLeaf };
  };

  /**
   * Main training pipeline - preprocesses data, trains Random Forest, evaluates performance
   */
  const trainModel = async () => {
    // minimum dataset size check
    if (data.length < 10) {
      toast.error("Need at least 10 samples to train a reliable model");
      return;
    }

    setIsTraining(true);
    setCurrentStep("Initializing training...");

    const params = optimizeHyperparameters();
    setHyperparameters(params);

    try {
      // STEP 1: Data preprocessing and encoding
      setCurrentStep("Preparing data...");
      
      // maps for categorical encoding and normalization stats
      const categoricalEncodings: { [key: string]: { [key: string]: number } } = {};
      const numericStats: { [key: string]: { mean: number; std: number } } = {};
      
      featureConfig.features.forEach(featureName => {
        if (featureConfig.featureTypes[featureName] === 'categorical') {
          // label encoding: map each unique category to an integer
          const uniqueCategories = [...new Set(data.map(row => String(row[featureName] || 'unknown')))];
          const encodingMap: { [key: string]: number } = {};
          uniqueCategories.forEach((category, index) => {
            encodingMap[category] = index;
          });
          categoricalEncodings[featureName] = encodingMap;
        } else {
          // z-score normalization for numeric features
          const values = data.map(row => Number(row[featureName]) || 0);
          const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
          const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
          const stdDev = Math.sqrt(variance);
          numericStats[featureName] = { mean, std: stdDev || 1 }; // prevent division by zero
        }
      });

      // STEP 2: Feature encoding and normalization
      setCurrentStep("Encoding and normalizing features...");
      const featureMatrix = data.map(row => 
        featureConfig.features.map(featureName => {
          const rawValue = row[featureName];
          if (featureConfig.featureTypes[featureName] === 'categorical') {
            const stringValue = String(rawValue || 'unknown');
            return categoricalEncodings[featureName][stringValue] ?? 0;
          } else {
            const numericValue = Number(rawValue) || 0;
            const { mean, std } = numericStats[featureName];
            return (numericValue - mean) / std; // standardize to z-scores
          }
        })
      );

      // STEP 3: Target variable preparation
      setCurrentStep("Processing target variable...");
      let targetLabels: number[];
      let targetLabelMapping: { [key: string]: number } = {};

      if (featureConfig.featureTypes[featureConfig.target] === 'categorical') {
        // categorical classification
        const uniqueClasses = [...new Set(data.map(row => String(row[featureConfig.target] || 'unknown')))];
        if (uniqueClasses.length < 2) {
          throw new Error("Target variable needs at least 2 distinct classes");
        }
        uniqueClasses.forEach((className, classIndex) => {
          targetLabelMapping[className] = classIndex;
        });
        targetLabels = data.map(row => targetLabelMapping[String(row[featureConfig.target] || 'unknown')]);
      } else {
        // numeric target - binarize at median for classification
        const numericTargetValues = data.map(row => Number(row[featureConfig.target]) || 0);
        const sortedValues = [...numericTargetValues].sort((a, b) => a - b);
        const medianValue = sortedValues[Math.floor(sortedValues.length / 2)];
        targetLabels = numericTargetValues.map(val => (val > medianValue ? 1 : 0));
        targetLabelMapping = { 
          [`> ${medianValue.toFixed(3)}`]: 1, 
          [`≤ ${medianValue.toFixed(3)}`]: 0 
        };
      }

      // STEP 4: Train/test split with Fisher-Yates shuffle
      setCurrentStep("Creating train/test split...");
      const sampleIndices = Array.from({ length: data.length }, (_, idx) => idx);
      // Fisher-Yates shuffle for randomization
      for (let i = sampleIndices.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        [sampleIndices[i], sampleIndices[randomIndex]] = [sampleIndices[randomIndex], sampleIndices[i]];
      }

      // 80/20 split for training/testing
      const splitIndex = Math.floor(data.length * 0.8);
      const trainingIndices = sampleIndices.slice(0, splitIndex);
      const testingIndices = sampleIndices.slice(splitIndex);

      const X_train = trainingIndices.map(i => featureMatrix[i]);
      const y_train = trainingIndices.map(i => targetLabels[i]);
      const X_test = testingIndices.map(i => featureMatrix[i]);
      const y_test = testingIndices.map(i => targetLabels[i]);

      // STEP 5: Train Random Forest Classifier
      setCurrentStep(`Training ${params.nTrees} decision trees...`);
      const forestOptions = {
        nEstimators: params.nTrees,
        maxDepth: params.maxDepth,
        minNumSamples: params.minSamples,
        seed: 42, // for reproducibility
      };

      const randomForest = new RFClassifier(forestOptions);
      randomForest.train(X_train, y_train);

      // attach preprocessing metadata to model for later predictions
      (randomForest as any).options = {
        ...forestOptions,
        encodingMaps: categoricalEncodings,
        targetEncoding: targetLabelMapping,
        featureConfig,
        featureStats: numericStats,
      };

      // STEP 6: Evaluate on held-out test set
      setCurrentStep("Evaluating model performance...");
      const testPredictions = randomForest.predict(X_test);
      const accuracy = testPredictions.filter((pred: number, idx: number) => pred === y_test[idx]).length / y_test.length;

      // confusion matrix calculation
      let truePositives = 0, trueNegatives = 0, falsePositives = 0, falseNegatives = 0;
      testPredictions.forEach((predictedLabel: number, idx: number) => {
        if (predictedLabel === 1 && y_test[idx] === 1) truePositives++;
        else if (predictedLabel === 0 && y_test[idx] === 0) trueNegatives++;
        else if (predictedLabel === 1 && y_test[idx] === 0) falsePositives++;
        else falseNegatives++;
      });

      // classification metrics
      const precision = truePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;
      const recall = truePositives > 0 ? truePositives / (truePositives + falseNegatives) : 0;
      const f1Score = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

      // ROC curve generation (for binary classification)
      const rocPoints: { fpr: number; tpr: number }[] = [];
      const thresholdSteps = Array.from({ length: 21 }, (_, i) => i / 20);
      
      thresholdSteps.forEach(threshold => {
        let tp = 0, fp = 0, tn = 0, fn = 0;
        
        testPredictions.forEach((predictedLabel: number, idx: number) => {
          const actualLabel = y_test[idx];
          
          if (predictedLabel === 1 && actualLabel === 1) tp++;
          else if (predictedLabel === 1 && actualLabel === 0) fp++;
          else if (predictedLabel === 0 && actualLabel === 0) tn++;
          else if (predictedLabel === 0 && actualLabel === 1) fn++;
        });
        
        const truePositiveRate = tp + fn > 0 ? tp / (tp + fn) : 0;
        const falsePositiveRate = fp + tn > 0 ? fp / (fp + tn) : 0;
        rocPoints.push({ fpr: falsePositiveRate, tpr: truePositiveRate });
      });

      // AUC calculation using trapezoidal rule
      rocPoints.sort((a, b) => a.fpr - b.fpr);
      let areaUnderCurve = 0;
      for (let i = 1; i < rocPoints.length; i++) {
        const deltaX = rocPoints[i].fpr - rocPoints[i - 1].fpr;
        const avgHeight = (rocPoints[i].tpr + rocPoints[i - 1].tpr) / 2;
        areaUnderCurve += deltaX * avgHeight;
      }

      const evaluationMetrics = {
        accuracy: accuracy * 100,
        precision: precision * 100,
        recall: recall * 100,
        f1Score: f1Score * 100,
        trainSize: X_train.length,
        testSize: X_test.length,
        targetEncoding: targetLabelMapping,
        confusionMatrix: { 
          tp: truePositives, 
          tn: trueNegatives, 
          fp: falsePositives, 
          fn: falseNegatives 
        },
        rocCurve: rocPoints,
        auc: areaUnderCurve,
      };

      // STEP 7: Feature importance via permutation method
      setCurrentStep("Calculating feature importance...");
      const baselinePerformance = accuracy;
      const importanceScores = await Promise.all(
        featureConfig.features.map(async (featureName, featureIndex) => {
          // permutation test: shuffle this feature and measure performance drop
          const permutedFeatures = X_test.map(row => {
            const modifiedRow = [...row];
            const randomSampleIndex = Math.floor(Math.random() * X_test.length);
            modifiedRow[featureIndex] = X_test[randomSampleIndex][featureIndex];
            return modifiedRow;
          });
          const permutedPredictions = randomForest.predict(permutedFeatures);
          const permutedAccuracy = permutedPredictions.filter((pred: number, i: number) => pred === y_test[i]).length / y_test.length;
          const importanceScore = Math.max(0, baselinePerformance - permutedAccuracy);
          return { feature: featureName, importance: importanceScore };
        })
      );

      // normalize to percentages
      const totalImportance = importanceScores.reduce((sum, item) => sum + item.importance, 0);
      const normalizedImportance = importanceScores.map(item => ({
        ...item,
        importance: totalImportance > 0 ? (item.importance / totalImportance) * 100 : 0,
      }));

      setCurrentStep("Training complete!");
      
      const accuracyDisplay = (accuracy * 100).toFixed(1);
      toast.success(`Training complete! Test accuracy: ${accuracyDisplay}%`);
      onModelTrained(randomForest, evaluationMetrics, normalizedImportance);
    } catch (error) {
      console.error("Training pipeline error:", error);
      const errorMessage = error instanceof Error ? error.message : "Training failed unexpectedly";
      toast.error(errorMessage);
    } finally {
      setIsTraining(false);
      setCurrentStep("");
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
          {hyperparameters && (
            <div className="p-2 bg-muted rounded text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-muted-foreground">Trees</p>
                  <p className="font-medium">{hyperparameters.nTrees}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max Depth</p>
                  <p className="font-medium">{hyperparameters.maxDepth}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Min Samples</p>
                  <p className="font-medium">{hyperparameters.minSamples}</p>
                </div>
              </div>
            </div>
          )}

          {isTraining && currentStep && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{currentStep}</span>
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
