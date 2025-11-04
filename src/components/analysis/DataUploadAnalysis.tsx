// Purpose: upload csv for data analysis
import { useState } from "react";
import { Card } from "@/components/user-interface/card";
import { Button } from "@/components/user-interface/button";
import Papa from "papaparse";
import { AnalysisData } from "@/views/types";

/**
 * For DataUploadAnalysis component.
 * @property {(data: AnalysisData[], columns: string[], columnTypes: { [key: string]: 'numeric' | 'categorical' }) => void} onDataLoaded
 * CSV data is successfully loaded and parsed.
 */
interface DataUploadAnalysisProps {
  onDataLoaded: (data: AnalysisData[], columns: string[], columnTypes: { [key: string]: 'numeric' | 'categorical' }) => void;
}

/**
 * Allows users to upload CSV file: Parses CSV files, detects numeric vs categorical, calls onDataLoaded when successful
 * @component
 * @param {DataUploadAnalysisProps} props Component props
 * @returns {JSX.Element} Rendered file upload UI
 */
const DataUploadAnalysis = ({ onDataLoaded }: DataUploadAnalysisProps) => {
  const [fileName, setFileName] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(false);

  /**
   * Determines if column is numerical or categorical
   * @param {any[]} values Array of column values
   * @returns {'numeric' | 'categorical'} Column type
   */
  const detectColumnType = (values: any[]): 'numeric' | 'categorical' => {
    const numericCount = values.filter(v => !isNaN(parseFloat(v)) && isFinite(v)).length;
    return numericCount / values.length > 0.8 ? 'numeric' : 'categorical';
  };

  /**
   * CSV file selection: parses file and determines column type. Calls onDataLoaded when successful
   * @param {React.ChangeEvent<HTMLInputElement>} event File input event
   */
  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as AnalysisData[];
        
        if (data.length < 3) {
          alert("Dataset must have at least 3 samples");
          return;
        }

        const columns = Object.keys(data[0]);
        const columnTypes: { [key: string]: 'numeric' | 'categorical' } = {};

        columns.forEach(col => {
          const values = data.map(row => row[col]);
          columnTypes[col] = detectColumnType(values);
        });

        setIsValid(true);
        onDataLoaded(data, columns, columnTypes);
      },
      error: (error) => {
        alert(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="border border-dashed rounded p-6 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="hidden"
            id="csv-upload-analysis"
          />
          <label htmlFor="csv-upload-analysis" className="cursor-pointer">
            <p className="text-sm mb-2">
              {fileName || "Click to upload CSV"}
            </p>
            <p className="text-xs text-muted-foreground">
              Numerical or categorical data
            </p>
          </label>
        </div>

        {isValid && (
          <div className="p-2 bg-muted rounded text-xs text-center">
            Data loaded. Use tabs above to analyze.
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          First row must contain headers. Minimum 3 samples.
        </p>
      </div>
    </Card>
  );
};

export default DataUploadAnalysis;
