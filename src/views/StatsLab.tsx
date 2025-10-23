// dashboard for running statistical analysis
// ui components from https://www.shadcn.io/template (open source)
import { useState } from "react";
import { Button } from "@/components/user-interface/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/user-interface/tabs";
import DataUploadAnalysis from "@/components/analysis/DataUploadAnalysis";
import StatisticalTests from "@/components/analysis/StatisticalTests";
import DataVisualization from "@/components/analysis/DataVisualization";
import DescriptiveStats from "@/components/analysis/DescriptiveStats";
import { toast } from "sonner";

import { AnalysisData } from "@/views/types";

const DataAnalysis = () => {
  const navigate = useNavigate();
  
  // keep track of uploaded data
  const [data, setData] = useState<AnalysisData[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnTypes, setColumnTypes] = useState<{ [key: string]: 'numeric' | 'categorical' }>({});

  // callback when data gets loaded
  const handleDataLoaded = (loadedData: AnalysisData[], cols: string[], types: { [key: string]: 'numeric' | 'categorical' }) => {
    setData(loadedData);
    setColumns(cols);
    setColumnTypes(types);
    toast.success(`Got ${loadedData.length} rows with ${cols.length} columns`);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-semibold">Data Analysis</h2>
        </div>

        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="upload" className="text-xs">
              Upload
            </TabsTrigger>
            <TabsTrigger value="descriptive" disabled={data.length === 0} className="text-xs">
              Stats
            </TabsTrigger>
            <TabsTrigger value="tests" disabled={data.length === 0} className="text-xs">
              Tests
            </TabsTrigger>
            <TabsTrigger value="visualize" disabled={data.length === 0} className="text-xs">
              Charts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <DataUploadAnalysis onDataLoaded={handleDataLoaded} />
          </TabsContent>

          <TabsContent value="descriptive">
            <DescriptiveStats 
              data={data} 
              columns={columns} 
              columnTypes={columnTypes}
            />
          </TabsContent>

          <TabsContent value="tests">
            <StatisticalTests 
              data={data} 
              columns={columns} 
              columnTypes={columnTypes}
            />
          </TabsContent>

          <TabsContent value="visualize">
            <DataVisualization 
              data={data} 
              columns={columns} 
              columnTypes={columnTypes}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DataAnalysis;
