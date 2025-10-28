// csv upload and setup
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
  // drag and drop stuff
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  // parsed data
  const [parsedData, setParsedData] = useState<ResearchData[]>([]);
  const [cols, setCols] = useState<string[]>([]);
  
  // what user picked
  const [pickedFeatures, setPickedFeatures] = useState<string[]>([]);
  const [target, setTarget] = useState<string>("");
  const [types, setTypes] = useState<{ [key: string]: 'numeric' | 'categorical' }>({});
  const [showConfig, setShowConfig] = useState(false);

  // when they drop a file
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      parseFile(droppedFile);
    } else {
      toast.error("Need a CSV file");
    }
  };

  // when they click browse
  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      parseFile(selectedFile);
    }
  };

  // parse csv
  const parseFile = (csvFile: File) => {
    setFile(csvFile);
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

        // grab columns
        const columns = Object.keys(data[0]);
        setParsedData(data);
        setCols(columns);
        
        // check if numeric or not
        const colTypes: { [key: string]: 'numeric' | 'categorical' } = {};
        columns.forEach(col => {
          const val = data[0][col];
          colTypes[col] = typeof val === 'number' ? 'numeric' : 'categorical';
        });
        setTypes(colTypes);
        
        setShowConfig(true);
        toast.success(`Loaded ${data.length} rows, ${columns.length} cols`);
      },
      error: (err) => {
        toast.error(`Parse error: ${err.message}`);
      },
    });
  };

  // toggle feature selection
  const toggleFeature = (feat: string) => {
    setPickedFeatures(prev =>
      prev.includes(feat) ? prev.filter(f => f !== feat) : [...prev, feat]
    );
  };

  // confirm and send data up
  const confirm = () => {
    // validation
    if (pickedFeatures.length === 0) {
      toast.error("Pick at least one feature");
      return;
    }
    if (!target) {
      toast.error("Pick a target variable");
      return;
    }
    if (pickedFeatures.includes(target)) {
      toast.error("Target can't be a feature");
      return;
    }

    // make config
    const cfg: FeatureConfig = {
      features: pickedFeatures,
      target: target,
      featureTypes: types,
    };

    onDataLoaded(parsedData, cfg);
  };

  return (
    <Card className="p-4">
      {!showConfig ? (
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
            <p className="font-medium">{file?.name}</p>
            <p className="text-xs text-muted-foreground">
              {parsedData.length} rows, {cols.length} cols
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm mb-2 block">Target Variable</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Pick target" />
                </SelectTrigger>
                <SelectContent>
                  {cols.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Features ({pickedFeatures.length})</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                {cols.map((col) => (
                  <div key={col} className="flex items-center space-x-2">
                    <Checkbox
                      id={col}
                      checked={pickedFeatures.includes(col)}
                      onCheckedChange={() => toggleFeature(col)}
                      disabled={col === target}
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
            <Button onClick={confirm} disabled={pickedFeatures.length === 0 || !target} className="flex-1" size="sm">
              Confirm
            </Button>
            <Button onClick={() => {
                setShowConfig(false);
                setFile(null);
                setParsedData([]);
                setCols([]);
                setPickedFeatures([]);
                setTarget("");
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
