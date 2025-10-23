// make charts from data
import { useState, useRef } from "react";
import { Card } from "@/components/user-interface/card";
import { Label } from "@/components/user-interface/label";
import { Button } from "@/components/user-interface/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { AnalysisData } from "@/views/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/user-interface/select";
import {
  BarChart,
  Bar,
  LineChart as RechartsLine,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from "recharts";

interface DataVisualizationProps {
  data: AnalysisData[];
  columns: string[];
  columnTypes: { [key: string]: 'numeric' | 'categorical' };
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent))'];

const DataVisualization = ({ data, columns, columnTypes }: DataVisualizationProps) => {
  const [chartType, setChartType] = useState<string>("bar");
  const [xAxis, setXAxis] = useState<string>("");
  const [yAxis, setYAxis] = useState<string>("");
  const chartRef = useRef<HTMLDivElement>(null);

  // download chart as jpg
  const downloadChart = () => {
    if (!chartRef.current) return;
    
    // get the svg element
    const svgElement = chartRef.current.querySelector('svg');
    if (!svgElement) {
      toast.error("No chart to download");
      return;
    }

    // convert svg to image
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // set canvas size
    canvas.width = svgElement.clientWidth;
    canvas.height = svgElement.clientHeight;
    
    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // download as jpg
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `chart-${Date.now()}.jpg`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("Chart downloaded");
          }
        }, 'image/jpeg');
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // separate numeric and categorical columns
  const numericColumns = columns.filter(col => columnTypes[col] === 'numeric');
  const categoricalColumns = columns.filter(col => columnTypes[col] === 'categorical');

  // format data depending on chart type
  const prepareChartData = () => {
    if (!xAxis) return [];

    // pie chart - count categories
    if (chartType === "pie" && categoricalColumns.includes(xAxis)) {
      const counts = data.reduce((acc: any, row) => {
        const val = String(row[xAxis]);
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }

    // scatter plot - x vs y
    if (chartType === "scatter" && xAxis && yAxis) {
      return data.map((row, idx) => ({
        x: Number(row[xAxis]),
        y: Number(row[yAxis]),
        name: `Point ${idx + 1}`
      }));
    }

    // grouped bar - average y for each x category
    if (categoricalColumns.includes(xAxis) && yAxis && numericColumns.includes(yAxis)) {
      const grouped = data.reduce((acc: any, row) => {
        const key = String(row[xAxis]);
        if (!acc[key]) acc[key] = [];
        acc[key].push(Number(row[yAxis]));
        return acc;
      }, {});

      return Object.entries(grouped).map(([name, values]: [string, any]) => ({
        name,
        value: values.reduce((a: number, b: number) => a + b, 0) / values.length
      }));
    }

    // default - just show first 20 rows
    return data.slice(0, 20).map((row, idx) => ({
      name: xAxis ? String(row[xAxis]) : `Sample ${idx + 1}`,
      value: yAxis ? Number(row[yAxis]) : 0
    }));
  };

  const chartData = prepareChartData();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">Visualization</h2>
            <p className="text-xs text-muted-foreground">
              Charts with regression
            </p>
          </div>
          {chartData.length > 0 && (
            <Button onClick={downloadChart} size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download JPG
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <div>
            <Label className="text-xs">Chart</Label>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="scatter">Scatter</SelectItem>
                <SelectItem value="pie">Pie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">X-Axis</Label>
            <Select value={xAxis} onValueChange={setXAxis}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {columns.map(col => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {chartType !== "pie" && (
            <div>
              <Label className="text-xs">Y-Axis</Label>
              <Select value={yAxis} onValueChange={setYAxis}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {numericColumns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {chartData.length > 0 && (
          <div ref={chartRef} className="h-[300px] w-full">
            {chartType === "pie" ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8b5cf6"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                ) : chartType === "line" ? (
                  <RechartsLine data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </RechartsLine>
                ) : (
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="x" name={xAxis} type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="y" name={yAxis} type="number" stroke="hsl(var(--muted-foreground))" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Scatter data={chartData} fill="hsl(var(--primary))" />
                    {chartData.length > 1 && chartType === "scatter" && (() => {
                      // draw line of best fit
                      const scatterData = chartData as { x: number; y: number; name: string }[];
                      const n = scatterData.length;
                      const sumX = scatterData.reduce((s, p) => s + p.x, 0);
                      const sumY = scatterData.reduce((s, p) => s + p.y, 0);
                      const sumXY = scatterData.reduce((s, p) => s + p.x * p.y, 0);
                      const sumX2 = scatterData.reduce((s, p) => s + p.x * p.x, 0);
                      
                      // y = mx + b
                      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
                      const intercept = (sumY - slope * sumX) / n;
                      
                      const xMin = Math.min(...scatterData.map(p => p.x));
                      const xMax = Math.max(...scatterData.map(p => p.x));
                      const regressionLine = [
                        { x: xMin, y: slope * xMin + intercept },
                        { x: xMax, y: slope * xMax + intercept }
                      ];
                      
                      // calculate r squared
                      const yMean = sumY / n;
                      const ssTotal = scatterData.reduce((s, p) => s + Math.pow(p.y - yMean, 2), 0);
                      const ssResidual = scatterData.reduce((s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
                      const r2 = 1 - (ssResidual / ssTotal);
                      
                      return (
                        <>
                          <Scatter 
                            data={regressionLine} 
                            fill="none" 
                            line={{ stroke: 'hsl(var(--destructive))', strokeWidth: 2 }} 
                            shape="circle"
                            name={`Best Fit (R²=${r2.toFixed(3)})`}
                          />
                        </>
                      );
                    })()}
                    <Legend />
                  </ScatterChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DataVisualization;
