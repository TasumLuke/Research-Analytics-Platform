// model training page - where the magic happens
// using shadcn ui - https://www.shadcn.io/template
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
  
  // keeping track of all our stuff
  const [data, setData] = useState<ResearchData[]>([]);
  const [config, setConfig] = useState<FeatureConfig | null>(null);
  const [trainedModel, setTrainedModel] = useState<any>(null);
  const [preds, setPreds] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [importance, setImportance] = useState<any[]>([]);
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [currVersion, setCurrVersion] = useState<string>("v1.0");

  // when they upload data
  const onDataUpload = (uploadedData: ResearchData[], uploadedConfig: FeatureConfig) => {
    setData(uploadedData);
    setConfig(uploadedConfig);
    toast.success(`Got ${uploadedData.length} rows with ${uploadedConfig.features.length} features`);
  };

  // after training finishes
  const onModelTrained = (model: any, modelMetrics: any, featureImportance: any[]) => {
    setTrainedModel(model);
    setMetrics(modelMetrics);
    setImportance(featureImportance);

    // save it
    const newVer: ModelVersion = {
      id: Date.now().toString(),
      version: currVersion,
      timestamp: new Date(),
      model: model,
      metrics: modelMetrics,
      featureImportance: featureImportance,
      datasetSize: data.length,
      featureConfig: config!,
    };

    setVersions(prev => [newVer, ...prev]);
    
    // increment version
    const verNum = parseFloat(currVersion.substring(1)) + 0.1;
    setCurrVersion(`v${verNum.toFixed(1)}`);

    toast.success(`Model ${newVer.version} trained!`);
  };

  // when making predictions
  const onPrediction = (pred: any) => {
    // just keep the last 10
    setPreds((prev) => [pred, ...prev].slice(0, 10));
  };

  // load old model version
  const loadVersion = (ver: ModelVersion) => {
    setTrainedModel(ver.model);
    setMetrics(ver.metrics);
    setImportance(ver.featureImportance);
    setConfig(ver.featureConfig);
    setData([]);
    toast.success(`Loaded ${ver.version} - upload new data to keep training`);
  };

  // load from file
  const onModelLoaded = (model: any, modelMetrics: any, featureImportance: any[], modelConfig: any) => {
    setTrainedModel(model);
    setMetrics(modelMetrics);
    setImportance(featureImportance);
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
            {versions.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {versions.length} version{versions.length !== 1 ? 's' : ''}
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
            <TabsTrigger value="results" disabled={preds.length === 0} className="text-xs">
              Results
            </TabsTrigger>
            <TabsTrigger value="versions" disabled={versions.length === 0} className="text-xs">
              Versions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="mb-3">
              <ModelSaveLoad
                model={trainedModel}
                metrics={metrics}
                featureImportance={importance}
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
              metrics={metrics}
              currentVersion={currVersion}
            />
            {importance.length > 0 && (
              <FeatureImportance data={importance} />
            )}
            {trainedModel && (
              <div className="pt-2">
                <ModelSaveLoad
                  model={trainedModel}
                  metrics={metrics}
                  featureImportance={importance}
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
              predictions={preds}
              metrics={metrics}
            />
          </TabsContent>

          <TabsContent value="versions">
            <ModelVersions
              versions={versions}
              onLoadVersion={loadVersion}
              currentVersion={currVersion}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AITraining;
