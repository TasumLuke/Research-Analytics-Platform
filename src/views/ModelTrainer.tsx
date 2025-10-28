// dashboard for training machine learning models
// ui components from https://www.shadcn.io/template (open source)
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/user-interface/tabs";
import { Badge } from "@/components/user-interface/badge";
import { Button } from "@/components/user-interface/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FileUpload from "@/components/FileUpload";
import DataPreview from "@/components/DataPreview";
import ModelTraining from "@/components/ModelTraining";
import PredictionForm from "@/components/PredictionForm";
import ResultsVisualization from "@/components/ResultsVisualization";
import FeatureImportance from "@/components/FeatureImportance";
import ModelVersions from "@/components/ModelVersions";
import ModelSaveLoad from "@/components/ModelSaveLoad";
import { toast } from "sonner";

import { ResearchData, FeatureConfig, ModelVersion } from "@/views/types";

const AITraining = () => {
  const navigate = useNavigate();
  
  // main state variables to keep track of everything
  const [trainingData, setTrainingData] = useState<ResearchData[]>([]);
  const [featureConfig, setFeatureConfig] = useState<FeatureConfig | null>(null);
  const [model, setModel] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [modelMetrics, setModelMetrics] = useState<any>(null);
  const [featureImportance, setFeatureImportance] = useState<any[]>([]);
  const [modelVersions, setModelVersions] = useState<ModelVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string>("v1.0");

  // when user uploads data
  const handleDataUpload = (data: ResearchData[], config: FeatureConfig) => {
    setTrainingData(data);
    setFeatureConfig(config);
    toast.success(`Got ${data.length} rows with ${config.features.length} features loaded up`);
  };

  // when model finishes training
  const handleModelTrained = (trainedModel: any, metrics: any, importance: any[]) => {
    setModel(trainedModel);
    setModelMetrics(metrics);
    setFeatureImportance(importance);

    // save this version
    const newVersion: ModelVersion = {
      id: Date.now().toString(),
      version: currentVersion,
      timestamp: new Date(),
      model: trainedModel,
      metrics,
      featureImportance: importance,
      datasetSize: trainingData.length,
      featureConfig: featureConfig!,
    };

    setModelVersions(prev => [newVersion, ...prev]);
    
    // bump up version number
    const versionNum = parseFloat(currentVersion.substring(1)) + 0.1;
    setCurrentVersion(`v${versionNum.toFixed(1)}`);

    toast.success(`Model ${newVersion.version} is ready to go!`);
  };

  // when user makes a prediction
  const handlePrediction = (prediction: any) => {
    // keep last 10 predictions
    setPredictions((prev) => [prediction, ...prev].slice(0, 10));
  };

  // load an old version of the model
  const loadModelVersion = (version: ModelVersion) => {
    setModel(version.model);
    setModelMetrics(version.metrics);
    setFeatureImportance(version.featureImportance);
    setFeatureConfig(version.featureConfig);
    setTrainingData([]);
    toast.success(`Loaded up model ${version.version} - throw in new data to train more`);
  };

  // load a saved model file
  const handleModelLoaded = (loadedModel: any, loadedMetrics: any, loadedImportance: any[], loadedConfig: any) => {
    setModel(loadedModel);
    setModelMetrics(loadedMetrics);
    setFeatureImportance(loadedImportance);
    setFeatureConfig(loadedConfig);
    setTrainingData([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Model Training</h2>
            {modelVersions.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {modelVersions.length} version{modelVersions.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="upload" className="text-xs">
              Upload
            </TabsTrigger>
            <TabsTrigger value="train" disabled={trainingData.length === 0} className="text-xs">
              Train
            </TabsTrigger>
            <TabsTrigger value="predict" disabled={!model} className="text-xs">
              Predict
            </TabsTrigger>
            <TabsTrigger value="results" disabled={predictions.length === 0} className="text-xs">
              Results
            </TabsTrigger>
            <TabsTrigger value="versions" disabled={modelVersions.length === 0} className="text-xs">
              Versions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="mb-3">
              <ModelSaveLoad
                model={model}
                metrics={modelMetrics}
                featureImportance={featureImportance}
                featureConfig={featureConfig}
                onModelLoaded={handleModelLoaded}
              />
            </div>
            <FileUpload onDataLoaded={handleDataUpload} />
            {trainingData.length > 0 && featureConfig && (
              <DataPreview data={trainingData} featureConfig={featureConfig} />
            )}
          </TabsContent>

          <TabsContent value="train" className="space-y-4">
            <ModelTraining
              data={trainingData}
              featureConfig={featureConfig!}
              onModelTrained={handleModelTrained}
              metrics={modelMetrics}
              currentVersion={currentVersion}
            />
            {featureImportance.length > 0 && (
              <FeatureImportance data={featureImportance} />
            )}
            {model && (
              <div className="pt-2">
                <ModelSaveLoad
                  model={model}
                  metrics={modelMetrics}
                  featureImportance={featureImportance}
                  featureConfig={featureConfig}
                  onModelLoaded={handleModelLoaded}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="predict">
            <PredictionForm 
              model={model} 
              featureConfig={featureConfig!}
              onPrediction={handlePrediction} 
            />
          </TabsContent>

          <TabsContent value="results">
            <ResultsVisualization
              predictions={predictions}
              metrics={modelMetrics}
            />
          </TabsContent>

          <TabsContent value="versions">
            <ModelVersions
              versions={modelVersions}
              onLoadVersion={loadModelVersion}
              currentVersion={currentVersion}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AITraining;
