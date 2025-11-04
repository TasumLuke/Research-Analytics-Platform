/**
 * CSV File Upload & Configuration Component
 * Handles file selection, parsing with PapaParse, and feature/target selection
 */
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

/**
 * CSV file upload, parsing, and configuration
 * @component
 * @param {Object} props Component props
 * @param {(data: ResearchData[], config: FeatureConfig) => void} props.onDataLoaded Successful CSV loading and parsing
 * @returns {JSX.Element} Rendered CSV upload
 */
const FileUpload = ({ onDataLoaded }: FileUploadProps) => {
  // drag & drop UI state
   const [dragging, setDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // CSV parsing results
  const [parsedData, setParsedData] = useState<ResearchData[]>([]);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  
  // user selections for ML configuration
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [targetVariable, setTargetVariable] = useState<string>("");
  const [columnTypes, setColumnTypes] = useState<{ [key: string]: 'numeric' | 'categorical' }>({});
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // handle drag & drop
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      parseFile(droppedFile);
    } else {
      toast.error("Please upload a CSV file");
    }
  };

  // handle file input click
  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      parseFile(selectedFile);
    }
  };

  // parse CSV using PapaParse library
  const parseFile = (csvFile: File) => {
    setUploadedFile(csvFile);
    Papa.parse(csvFile, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as ResearchData[];
        if (data.length === 0) {
          toast.error("File is empty");
          return;
        }

        // extract column headers
        const columns = Object.keys(data[0]);
        setParsedData(data);
        setColumnNames(columns);
        
        // auto-detect column types (numeric vs categorical)
        const detectedTypes: { [key: string]: 'numeric' | 'categorical' } = {};
        columns.forEach(col => {
          const firstValue = data[0][col];
          detectedTypes[col] = typeof firstValue === 'number' ? 'numeric' : 'categorical';
        });
        setColumnTypes(detectedTypes);
        
        setShowConfigPanel(true);
        toast.success(`Loaded ${data.length} rows with ${columns.length} columns`);
      },
      error: (err) => {
        toast.error(`Parse error: ${err.message}`);
      },
    });
  };

  // toggle feature in selection list
  const toggleFeature = (featureName: string) => {
    setSelectedFeatures(prev =>
      prev.includes(featureName) ? prev.filter(f => f !== featureName) : [...prev, featureName]
    );
  };

  // validate and submit configuration
  const confirm = () => {
    // basic validation checks
    if (selectedFeatures.length === 0) {
      toast.error("Please select at least one feature");
      return;
    }
    if (!targetVariable) {
      toast.error("Please select a target variable");
      return;
    }
    if (selectedFeatures.includes(targetVariable)) {
      toast.error("Target variable cannot also be a feature");
      return;
    }

    // build configuration object
    const featureConfiguration: FeatureConfig = {
      features: selectedFeatures,
      target: targetVariable,
      featureTypes: columnTypes,
    };

    onDataLoaded(parsedData, featureConfiguration);
  };

  return (
    <Card className="p-4">
      {!showConfigPanel ? (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`border border-dashed rounded p-8 text-center transition-colors ${
              dragging ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <p className="text-sm mb-3">Drop CSV or</p>
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                Browse
                <input type="file" accept=".csv" onChange={onFileInput} className="hidden" />
              </label>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Need CSV with headers - numeric/categorical features + target
          </p>
        </>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded text-sm">
            <p className="font-medium">{uploadedFile?.name}</p>
            <p className="text-xs text-muted-foreground">
              {parsedData.length} rows, {columnNames.length} columns
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
                  {columnNames.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Features ({selectedFeatures.length} selected)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                {columnNames.map((col) => (
                  <div key={col} className="flex items-center space-x-2">
                    <Checkbox
                      id={col}
                      checked={selectedFeatures.includes(col)}
                      onCheckedChange={() => toggleFeature(col)}
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
            <Button onClick={confirm} disabled={selectedFeatures.length === 0 || !targetVariable} className="flex-1" size="sm">
              Confirm Configuration
            </Button>
            <Button onClick={() => {
                setShowConfigPanel(false);
                setUploadedFile(null);
                setParsedData([]);
                setColumnNames([]);
                setSelectedFeatures([]);
                setTargetVariable("");
              }} variant="outline" size="sm">
              Reset
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default FileUpload;
