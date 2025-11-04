// Purpose: to calculate descriptive statistics
import { Card } from "@/components/user-interface/card";
import { BarChart3 } from "lucide-react";
import { AnalysisData } from "@/views/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/user-interface/table";

/**
 * For DescriptiveStats component
 * @property {AnalysisData[]} data Array of data rows
 * @property {string[]} columns Names of columns in dataset
 * @property {{ [key: string]: 'numeric' | 'categorical' }} columnTypes Column names and types
 */
interface DescriptiveStatsProps {
  data: AnalysisData[];
  columns: string[];
  columnTypes: { [key: string]: 'numeric' | 'categorical' };
}

/**
 * Calculates and displays statistics for each column
 * @component
 * @param {DescriptiveStatsProps} props Component props
 * @returns {JSX.Element} Table of statistics
 */
const DescriptiveStats = ({ data, columns, columnTypes }: DescriptiveStatsProps) => {
  /**
   * Calculates stats for single column
   * @param {string} column Column name to calculate stats
   * @returns {object} Stats object (changes depending on column type)
   */
  const calculateStats = (column: string) => {
    const values = data.map(row => row[column]);
    
    if (columnTypes[column] === 'numeric') {
      // numeric stats
      const numValues = values.filter(v => typeof v === 'number') as number[];
      const sorted = [...numValues].sort((a, b) => a - b);
      
      const mean = numValues.reduce((a, b) => a + b, 0) / numValues.length;
      const median = sorted[Math.floor(sorted.length / 2)];
      const variance = numValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numValues.length;
      const std = Math.sqrt(variance);
      const min = Math.min(...numValues);
      const max = Math.max(...numValues);
      
      return {
        count: numValues.length,
        mean: mean.toFixed(3),
        median: median.toFixed(3),
        std: std.toFixed(3),
        min: min.toFixed(3),
        max: max.toFixed(3),
        type: 'numeric' as const
      };
    } else {
      // categorical stats
      const uniqueValues = [...new Set(values.map(v => String(v)))];
      const counts = uniqueValues.map(val => ({
        value: val,
        count: values.filter(v => String(v) === val).length
      }));
      const mostCommon = counts.sort((a, b) => b.count - a.count)[0];
      
      return {
        count: values.length,
        unique: uniqueValues.length,
        mostCommon: mostCommon.value,
        mostCommonCount: mostCommon.count,
        type: 'categorical' as const
      };
    }
  };

  const stats = columns.map(col => ({
    column: col,
    ...calculateStats(col)
  }));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium">Descriptive Statistics</h2>
          <p className="text-sm text-muted-foreground">
            Summary stats for your dataset
          </p>
        </div>

        <div className="space-y-8">
          {/* numeric variables */}
          <div>
            <h3 className="text-sm font-medium mb-4">Numerical Variables</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variable</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Mean</TableHead>
                    <TableHead>Median</TableHead>
                    <TableHead>Std Dev</TableHead>
                    <TableHead>Min</TableHead>
                    <TableHead>Max</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.filter(s => s.type === 'numeric').map((stat) => (
                    <TableRow key={stat.column}>
                      <TableCell className="font-medium">{stat.column}</TableCell>
                      <TableCell>{stat.count}</TableCell>
                      <TableCell>{stat.mean}</TableCell>
                      <TableCell>{stat.median}</TableCell>
                      <TableCell>{stat.std}</TableCell>
                      <TableCell>{stat.min}</TableCell>
                      <TableCell>{stat.max}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* categorical variables */}
          <div>
            <h3 className="text-sm font-medium mb-4">Categorical Variables</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variable</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Unique Values</TableHead>
                    <TableHead>Most Common</TableHead>
                    <TableHead>Frequency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.filter(s => s.type === 'categorical').map((stat) => (
                    <TableRow key={stat.column}>
                      <TableCell className="font-medium">{stat.column}</TableCell>
                      <TableCell>{stat.count}</TableCell>
                      <TableCell>{stat.unique}</TableCell>
                      <TableCell>{stat.mostCommon}</TableCell>
                      <TableCell>{stat.mostCommonCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DescriptiveStats;
