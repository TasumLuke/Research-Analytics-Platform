// stats analysis page
// shadcn components - https://www.shadcn.io/template
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
  const nav = useNavigate();
  
  // storing uploaded data and stuff
  const [data, setData] = useState<AnalysisData[]>([]);
  const [cols, setCols] = useState<string[]>([]);
  const [colTypes, setColTypes] = useState<{ [key: string]: 'numeric' | 'categorical' }>({});

  // when data gets uploaded
  const onDataLoaded = (loadedData: AnalysisData[], columns: string[], types: { [key: string]: 'numeric' | 'categorical' }) => {
    setData(loadedData);
    setCols(columns);
    setColTypes(types);
    toast.success(`Got ${loadedData.length} rows with ${columns.length} columns`);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => nav("/")} className="mb-4">
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
            <DataUploadAnalysis onDataLoaded={onDataLoaded} />
          </TabsContent>

          <TabsContent value="descriptive">
            <DescriptiveStats 
              data={data} 
              columns={cols} 
              columnTypes={colTypes}
            />
          </TabsContent>

          <TabsContent value="tests">
            <StatisticalTests 
              data={data} 
              columns={cols} 
              columnTypes={colTypes}
            />
          </TabsContent>

          <TabsContent value="visualize">
            <DataVisualization 
              data={data} 
              columns={cols} 
              columnTypes={colTypes}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DataAnalysis;
