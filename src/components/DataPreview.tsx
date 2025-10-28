// data preview with some stats
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/user-interface/table";
import { Card } from "@/components/user-interface/card";
import { Badge } from "@/components/user-interface/badge";
import { ResearchData, FeatureConfig } from "@/views/types";

interface DataPreviewProps {
  data: ResearchData[];
  featureConfig: FeatureConfig;
}

const DataPreview = ({ data, featureConfig }: DataPreviewProps) => {
  // calc stats for each column
  const getStats = (col: string) => {
    const vals = data.map(row => row[col]).filter(v => v !== null && v !== undefined);
    
    if (featureConfig.featureTypes[col] === 'numeric') {
      // numbers - do mean, median etc
      const nums = vals.filter(v => typeof v === 'number') as number[];
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      const sorted = [...nums].sort((a, b) => a - b);
      const med = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
      const variance = nums.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / nums.length;
      const stdDev = Math.sqrt(variance);
      const minVal = Math.min(...nums);
      const maxVal = Math.max(...nums);

      return { type: 'numeric', mean: avg.toFixed(3), median: med.toFixed(3), std: stdDev.toFixed(3), min: minVal.toFixed(3), max: maxVal.toFixed(3), count: nums.length };
    } else {
      // text - count unique
      const counts: { [key: string]: number } = {};
      vals.forEach(v => {
        const k = String(v);
        counts[k] = (counts[k] || 0) + 1;
      });
      const uniq = Object.keys(counts).length;
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

      return { type: 'categorical', unique: uniq, mostCommon: top?.[0] || 'N/A', mostCommonCount: top?.[1] || 0, count: vals.length };
    }
  };

  const allCols = [...featureConfig.features, featureConfig.target];
  const statsData = allCols.map(col => ({ column: col, stats: getStats(col) }));

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
                {allCols.map((col) => (
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
                  {allCols.map((col) => (
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
