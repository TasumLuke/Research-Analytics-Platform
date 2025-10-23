// component for uploading and configuring CSV files
import { useState } from "react";
import { Button } from "@/components/user-interface/button";
import { Card } from "@/components/user-interface/card";
import { Checkbox } from "@/components/user-interface/checkbox";
import { Label } from "@/components/user-interface/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/user-interface/select";
import Papa from "papaparse";
import { toast } from "sonner";
import { ResearchData, FeatureConfig } from "@/views/types";

interface FileUploadProps {
  onDataLoaded: (data: ResearchData[], config: FeatureConfig) => void;
}

const FileUpload = ({ onDataLoaded }: FileUploadProps) => {
  // track drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // store parsed csv data
  const [csvData, setCsvData] = useState<ResearchData[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  
  // user selections for model
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [targetVariable, setTargetVariable] = useState<string>("");
  const [featureTypes, setFeatureTypes] = useState<{ [key: string]: 'numeric' | 'categorical' }>({});
  const [showConfiguration, setShowConfiguration] = useState(false);

  // user drags a file over
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/csv") {
      processFile(file);
    } else {
      toast.error("Please upload a CSV file");
    }
  };

  // user clicks browse button
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // parse the csv file
  const processFile = (file: File) => {
    setUploadedFile(file);
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as ResearchData[];
        if (data.length === 0) {
          toast.error("CSV file is empty");
          return;
        }

        // get column names from first row
        const cols = Object.keys(data[0]);
        setCsvData(data);
        setColumns(cols);
        
        // figure out if each column is number or text
        const types: { [key: string]: 'numeric' | 'categorical' } = {};
        cols.forEach(col => {
          const firstValue = data[0][col];
          types[col] = typeof firstValue === 'number' ? 'numeric' : 'categorical';
        });
        setFeatureTypes(types);
        
        setShowConfiguration(true);
        toast.success(`CSV loaded: ${data.length} rows, ${cols.length} columns`);
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      },
    });
  };

  // add or remove a feature from selection
  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    );
  };

  // user clicks confirm button
  const handleConfirm = () => {
    // make sure they picked stuff
    if (selectedFeatures.length === 0) {
      toast.error("Please select at least one feature");
      return;
    }
    if (!targetVariable) {
      toast.error("Please select a target variable to predict");
      return;
    }
    if (selectedFeatures.includes(targetVariable)) {
      toast.error("Target variable cannot be a feature");
      return;
    }

    // bundle it all up
    const config: FeatureConfig = {
      features: selectedFeatures,
      target: targetVariable,
      featureTypes: featureTypes,
    };

    onDataLoaded(csvData, config);
  };

  return (
    <Card className="p-4">
      {!showConfiguration ? (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border border-dashed rounded p-8 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <p className="text-sm mb-3">Drop CSV file or</p>
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                Browse
                <input type="file" accept=".csv" onChange={handleFileInput} className="hidden" />
              </label>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            CSV with headers required. Include numeric/categorical features and target variable.
          </p>
        </>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded text-sm">
            <p className="font-medium">{uploadedFile?.name}</p>
            <p className="text-xs text-muted-foreground">
              {csvData.length} rows, {columns.length} columns
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm mb-2 block">Target Variable</Label>
              <Select value={targetVariable} onValueChange={setTargetVariable}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Features ({selectedFeatures.length})</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                {columns.map((col) => (
                  <div key={col} className="flex items-center space-x-2">
                    <Checkbox
                      id={col}
                      checked={selectedFeatures.includes(col)}
                      onCheckedChange={() => handleFeatureToggle(col)}
                      disabled={col === targetVariable}
                    />
                    <label htmlFor={col} className="text-xs cursor-pointer truncate">
                      {col}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleConfirm} disabled={selectedFeatures.length === 0 || !targetVariable} className="flex-1" size="sm">
              Confirm
            </Button>
            <Button onClick={() => {
                setShowConfiguration(false);
                setUploadedFile(null);
                setCsvData([]);
                setColumns([]);
                setSelectedFeatures([]);
                setTargetVariable("");
              }} variant="outline" size="sm">
              Clear
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default FileUpload;
