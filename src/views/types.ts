// shared types for data analysis and model training

export interface ResearchData {
  [key: string]: number | string;
}

export interface FeatureConfig {
  features: string[];
  target: string;
  featureTypes: { [key: string]: 'numeric' | 'categorical' };
}

export interface ModelVersion {
  id: string;
  version: string;
  timestamp: Date;
  model: any;
  metrics: any;
  featureImportance: any[];
  datasetSize: number;
  featureConfig: FeatureConfig;
}

export interface AnalysisData {
  [key: string]: number | string;
}
