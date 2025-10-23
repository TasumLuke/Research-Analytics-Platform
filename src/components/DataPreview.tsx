// shows a preview of uploaded data with stats
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/user-interface/table";
import { Card } from "@/components/user-interface/card";
import { Badge } from "@/components/user-interface/badge";
import { ResearchData, FeatureConfig } from "@/views/types";

interface DataPreviewProps {
  data: ResearchData[];
  featureConfig: FeatureConfig;
}

const DataPreview = ({ data, featureConfig }: DataPreviewProps) => {
  // calculate basic stats for a column
  const calculateStats = (column: string) => {
    const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined);
    
    if (featureConfig.featureTypes[column] === 'numeric') {
      // numeric column - calculate mean, median, etc
      const numericValues = values.filter(v => typeof v === 'number') as number[];
      const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      const sorted = [...numericValues].sort((a, b) => a - b);
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
      const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length;
      const std = Math.sqrt(variance);
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);

      return { type: 'numeric', mean: mean.toFixed(3), median: median.toFixed(3), std: std.toFixed(3), min: min.toFixed(3), max: max.toFixed(3), count: numericValues.length };
    } else {
      // categorical column - count unique values
      const counts: { [key: string]: number } = {};
      values.forEach(v => {
        const key = String(v);
        counts[key] = (counts[key] || 0) + 1;
      });
      const uniqueValues = Object.keys(counts).length;
      const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

      return { type: 'categorical', unique: uniqueValues, mostCommon: mostCommon?.[0] || 'N/A', mostCommonCount: mostCommon?.[1] || 0, count: values.length };
    }
  };

  const allColumns = [...featureConfig.features, featureConfig.target];
  const statsData = allColumns.map(col => ({ column: col, stats: calculateStats(col) }));

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Statistics</h3>
        <div className="space-y-3">
          {statsData.map(({ column, stats }) => (
            <div key={column} className="p-2 border rounded text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{column}</span>
                <div className="flex gap-1">
                  <Badge variant={column === featureConfig.target ? "default" : "secondary"} className="text-xs h-4">
                    {column === featureConfig.target ? "Target" : "Feature"}
                  </Badge>
                </div>
              </div>

              {stats.type === 'numeric' ? (
                <div className="grid grid-cols-5 gap-2 text-xs">
                  <div><p className="text-muted-foreground">Mean</p><p className="font-mono">{stats.mean}</p></div>
                  <div><p className="text-muted-foreground">Med</p><p className="font-mono">{stats.median}</p></div>
                  <div><p className="text-muted-foreground">SD</p><p className="font-mono">{stats.std}</p></div>
                  <div><p className="text-muted-foreground">Min</p><p className="font-mono">{stats.min}</p></div>
                  <div><p className="text-muted-foreground">Max</p><p className="font-mono">{stats.max}</p></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-muted-foreground">Unique</p><p className="font-mono">{stats.unique}</p></div>
                  <div><p className="text-muted-foreground">Mode</p><p className="font-mono">{stats.mostCommon}</p></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Data ({data.length} rows)</h3>
        <div className="overflow-x-auto rounded border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 text-xs">#</TableHead>
                {allColumns.map((col) => (
                  <TableHead key={col} className="h-8 text-xs whitespace-nowrap">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 5).map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-xs">{idx + 1}</TableCell>
                  {allColumns.map((col) => (
                    <TableCell key={col} className="font-mono text-xs">
                      {typeof row[col] === 'number' ? (row[col] as number).toFixed(2) : String(row[col])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default DataPreview;
