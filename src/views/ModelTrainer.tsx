/**
 * Main AI Model Training Interface
 * Handles the full ML workflow: data upload -> training -> prediction -> results
 * Built with shadcn/ui components
 */
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
  const nav = useNavigate();
  
  // state management for the whole training pipeline
  const [data, setData] = useState<ResearchData[]>([]);
  const [config, setConfig] = useState<FeatureConfig | null>(null);
  const [trainedModel, setTrainedModel] = useState<any>(null);
  const [recentPredictions, setRecentPredictions] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [featureImportanceData, setFeatureImportanceData] = useState<any[]>([]);
  const [modelVersionHistory, setModelVersionHistory] = useState<ModelVersion[]>([]);
  const [currentModelVersion, setCurrentModelVersion] = useState<string>("v1.0");

  // callback when user uploads training data
  const onDataUpload = (uploadedData: ResearchData[], uploadedConfig: FeatureConfig) => {
    setData(uploadedData);
    setConfig(uploadedConfig);
    toast.success(`Got ${uploadedData.length} rows with ${uploadedConfig.features.length} features`);
  };

  // callback after successful training - save model snapshot
  const onModelTrained = (model: any, modelMetrics: any, featureImportance: any[]) => {
    setTrainedModel(model);
    setPerformanceMetrics(modelMetrics);
    setFeatureImportanceData(featureImportance);

    // create version snapshot for history tracking
    const versionSnapshot: ModelVersion = {
      id: Date.now().toString(),
      version: currentModelVersion,
      timestamp: new Date(),
      model: model,
      metrics: modelMetrics,
      featureImportance: featureImportance,
      datasetSize: data.length,
      featureConfig: config!,
    };

    setModelVersionHistory(prev => [versionSnapshot, ...prev]);
    
    // auto-increment version number (v1.0 -> v1.1 -> v1.2, etc)
    const versionNumber = parseFloat(currentModelVersion.substring(1)) + 0.1;
    setCurrentModelVersion(`v${versionNumber.toFixed(1)}`);

    toast.success(`Model ${versionSnapshot.version} trained successfully!`);
  };

  // store new prediction in history (keep last 10 for performance)
  const onPrediction = (predictionResult: any) => {
    setRecentPredictions((prev) => [predictionResult, ...prev].slice(0, 10));
  };

  // restore a previous model version from history
  const loadVersion = (versionToLoad: ModelVersion) => {
    setTrainedModel(versionToLoad.model);
    setPerformanceMetrics(versionToLoad.metrics);
    setFeatureImportanceData(versionToLoad.featureImportance);
    setConfig(versionToLoad.featureConfig);
    setData([]); // clear current data - user needs to upload new data to continue training
    toast.success(`Loaded ${versionToLoad.version} - upload new data to continue training`);
  };

  // import model from saved file
  const onModelLoaded = (model: any, modelMetrics: any, featureImportance: any[], modelConfig: any) => {
    setTrainedModel(model);
    setPerformanceMetrics(modelMetrics);
    setFeatureImportanceData(featureImportance);
    setConfig(modelConfig);
    setData([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => nav("/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Model Training</h2>
            {modelVersionHistory.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {modelVersionHistory.length} version{modelVersionHistory.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="upload" className="text-xs">
              Upload
            </TabsTrigger>
            <TabsTrigger value="train" disabled={data.length === 0} className="text-xs">
              Train
            </TabsTrigger>
            <TabsTrigger value="predict" disabled={!trainedModel} className="text-xs">
              Predict
            </TabsTrigger>
            <TabsTrigger value="results" disabled={recentPredictions.length === 0} className="text-xs">
              Results
            </TabsTrigger>
            <TabsTrigger value="versions" disabled={modelVersionHistory.length === 0} className="text-xs">
              Versions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="mb-3">
              <ModelSaveLoad
                model={trainedModel}
                metrics={performanceMetrics}
                featureImportance={featureImportanceData}
                featureConfig={config}
                onModelLoaded={onModelLoaded}
              />
            </div>
            <FileUpload onDataLoaded={onDataUpload} />
            {data.length > 0 && config && (
              <DataPreview data={data} featureConfig={config} />
            )}
          </TabsContent>

          <TabsContent value="train" className="space-y-4">
            <ModelTraining
              data={data}
              featureConfig={config!}
              onModelTrained={onModelTrained}
              metrics={performanceMetrics}
              currentVersion={currentModelVersion}
            />
            {featureImportanceData.length > 0 && (
              <FeatureImportance data={featureImportanceData} />
            )}
            {trainedModel && (
              <div className="pt-2">
                <ModelSaveLoad
                  model={trainedModel}
                  metrics={performanceMetrics}
                  featureImportance={featureImportanceData}
                  featureConfig={config}
                  onModelLoaded={onModelLoaded}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="predict">
            <PredictionForm 
              model={trainedModel} 
              featureConfig={config!}
              onPrediction={onPrediction} 
            />
          </TabsContent>

          <TabsContent value="results">
            <ResultsVisualization
              predictions={recentPredictions}
              metrics={performanceMetrics}
            />
          </TabsContent>

          <TabsContent value="versions">
            <ModelVersions
              versions={modelVersionHistory}
              onLoadVersion={loadVersion}
              currentVersion={currentModelVersion}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AITraining;
